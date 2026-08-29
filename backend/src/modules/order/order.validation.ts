import { z } from 'zod';
import { CARRIER_CODES as TRACKING_CARRIER_CODES } from './tracking.service';

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
  'CANCELLED',
  'RETURNED',
  'DISPUTED',
] as const;

// Kept in sync with tracking.service.ts's SUPPORTED_CARRIERS (single source
// of truth — this re-export just keeps the zod enum literal-typed).
export const CARRIER_CODES = TRACKING_CARRIER_CODES;

// Admin-only free-form status override (see order.routes.ts — sellers no
// longer have access to this endpoint at all; see submitShipmentSchema
// below for the seller's one and only shipment-related action). The
// business-rule state machine itself (which transitions are even legal)
// lives in shipment.constants.ts's ORDER_STATUS_TRANSITIONS and is
// enforced in order.service.ts, not here — this schema only checks shape.
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
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

// ---------------------------------------------------------------------------
// Shipment (requirement #2) — this is now the ONLY way a seller can act on
// an order's shipment. No status, no tracking fields beyond these two.
// ---------------------------------------------------------------------------

export const submitShipmentSchema = z
  .object({
    carrierCode: z.enum(CARRIER_CODES),
    carrierName: z.string().trim().min(1).max(100).optional(),
    awb: z
      .string()
      .trim()
      .min(6, 'Enter a valid AWB / tracking number (6–40 characters).')
      .max(40, 'Enter a valid AWB / tracking number (6–40 characters).')
      .regex(/^[A-Za-z0-9-\s]+$/, 'AWB can only contain letters, numbers, and hyphens.'),
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

