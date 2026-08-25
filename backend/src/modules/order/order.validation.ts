import { z } from 'zod';

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
] as const;

export const CARRIER_CODES = [
  'DELHIVERY',
  'BLUEDART',
  'DTDC',
  'INDIA_POST',
  'EKART',
  'XPRESSBEES',
  'SHADOWFAX',
  'ECOM_EXPRESS',
  'PROFESSIONAL',
  'OTHER',
] as const;

export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
  trackingCarrier: z.string().trim().min(1).max(100).optional(),
  trackingNumber: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{4,50}$/, 'Enter a valid tracking / docket number (4–50 characters).').optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'CONFIRMED' && !data.trackingNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trackingNumber'], message: 'A tracking number is required to confirm an order.' });
  }
  if (data.status === 'CONFIRMED' && !data.trackingCarrier) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trackingCarrier'], message: 'Please specify a delivery carrier or agent.' });
  }
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
