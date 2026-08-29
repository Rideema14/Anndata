// Shared constants for the shipment-tracking / delivery-verification system.
// Kept separate from tracking.service.ts and shipment.service.ts so both
// (and order.service.ts, admin.service.ts) can import from one place
// without a circular dependency.

import type { ShipmentStatus, OrderStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shipment status flow (courier-derived)
// ---------------------------------------------------------------------------

/**
 * Rank used to prevent a shipment status from ever moving backwards —
 * e.g. a late/duplicate "in transit" webhook arriving after "delivered"
 * must never downgrade the shipment. DELIVERY_FAILED/EXCEPTION/RETURNED
 * are branches off the happy path rather than "later" than DELIVERED, so
 * they're handled as a side-flag (see shipment.service.ts) instead of
 * being ranked past it.
 */
export const SHIPMENT_STATUS_RANK: Record<ShipmentStatus, number> = {
  AWB_SUBMITTED: 0,
  AWB_VERIFIED: 1,
  PICKUP_CONFIRMED: 2,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  DELIVERY_FAILED: 4, // treated like "still out for delivery, but flagged" — never downgrades OUT_FOR_DELIVERY
  EXCEPTION: 3, // treated like "still in transit, but flagged"
  RETURNED: 5, // terminal, same rank as DELIVERED so it can't be overwritten by a stale in-transit event
};

/** Statuses that should stop the tracking cron from polling an order any further. */
export const TERMINAL_SHIPMENT_STATUSES: ShipmentStatus[] = ['DELIVERED', 'RETURNED'];

/** Maps a courier-derived ShipmentStatus to the coarser OrderStatus shown elsewhere in the app. */
export const SHIPMENT_STATUS_TO_ORDER_STATUS: Partial<Record<ShipmentStatus, OrderStatus>> = {
  AWB_SUBMITTED: 'CONFIRMED',
  AWB_VERIFIED: 'CONFIRMED',
  PICKUP_CONFIRMED: 'SHIPPED',
  IN_TRANSIT: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERY_FAILED: 'OUT_FOR_DELIVERY',
  EXCEPTION: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
};

/** Rank used to prevent OrderStatus itself from ever moving backwards. */
export const ORDER_STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  DISPUTED: 5, // side-state off DELIVERED, not "further along"
  CANCELLED: 5,
  RETURNED: 5,
};

/**
 * Explicit adjacency list of every OrderStatus transition this app allows,
 * regardless of caller (admin override, tracking sync, dispute resolution).
 * Anything not listed here is rejected — this is what stops
 * DELIVERED -> SHIPPED, DELIVERED -> PROCESSING, SHIPPED -> PENDING, etc.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  // A failed delivery *attempt* keeps the shipment at OUT_FOR_DELIVERY (it's
  // still with the local courier for a retry) rather than regressing all
  // the way back to SHIPPED — see ShipmentStatus.DELIVERY_FAILED, which is
  // deliberately ranked alongside OUT_FOR_DELIVERY for the same reason.
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['DISPUTED', 'RETURNED'],
  DISPUTED: ['DELIVERED', 'RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

// ---------------------------------------------------------------------------
// Risk / fraud flags (rule-based — see shipment.service.ts / tracking.service.ts)
// ---------------------------------------------------------------------------

export const RISK_FLAGS = {
  AWB_INVALID_FORMAT: 'AWB_INVALID_FORMAT',
  AWB_NOT_FOUND: 'AWB_NOT_FOUND',
  CARRIER_MISMATCH: 'CARRIER_MISMATCH',
  DUPLICATE_AWB: 'DUPLICATE_AWB',
  PICKUP_OVERDUE: 'PICKUP_OVERDUE',
  STALE_NO_MOVEMENT: 'STALE_NO_MOVEMENT',
  DELIVERED_WITHOUT_HISTORY: 'DELIVERED_WITHOUT_HISTORY',
  REPEATED_INVALID_AWB_SELLER: 'REPEATED_INVALID_AWB_SELLER',
  REPEATED_DISPUTES_SELLER: 'REPEATED_DISPUTES_SELLER',
  TRACKING_API_INCONSISTENT: 'TRACKING_API_INCONSISTENT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  LEGACY_BACKFILL: 'LEGACY_BACKFILL',
} as const;

export type RiskFlag = (typeof RISK_FLAGS)[keyof typeof RISK_FLAGS];

// How long we'll wait for a pickup scan before flagging the shipment for review.
export const PICKUP_GRACE_HOURS = 48;
// How long a shipment can go with no new tracking event before it's flagged as stale.
export const STALE_SHIPMENT_HOURS = 96;
// How many consecutive provider failures before a shipment is flagged for review.
export const MAX_SYNC_FAILURES_BEFORE_FLAG = 5;
// How many verification attempts before we stop retrying an unverified AWB automatically.
export const MAX_VERIFICATION_ATTEMPTS = 5;
// Lookback window + threshold for "repeated invalid AWBs from the same seller".
export const REPEATED_INVALID_AWB_WINDOW_DAYS = 7;
export const REPEATED_INVALID_AWB_THRESHOLD = 3;
// Lookback window + threshold for "repeated disputes against the same seller".
export const REPEATED_DISPUTE_WINDOW_DAYS = 30;
export const REPEATED_DISPUTE_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Audit log action names (requirement #12)
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  SELLER_SUBMITTED_AWB: 'SELLER_SUBMITTED_AWB',
  SELLER_AWB_REJECTED: 'SELLER_AWB_REJECTED',
  AWB_VERIFIED: 'AWB_VERIFIED',
  AWB_VERIFICATION_DEFERRED: 'AWB_VERIFICATION_DEFERRED',
  PICKUP_CONFIRMED: 'PICKUP_CONFIRMED',
  TRACKING_UPDATED: 'TRACKING_UPDATED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  RETURNED: 'RETURNED',
  SHIPMENT_FLAGGED: 'SHIPMENT_FLAGGED',
  ADMIN_FLAGGED_SHIPMENT: 'ADMIN_FLAGGED_SHIPMENT',
  CUSTOMER_CREATED_DISPUTE: 'CUSTOMER_CREATED_DISPUTE',
  ADMIN_REVIEWED_DISPUTE: 'ADMIN_REVIEWED_DISPUTE',
  ADMIN_OVERRODE_ORDER_STATUS: 'ADMIN_OVERRODE_ORDER_STATUS',
  SYNC_FAILED: 'SYNC_FAILED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type ActorRole = 'SELLER' | 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
export type AuditSource = 'SELLER' | 'COURIER' | 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
