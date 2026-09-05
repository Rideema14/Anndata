import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { emitOrderUpdate } from '../../config/socket';
import { notifyUser } from '../notification/notification.service';
import { recordAudit } from './auditLog.service';
import { AUDIT_ACTIONS, PRE_SHIPMENT_STATUSES } from './shipment.constants';
import { getCourier, normalizeAwb, validateAwbFormat, getCourierTrackingLink } from './courier.config';
import type { SubmitShipmentInput } from './order.validation';

const ORDER_FOR_SHIPMENT_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, slug: true, sellerId: true } } } },
  payment: true,
  shipment: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

/**
 * The seller's shipment form (requirement #3): courier + AWB, submitted
 * exactly once. Validates the AWB's shape against courier.config.ts,
 * rejects a duplicate AWB across other active orders (requirement #5), then
 * moves the order straight to SHIPPED (requirement #6) — there is no
 * automatic tracking provider left to confirm pickup separately, so
 * "shipment submitted" and "order shipped" happen in the same step. The
 * seller cannot mark an order delivered/returned or touch settlement from
 * here or anywhere else (requirement #3/#29) — this function is their
 * entire shipment-related surface.
 */
export async function submitShipment(idOrNumber: string, user: User, input: SubmitShipmentInput) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: ORDER_FOR_SHIPMENT_INCLUDE,
  });
  if (!order) throw ApiError.notFound('Order not found.');

  const isSellerOnOrder = order.items.some((item) => item.product?.sellerId === user.id);
  if (user.role !== 'ADMIN' && !isSellerOnOrder) {
    throw ApiError.forbidden('You do not have permission to manage shipment for this order.');
  }

  if (order.payment?.status !== 'PAID') {
    throw ApiError.badRequest('This order has not been paid for yet.');
  }
  if (order.shipment) {
    throw ApiError.conflict('Shipment information has already been submitted for this order.');
  }
  if (!PRE_SHIPMENT_STATUSES.includes(order.status)) {
    throw ApiError.badRequest(`Shipment can no longer be submitted — this order is already ${order.status.toLowerCase()}.`);
  }

  const courier = getCourier(input.carrierCode);
  if (!courier) throw ApiError.badRequest('Unsupported courier selected.');

  const normalizedAwb = normalizeAwb(input.awb);
  const validation = validateAwbFormat(input.carrierCode, normalizedAwb);
  if (!validation.valid) {
    await recordAudit({
      orderId: order.id,
      action: AUDIT_ACTIONS.SELLER_AWB_REJECTED,
      actorId: user.id,
      actorRole: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
      source: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
      metadata: { carrierCode: input.carrierCode, awb: input.awb, reason: validation.reason },
    });
    throw ApiError.badRequest(validation.reason ?? 'Invalid AWB / tracking number.');
  }

  // Requirement #5: the same AWB (for the same courier) can't be attached
  // to another order that's still active — a returned/cancelled order
  // freeing up its AWB is a legitimate edge case (e.g. the seller re-ships
  // the same parcel under the same tracking number after a courier mixup),
  // so those are excluded from the duplicate check.
  const duplicate = await prisma.shipment.findFirst({
    where: {
      normalizedAwb,
      carrierCode: input.carrierCode,
      orderId: { not: order.id },
      order: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
    },
    select: { orderId: true },
  });
  if (duplicate) {
    await recordAudit({
      orderId: order.id,
      action: AUDIT_ACTIONS.SELLER_AWB_REJECTED,
      actorId: user.id,
      actorRole: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
      source: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
      metadata: { carrierCode: input.carrierCode, normalizedAwb, reason: 'DUPLICATE_AWB', conflictingOrderId: duplicate.orderId },
    });
    throw ApiError.conflict('This tracking number is already associated with another active order.');
  }

  const submittingSellerId = user.role === 'ADMIN' ? (order.items.find((i) => i.product?.sellerId)?.product?.sellerId ?? user.id) : user.id;

  const updated = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        orderId: order.id,
        sellerId: submittingSellerId,
        carrierCode: input.carrierCode,
        carrierName: input.carrierCode === 'OTHER' ? input.carrierName : courier.name,
        awb: input.awb.trim(),
        normalizedAwb,
        shipmentDate: input.shipmentDate ? new Date(input.shipmentDate) : undefined,
        note: input.note,
        submittedById: user.id,
      },
    });

    const result = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        statusHistory: {
          create: {
            status: 'SHIPPED',
            note: `Shipped via ${shipment.carrierName ?? courier.name} — AWB ${shipment.awb}.`,
            changedById: user.id,
          },
        },
      },
      include: { shipment: true },
    });

    return { shipment, order: result };
  });

  await recordAudit({
    orderId: order.id,
    shipmentId: updated.shipment.id,
    action: AUDIT_ACTIONS.SELLER_SUBMITTED_AWB,
    actorId: user.id,
    actorRole: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
    source: user.role === 'ADMIN' ? 'ADMIN' : 'SELLER',
    previousState: order.status,
    newState: 'SHIPPED',
    metadata: { carrierCode: input.carrierCode, normalizedAwb },
  });

  emitOrderUpdate(updated.order);

  // Requirement #10 — buyer email + in-app notification, exactly once
  // (guaranteed by the shipment.orderId unique constraint above: a retried
  // request fails at shipment creation with a 409 before ever reaching
  // this notification call).
  const { url: trackingUrl } = getCourierTrackingLink(input.carrierCode, updated.shipment.awb);
  await notifyUser({
    userId: order.userId,
    type: 'ORDER_STATUS',
    title: `Your order has been shipped!`,
    message: `Order #${order.orderNumber} has been shipped via ${updated.shipment.carrierName ?? courier.name}. Tracking number: ${updated.shipment.awb}.`,
    relatedEntityType: 'ORDER',
    relatedEntityId: order.id,
    email: {
      subject: `Your order #${order.orderNumber} has been shipped!`,
      html: `
        <p>Hi ${order.user.name},</p>
        <p>Good news — your order <b>#${order.orderNumber}</b> has been shipped.</p>
        <p><b>Courier:</b> ${updated.shipment.carrierName ?? courier.name}<br/>
        <b>Tracking number:</b> ${updated.shipment.awb}</p>
        ${trackingUrl ? `<p><a href="${trackingUrl}">Track Your Shipment</a></p>` : ''}
        <p>You can also view this anytime from "My Orders" on your account.</p>
      `,
    },
  });

  return updated.order;
}

/** GET /orders/:id/shipment — read-only shipment detail, including the buyer/admin-facing tracking link (requirement #9/#13). */
export async function getShipmentForOrder(idOrNumber: string, user: User) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: { items: { include: { product: { select: { sellerId: true } } } }, shipment: true },
  });
  if (!order) throw ApiError.notFound('Order not found.');

  const isSellerOnOrder = order.items.some((item) => item.product?.sellerId === user.id);
  const isOwner = order.userId === user.id;
  if (user.role !== 'ADMIN' && !isOwner && !isSellerOnOrder) {
    throw ApiError.forbidden('You do not have permission to view this shipment.');
  }

  if (!order.shipment) return null;

  const { url, isDirect } = getCourierTrackingLink(order.shipment.carrierCode, order.shipment.awb);
  return { ...order.shipment, trackingUrl: url || null, trackingUrlIsDirect: isDirect };
}
