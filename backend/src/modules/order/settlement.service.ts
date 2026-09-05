import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { notifyUser } from '../notification/notification.service';
import { recordAudit } from './auditLog.service';
import { AUDIT_ACTIONS } from './shipment.constants';

// ---------------------------------------------------------------------------
// Requirements #16–#26: settlement is a concept deliberately separate from
// OrderStatus (fulfillment outcome) and PaymentStatus (gateway state). This
// module is the only place that ever writes to the `settlements` table or
// Order.settlementStatus — order.service.ts and dispute.service.ts call
// into the helpers below instead of touching either directly, so there's a
// single source of truth for the settlement state machine.
// ---------------------------------------------------------------------------

interface OrderMoney {
  subtotal: unknown;
  shippingFee: unknown;
  tax: unknown;
}

function computeOrderMoney(order: OrderMoney) {
  const productAmount = Math.round(Number(order.subtotal) * 100) / 100;
  const platformAmount = Math.round((Number(order.shippingFee) + Number(order.tax)) * 100) / 100;
  const buyerPaidTotal = Math.round((productAmount + platformAmount) * 100) / 100;
  return { buyerPaidTotal, productAmount, platformAmount };
}

/**
 * Creates the automatic "happy path" settlement (requirement #21): a normal
 * order, delivered with no dispute/failure history, needs no admin
 * decision — the seller becomes eligible for their product amount and the
 * platform keeps its charge, immediately.
 *
 * Only ever called from order.service.ts's updateStatus, and only when the
 * order has exactly one distinct seller across its items (this project's
 * Order can technically span multiple sellers — see order.service.ts's
 * assertCanView comment — but there is no single "the seller" to
 * auto-settle in that case, so a multi-seller order is instead moved to
 * PENDING_REVIEW for an admin to settle each seller explicitly).
 */
export async function createAutomaticSettlement(
  orderId: string,
  order: { subtotal: unknown; shippingFee: unknown; tax: unknown; orderNumber: string },
  sellerId: string
): Promise<void> {
  const { buyerPaidTotal, productAmount, platformAmount } = computeOrderMoney(order);

  await prisma.$transaction([
    prisma.settlement.updateMany({ where: { orderId, isCurrent: true }, data: { isCurrent: false } }),
    prisma.settlement.create({
      data: {
        orderId,
        status: 'SELLER_PAYOUT_PENDING',
        decision: 'PAY_SELLER',
        sellerId,
        buyerPaidTotal,
        productAmount,
        platformAmount,
        amount: productAmount,
        isAutomatic: true,
        isCurrent: true,
        resolvedByRole: 'SYSTEM',
      },
    }),
    prisma.order.update({ where: { id: orderId }, data: { settlementStatus: 'SELLER_PAYOUT_PENDING' } }),
  ]);

  await recordAudit({
    orderId,
    action: AUDIT_ACTIONS.SETTLEMENT_AUTO_APPROVED,
    actorRole: 'SYSTEM',
    source: 'SYSTEM',
    previousState: 'NOT_ELIGIBLE',
    newState: 'SELLER_PAYOUT_PENDING',
    metadata: { amount: productAmount, sellerId },
  });

  notifyUser({
    userId: sellerId,
    type: 'PAYMENT',
    title: `Payout eligible — order #${order.orderNumber}`,
    message: `This order was delivered successfully. ₹${productAmount.toFixed(2)} is now eligible for payout to your account.`,
    relatedEntityType: 'ORDER',
    relatedEntityId: orderId,
  }).catch(() => {});
}

/**
 * Puts an order's settlement on hold for admin review (requirement #17/#22
 * — DELIVERY_FAILED, RETURNED, a paid-then-cancelled order, or a dispute
 * reopening an already-settled order all land here). Idempotent: calling it
 * again on an order that's already PENDING_REVIEW just records another
 * audit line, it doesn't create a meaningless duplicate "current" row.
 */
