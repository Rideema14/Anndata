import { z } from 'zod';

export const mandiSchema = z.object({
  name: z.string().trim().min(2).max(150),
  state: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
});
export type MandiInput = z.infer<typeof mandiSchema>;

export const cropSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().max(60).optional(),
  unit: z.string().trim().max(20).default('Quintal'),
});
export type CropInput = z.infer<typeof cropSchema>;

export const mandiListQuerySchema = z.object({
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type MandiListQuery = z.infer<typeof mandiListQuerySchema>;

export const districtsQuerySchema = z.object({
  state: z.string().trim().min(1),
});

export const priceEntrySchema = z.object({
  mandiId: z.string().uuid(),
  cropId: z.string().uuid(),
  variety: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().nonnegative(),
  maxPrice: z.coerce.number().nonnegative(),
  modalPrice: z.coerce.number().nonnegative(),
  priceDate: z.coerce.date(),
});
export type PriceEntryInput = z.infer<typeof priceEntrySchema>;

export const bulkPriceEntrySchema = z.object({
  entries: z.array(priceEntrySchema).min(1).max(500),
});
export type BulkPriceEntryInput = z.infer<typeof bulkPriceEntrySchema>;

export const priceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  mandiId: z.string().uuid().optional(),
  cropId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  exactDate: z.string().trim().optional(),
});
export type PriceQuery = z.infer<typeof priceQuerySchema>;

export const priceHistoryQuerySchema = z.object({
  cropId: z.string().uuid(),
  mandiId: z.string().uuid(),
  days: z.coerce.number().int().positive().max(730).default(30),
});
export type PriceHistoryQuery = z.infer<typeof priceHistoryQuerySchema>;

export const alertSchema = z.object({
  cropId: z.string().uuid(),
  mandiId: z.string().uuid().optional(),
  priceType: z.enum(['MIN', 'MAX', 'MODAL']).default('MODAL'),
  condition: z.enum(['ABOVE', 'BELOW']),
  thresholdPrice: z.coerce.number().positive(),
  isActive: z.boolean().optional(),
});
export type AlertInput = z.infer<typeof alertSchema>;
