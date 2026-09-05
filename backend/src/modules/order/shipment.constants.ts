// Shared constants for the order fulfillment / settlement system. Kept
// separate from order.service.ts, shipment.service.ts, settlement.service.ts
// and admin.service.ts so all of them can import from one place without a
// circular dependency.

import type { OrderStatus, SettlementStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Order status flow
// ---------------------------------------------------------------------------
// There is no more courier-derived shipment status (17TRACK has been
// removed) — OrderStatus itself is now the only fulfillment state, and it
// only ever moves forward through this explicit adjacency list. Submitting
// a valid shipment (shipment.service.ts) moves an order straight to
// SHIPPED from whatever pre-shipment state it was in; everything past that
// is a manual admin action (order.service.ts's updateStatus) since there's
// no automatic tracking provider left to report pickup/transit/delivery.

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'RETURNED'],
  // A failed delivery attempt isn't necessarily the end of the road — the
  // admin can send it back out, mark it returned once given up on, or
  // (rarely) it does turn out to have been delivered after investigation.
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  DELIVERED: ['DISPUTED', 'RETURNED'],
  DISPUTED: ['DELIVERED', 'RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

/** Pre-shipment statuses a seller is still allowed to submit shipment info from. */
export const PRE_SHIPMENT_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING'];

/** Statuses that permanently close an order to any further shipment/status/settlement action. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ['CANCELLED', 'RETURNED'];

// ---------------------------------------------------------------------------
// Settlement status flow
// ---------------------------------------------------------------------------

export const SETTLEMENT_STATUS_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  NOT_ELIGIBLE: ['PENDING_REVIEW', 'SELLER_PAYOUT_PENDING'],
  PENDING_REVIEW: ['SELLER_PAYOUT_PENDING', 'BUYER_REFUND_PENDING'],
  SELLER_PAYOUT_PENDING: ['SELLER_PAID', 'PENDING_REVIEW'],
  SELLER_PAID: ['PENDING_REVIEW'], // only via an explicit correction/reversal
  BUYER_REFUND_PENDING: ['BUYER_REFUNDED', 'PENDING_REVIEW'],
  BUYER_REFUNDED: ['PENDING_REVIEW'], // only via an explicit correction/reversal
};

// ---------------------------------------------------------------------------
// Audit log action names (requirement #12 / #25) — reuses the existing
// ShipmentAuditLog table (a generic, free-text `action` column) for both
// shipment/order-status actions AND settlement actions, so there's a single
// append-only trail per order.
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  SELLER_SUBMITTED_AWB: 'SELLER_SUBMITTED_AWB',
  SELLER_AWB_REJECTED: 'SELLER_AWB_REJECTED',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ADMIN_OVERRODE_ORDER_STATUS: 'ADMIN_OVERRODE_ORDER_STATUS',
  ADMIN_MARKED_DELIVERED: 'ADMIN_MARKED_DELIVERED',
  ADMIN_MARKED_DELIVERY_FAILED: 'ADMIN_MARKED_DELIVERY_FAILED',
  ADMIN_MARKED_RETURNED: 'ADMIN_MARKED_RETURNED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  CUSTOMER_CREATED_DISPUTE: 'CUSTOMER_CREATED_DISPUTE',
  ADMIN_REVIEWED_DISPUTE: 'ADMIN_REVIEWED_DISPUTE',
  SETTLEMENT_AUTO_APPROVED: 'SETTLEMENT_AUTO_APPROVED',
  SETTLEMENT_MOVED_TO_REVIEW: 'SETTLEMENT_MOVED_TO_REVIEW',
  SETTLEMENT_DECIDED_REFUND_BUYER: 'SETTLEMENT_DECIDED_REFUND_BUYER',
  SETTLEMENT_DECIDED_PAY_SELLER: 'SETTLEMENT_DECIDED_PAY_SELLER',
  SETTLEMENT_REFUND_ISSUED: 'SETTLEMENT_REFUND_ISSUED',
  SETTLEMENT_SELLER_PAID: 'SETTLEMENT_SELLER_PAID',
  SETTLEMENT_CORRECTED: 'SETTLEMENT_CORRECTED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type ActorRole = 'SELLER' | 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
export type AuditSource = 'SELLER' | 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
