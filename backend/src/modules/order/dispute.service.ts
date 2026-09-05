import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { emitOrderUpdate } from '../../config/socket';
import { notifyUser } from '../notification/notification.service';
import { recordAudit } from './auditLog.service';
import { AUDIT_ACTIONS } from './shipment.constants';
import * as settlementService from './settlement.service';
import type { CreateDisputeInput } from './order.validation';

/**
 * Buyer reports a delivery problem on an order the admin has already marked
 * delivered (requirement #9). Puts the order on hold (DISPUTED) so it stops
 * being treated as successfully completed, and — if it had already been
 * auto-settled in the seller's favor — reopens the settlement for admin
 * review instead of letting a disputed order's money quietly stay decided.
 */
export async function createDispute(idOrNumber: string, user: User, input: CreateDisputeInput) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: { items: { include: { product: { select: { sellerId: true } } } }, disputes: true, shipment: true },
  });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.userId !== user.id) throw ApiError.forbidden('You do not have permission to report a problem with this order.');

  if (order.status !== 'DELIVERED') {
    throw ApiError.badRequest('You can only report a delivery problem once the order has been marked delivered.');
  }
  const openDispute = order.disputes.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
  if (openDispute) {
    throw ApiError.conflict('A dispute for this order is already open and under review.');
  }

  const [dispute] = await prisma.$transaction([
    prisma.dispute.create({
      data: { orderId: order.id, userId: user.id, reason: input.reason, details: input.details },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'DISPUTED', statusHistory: { create: { status: 'DISPUTED', note: `Buyer reported a problem: ${input.reason}`, changedById: user.id } } },
    }),
  ]);

  await recordAudit({
    orderId: order.id,
    shipmentId: order.shipment?.id,
    action: AUDIT_ACTIONS.CUSTOMER_CREATED_DISPUTE,
    actorId: user.id,
    actorRole: 'CUSTOMER',
    source: 'CUSTOMER',
    previousState: 'DELIVERED',
    newState: 'DISPUTED',
    metadata: { reason: input.reason },
  });

  // Requirement #17/#22: a dispute means this order's money can no longer
  // be treated as a closed, successful case — put it back under review
  // even if it had already been auto-settled to the seller.
  if (order.settlementStatus === 'SELLER_PAYOUT_PENDING' || order.settlementStatus === 'SELLER_PAID') {
    await settlementService.moveSettlementToReview(order.id, order, `Buyer opened a delivery dispute: ${input.reason}`, {
      id: user.id,
      role: 'CUSTOMER',
    });
  }

  const refreshedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  emitOrderUpdate(refreshedOrder);

  // Notify the seller(s) — they can't act on it directly (admin owns
  // dispute resolution) but should know their delivery is being questioned.
  const sellerIds = [...new Set(order.items.map((i) => i.product?.sellerId).filter((id): id is string => Boolean(id)))];
  await Promise.all(
    sellerIds.map((sellerId: string) =>
      notifyUser({
        userId: sellerId,
        type: 'ORDER_STATUS',
        title: `Delivery dispute opened — order #${order.orderNumber}`,
        message: `The buyer has reported a problem with a delivered order. It's on hold pending admin review.`,
        relatedEntityType: 'ORDER',
        relatedEntityId: order.id,
      }).catch(() => {})
    )
  );

  return dispute;
}

/** Lists the current user's own disputes (used by the customer order-history view; admin review lives in admin.service.ts). */
export async function listMyDisputes(user: User) {
  return prisma.dispute.findMany({
    where: { userId: user.id },
    include: { order: { select: { id: true, orderNumber: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