export async function moveSettlementToReview(
  orderId: string,
  order: { subtotal: unknown; shippingFee: unknown; tax: unknown; settlementStatus: string },
  reason: string,
  actor: { id: string; role: 'ADMIN' | 'CUSTOMER' } | null
): Promise<void> {
  if (order.settlementStatus === 'PENDING_REVIEW') {
    await recordAudit({
      orderId,
      action: AUDIT_ACTIONS.SETTLEMENT_MOVED_TO_REVIEW,
      actorId: actor?.id,
      actorRole: actor?.role ?? 'SYSTEM',
      source: actor?.role ?? 'SYSTEM',
      newState: 'PENDING_REVIEW',
      metadata: { reason, alreadyUnderReview: true },
    });
    return;
  }

  const { buyerPaidTotal, productAmount, platformAmount } = computeOrderMoney(order);

  await prisma.$transaction([
    prisma.settlement.updateMany({ where: { orderId, isCurrent: true }, data: { isCurrent: false } }),
    prisma.settlement.create({
      data: {
        orderId,
        status: 'PENDING_REVIEW',
        buyerPaidTotal,
        productAmount,
        platformAmount,
        amount: 0,
        reason,
        isCurrent: true,
        resolvedById: actor?.role === 'ADMIN' ? actor.id : undefined,
        resolvedByRole: actor?.role ?? 'SYSTEM',
      },
    }),
    prisma.order.update({ where: { id: orderId }, data: { settlementStatus: 'PENDING_REVIEW' } }),
  ]);

  await recordAudit({
    orderId,
    action: AUDIT_ACTIONS.SETTLEMENT_MOVED_TO_REVIEW,
    actorId: actor?.id,
    actorRole: actor?.role ?? 'SYSTEM',
    source: actor?.role ?? 'SYSTEM',
    previousState: order.settlementStatus,
    newState: 'PENDING_REVIEW',
    metadata: { reason },
  });
}

const ORDER_WITH_SETTLEMENT_ITEMS = {
  items: { include: { product: { select: { sellerId: true } } } },
  payment: true,
} as const;

export interface DecideSettlementInput {
  decision: 'REFUND_BUYER' | 'PAY_SELLER';
  sellerId?: string;
  reason: string;
}

/**
 * The admin's manual settlement decision (requirement #18–#20) for an order
 * currently PENDING_REVIEW. REFUND_BUYER always pays the buyer's full
 * totalAmount (product + platform charge + tax — requirement #19); PAY_SELLER
 * always pays only the recipient seller's product-line amount, never the
 * platform's cut (requirement #20).
 */
