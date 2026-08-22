import { z } from 'zod';

export const addSeedItemSchema = z.object({
  seedId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().default(1),
});
export type AddSeedItemInput = z.infer<typeof addSeedItemSchema>;

export const updateSeedItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});
export type UpdateSeedItemInput = z.infer<typeof updateSeedItemSchema>;
