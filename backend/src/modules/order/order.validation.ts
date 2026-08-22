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
  /**
   * 'mine' (default) = orders this account placed as a buyer — normal order
   * history, works for every role including sellers/admins buying things.
   * 'selling' = orders that contain this account's own products — the
   * seller fulfillment queue. Explicit, because a single account's `role`
   * doesn't tell you which of these two very different lists they're after.
   */
  scope: z.enum(['mine', 'selling']).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;