export async function decideSettlement(idOrNumber: string, admin: User, input: DecideSettlementInput) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: ORDER_WITH_SETTLEMENT_ITEMS,
  });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.settlementStatus !== 'PENDING_REVIEW') {
    throw ApiError.badRequest(
      order.settlementStatus === 'NOT_ELIGIBLE'
        ? 'This order has nothing to settle yet.'
        : `This order's settlement has already been decided (currently ${order.settlementStatus}). Use the correction action to change it.`
    );
  }

  const { buyerPaidTotal, productAmount: orderProductAmount, platformAmount } = computeOrderMoney(order);

  let recipientSellerId: string | null = null;
  let amount: number;
  let productAmount = orderProductAmount;

  if (input.decision === 'REFUND_BUYER') {
    amount = buyerPaidTotal;
  } else {
    const sellerIds = [...new Set(order.items.map((item) => item.product?.sellerId).filter((id): id is string => Boolean(id)))];
    if (sellerIds.length === 0) throw ApiError.badRequest('This order has no seller to pay out.');
    if (sellerIds.length === 1) {
      recipientSellerId = sellerIds[0];
    } else {
      if (!input.sellerId || !sellerIds.includes(input.sellerId)) {
        throw ApiError.badRequest('This order has items from multiple sellers — specify which seller to pay out (sellerId).');
      }
      recipientSellerId = input.sellerId;
    }
    const sellerItemsTotal = order.items
      .filter((item) => item.product?.sellerId === recipientSellerId)
      .reduce((sum, item) => sum + Number(item.totalPrice), 0);
    productAmount = Math.round(sellerItemsTotal * 100) / 100;
    amount = productAmount;
  }

  const newStatus = input.decision === 'REFUND_BUYER' ? 'BUYER_REFUND_PENDING' : 'SELLER_PAYOUT_PENDING';

  const settlement = await prisma.$transaction(async (tx) => {
    await tx.settlement.updateMany({ where: { orderId: order.id, isCurrent: true }, data: { isCurrent: false } });
    const created = await tx.settlement.create({
      data: {
        orderId: order.id,
        status: newStatus,
        decision: input.decision,
        sellerId: recipientSellerId,
        buyerPaidTotal,
        productAmount,
        platformAmount,
        amount,
        reason: input.reason,
        isAutomatic: false,
        isCurrent: true,
        resolvedById: admin.id,
        resolvedByRole: 'ADMIN',
      },
    });
    await tx.order.update({ where: { id: order.id }, data: { settlementStatus: newStatus } });
    return created;
  });

  await recordAudit({
    orderId: order.id,
    action: input.decision === 'REFUND_BUYER' ? AUDIT_ACTIONS.SETTLEMENT_DECIDED_REFUND_BUYER : AUDIT_ACTIONS.SETTLEMENT_DECIDED_PAY_SELLER,
    actorId: admin.id,
    actorRole: 'ADMIN',
    source: 'ADMIN',
    previousState: 'PENDING_REVIEW',
    newState: newStatus,
    metadata: { amount, reason: input.reason, sellerId: recipientSellerId },
  });

  if (input.decision === 'REFUND_BUYER') {
    notifyUser({
      userId: order.userId,
      type: 'PAYMENT',
      title: `Refund approved — order #${order.orderNumber}`,
      message: `We've approved a full refund of ₹${amount.toFixed(2)} for this order. It will be processed shortly.`,
      relatedEntityType: 'ORDER',
      relatedEntityId: order.id,
    }).catch(() => {});
  } else if (recipientSellerId) {
    notifyUser({
      userId: recipientSellerId,
      type: 'PAYMENT',
      title: `Payout approved — order #${order.orderNumber}`,
      message: `₹${amount.toFixed(2)} has been approved for payout to your account for this order.`,
      relatedEntityType: 'ORDER',
      relatedEntityId: order.id,
    }).catch(() => {});
  }

  return settlement;
}

/** Admin confirms a refund has actually been issued (outside this system — see payment.service.ts, refunds are manual, same as payouts). */
export async function confirmBuyerRefund(idOrNumber: string, admin: User, { reference }: { reference?: string }) {
  const order = await prisma.order.findFirst({ where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] } });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.settlementStatus !== 'BUYER_REFUND_PENDING') {
    throw ApiError.badRequest('This order is not awaiting a refund confirmation.');
  }
  const current = await prisma.settlement.findFirst({ where: { orderId: order.id, isCurrent: true } });
  if (!current) throw ApiError.internal('No current settlement record found for this order.');

  const settlement = await prisma.$transaction(async (tx) => {
    await tx.settlement.updateMany({ where: { orderId: order.id, isCurrent: true }, data: { isCurrent: false } });
    const created = await tx.settlement.create({
      data: {
        orderId: order.id,
        status: 'BUYER_REFUNDED',
        decision: 'REFUND_BUYER',
        buyerPaidTotal: current.buyerPaidTotal,
        productAmount: current.productAmount,
        platformAmount: current.platformAmount,
        amount: current.amount,
        reason: current.reason,
        paymentReference: reference,
        isCurrent: true,
        resolvedById: admin.id,
        resolvedByRole: 'ADMIN',
      },
    });
    await tx.order.update({ where: { id: order.id }, data: { settlementStatus: 'BUYER_REFUNDED' } });
    return created;
  });

  await recordAudit({
    orderId: order.id,
    action: AUDIT_ACTIONS.SETTLEMENT_REFUND_ISSUED,
    actorId: admin.id,
    actorRole: 'ADMIN',
    source: 'ADMIN',
    previousState: 'BUYER_REFUND_PENDING',
    newState: 'BUYER_REFUNDED',
    metadata: { reference },
  });

  notifyUser({
    userId: order.userId,
    type: 'PAYMENT',
    title: `Refund issued — order #${order.orderNumber}`,
    message: `Your refund of ₹${Number(current.amount).toFixed(2)} has been issued.${reference ? ` Reference: ${reference}.` : ''}`,
    relatedEntityType: 'ORDER',
    relatedEntityId: order.id,
  }).catch(() => {});

  return settlement;
}

