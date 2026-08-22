import { z } from 'zod';

export const seedCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type SeedCategoryInput = z.infer<typeof seedCategorySchema>;

export const seedVariantInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().max(60).optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  attributes: z.record(z.any()).optional(),
});
export type SeedVariantInput = z.infer<typeof seedVariantInputSchema>;

export const SOWING_SEASONS = ['Kharif', 'Rabi', 'Zaid'] as const;

export const seedCreateSchema = z.object({
  seedCategoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  variety: z.string().trim().max(100).optional(),
  sowingSeason: z.enum(SOWING_SEASONS).optional(),
  germinationRatePercent: z.coerce.number().int().min(0).max(100).optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().max(30).default('kg'),
  specifications: z.record(z.any()).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  variants: z.array(seedVariantInputSchema).optional(),
});
export type SeedCreateInput = z.infer<typeof seedCreateSchema>;

export const seedUpdateSchema = seedCreateSchema.partial();
export type SeedUpdateInput = z.infer<typeof seedUpdateSchema>;

export const seedQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().optional(),
  seedCategory: z.string().trim().optional(), // category slug
  sowingSeason: z.enum(SOWING_SEASONS).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sellerId: z.string().uuid().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
});
export type SeedQuery = z.infer<typeof seedQuerySchema>;

export const seedReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type SeedReviewInput = z.infer<typeof seedReviewSchema>;
