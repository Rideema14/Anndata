import { z } from 'zod';
import { COURIER_CODES } from './courier.config';

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
  'RETURNED',
  'DISPUTED',
] as const;

// Kept in sync with courier.config.ts's SUPPORTED_COURIERS (single source
// of truth for carrier data — this re-export just keeps the zod enum
// literal-typed).
export const CARRIER_CODES = COURIER_CODES;

// Admin-only free-form status override (see order.routes.ts — sellers have
// no access to this endpoint at all; see submitShipmentSchema below for the
// seller's one and only shipment-related action). The business-rule state
// machine itself (which transitions are even legal) lives in
// shipment.constants.ts's ORDER_STATUS_TRANSITIONS and is enforced in
// order.service.ts, not here — this schema only checks shape.
export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const listOrdersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  userId: z.string().uuid().optional(),
  scope: z.enum(['mine', 'selling']).optional(),
  // Admin-only (requirement #12) — matches order number, AWB, seller name,
  // or buyer name. Ignored (has no effect) for non-admin callers, same as
  // `userId` above.
  search: z.string().trim().min(1).optional(),
  settlementStatus: z
    .enum(['NOT_ELIGIBLE', 'PENDING_REVIEW', 'SELLER_PAYOUT_PENDING', 'SELLER_PAID', 'BUYER_REFUND_PENDING', 'BUYER_REFUNDED'])
    .optional(),
  paymentStatus: z.enum(['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  carrierCode: z.enum(CARRIER_CODES).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

// ---------------------------------------------------------------------------
// Shipment (requirement #2/#3) — this is the ONLY way a seller can act on an
// order's shipment. Courier + AWB are required; shipment date and a note
// are optional, matching the seller shipment form spec exactly.
// ---------------------------------------------------------------------------

export const submitShipmentSchema = z
  .object({
    carrierCode: z.enum(CARRIER_CODES),
    carrierName: z.string().trim().min(1).max(100).optional(),
    awb: z
      .string()
      .trim()
      .min(4, 'Enter a valid AWB / tracking number.')
      .max(40, 'Enter a valid AWB / tracking number.')
      .regex(/^[A-Za-z0-9-\s]+$/, 'AWB can only contain letters, numbers, and hyphens.'),
    shipmentDate: z.coerce.date().max(new Date(Date.now() + 24 * 60 * 60 * 1000), 'Shipment date cannot be in the future.').optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.carrierCode === 'OTHER' && !data.carrierName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['carrierName'], message: 'Please name the courier/agent when selecting "Other".' });
    }
  });
export type SubmitShipmentInput = z.infer<typeof submitShipmentSchema>;

// ---------------------------------------------------------------------------
// Disputes (requirement #9)
// ---------------------------------------------------------------------------

export const createDisputeSchema = z.object({
  reason: z.string().trim().min(3, 'Please describe the problem.').max(200),
  details: z.string().trim().max(1000).optional(),
});
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

// ---------------------------------------------------------------------------
// Settlement (requirement #18–#25) — admin-only, but the schemas live here
// alongside the rest of the order-domain validation rather than in
// admin.validation.ts, since decideSettlement/correctSettlement/
// confirmBuyerRefund are all order.module.settlement.service.ts functions.
// ---------------------------------------------------------------------------

export const decideSettlementSchema = z.object({
  decision: z.enum(['REFUND_BUYER', 'PAY_SELLER']),
  sellerId: z.string().uuid().optional(),
  reason: z.string().trim().min(10, 'Explain the reason for this settlement decision (at least 10 characters).').max(1000),
});
export type DecideSettlementInput = z.infer<typeof decideSettlementSchema>;

export const confirmRefundSchema = z.object({
  reference: z.string().trim().max(120).optional(),
});
export type ConfirmRefundInput = z.infer<typeof confirmRefundSchema>;

export const correctSettlementSchema = z.object({
  reason: z.string().trim().min(10, 'Explain the reason for this correction (at least 10 characters).').max(1000),
});
export type CorrectSettlementInput = z.infer<typeof correctSettlementSchema>;