/**
 * Corrects/reverses the current settlement (requirement #25: never edit
 * history invisibly — always append a correction record) by putting the
 * order back into PENDING_REVIEW so an admin can decide it again.
 */
export async function correctSettlement(idOrNumber: string, admin: User, { reason }: { reason: string }) {
  const order = await prisma.order.findFirst({ where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] } });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.settlementStatus === 'NOT_ELIGIBLE' || order.settlementStatus === 'PENDING_REVIEW') {
    throw ApiError.badRequest('This order has no completed/decided settlement to correct.');
  }

  await moveSettlementToReview(order.id, order, reason, { id: admin.id, role: 'ADMIN' });
  await recordAudit({
    orderId: order.id,
    action: AUDIT_ACTIONS.SETTLEMENT_CORRECTED,
    actorId: admin.id,
    actorRole: 'ADMIN',
    source: 'ADMIN',
    previousState: order.settlementStatus,
    newState: 'PENDING_REVIEW',
    metadata: { reason },
  });

  return prisma.settlement.findFirst({ where: { orderId: order.id, isCurrent: true } });
}

/** Full settlement history for one order, latest first — the admin order-detail page's audit view. */
export async function getSettlementHistory(orderId: string) {
  return prisma.settlement.findMany({
    where: { orderId },
    include: { seller: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * FIFO-reconciles a seller's oldest SELLER_PAYOUT_PENDING settlements up to
 * a just-recorded payout amount, so the per-order settlement status shown
 * on the admin order table (requirement #12) stays accurate instead of every
 * paid-out order sitting at "PENDING" forever. Best-effort/approximate by
 * design — it marks whole settlement rows as SELLER_PAID until the payout
 * amount is exhausted, it does not split a single order's settlement across
 * two payouts.
 */
export async function reconcilePayoutAgainstSettlements(sellerId: string, payoutId: string, payoutAmount: number): Promise<void> {
  const pending = await prisma.settlement.findMany({
    where: { sellerId, status: 'SELLER_PAYOUT_PENDING', isCurrent: true },
    orderBy: { resolvedAt: 'asc' },
  });

  let remaining = payoutAmount;
  for (const settlement of pending) {
    if (remaining < Number(settlement.amount)) break;
    remaining = Math.round((remaining - Number(settlement.amount)) * 100) / 100;

    // eslint-disable-next-line no-await-in-loop
    await prisma.$transaction([
      prisma.settlement.update({ where: { id: settlement.id }, data: { isCurrent: false } }),
      prisma.settlement.create({
        data: {
          orderId: settlement.orderId,
          status: 'SELLER_PAID',
          decision: 'PAY_SELLER',
          sellerId: settlement.sellerId,
          buyerPaidTotal: settlement.buyerPaidTotal,
          productAmount: settlement.productAmount,
          platformAmount: settlement.platformAmount,
          amount: settlement.amount,
          reason: settlement.reason,
          paymentReference: payoutId,
          isCurrent: true,
          resolvedByRole: 'SYSTEM',
        },
      }),
      prisma.order.update({ where: { id: settlement.orderId }, data: { settlementStatus: 'SELLER_PAID' } }),
    ]);

    // eslint-disable-next-line no-await-in-loop
    await recordAudit({
      orderId: settlement.orderId,
      action: AUDIT_ACTIONS.SETTLEMENT_SELLER_PAID,
      actorRole: 'SYSTEM',
      source: 'SYSTEM',
      previousState: 'SELLER_PAYOUT_PENDING',
      newState: 'SELLER_PAID',
      metadata: { payoutId },
    });
  }
}
