import { z } from 'zod';
import { ORDER_STATUSES } from '../order/order.validation';

export const seedCheckoutSchema = z.object({
  addressId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
});
export type SeedCheckoutInput = z.infer<typeof seedCheckoutSchema>;

export const updateSeedOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});
export type UpdateSeedOrderStatusInput = z.infer<typeof updateSeedOrderStatusSchema>;

export const listSeedOrdersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  userId: z.string().uuid().optional(),
  scope: z.enum(['mine', 'selling']).optional(),
});
export type ListSeedOrdersQuery = z.infer<typeof listSeedOrdersQuerySchema>;

export const cancelSeedOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelSeedOrderInput = z.infer<typeof cancelSeedOrderSchema>;
