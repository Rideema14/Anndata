import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().default(1),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
