const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

const subCategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

const variantInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().max(60).optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  attributes: z.record(z.any()).optional(),
});

const productCreateSchema = z.object({
  categoryId: z.string().uuid(),
  subCategoryId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().max(30).default('piece'),
  specifications: z.record(z.any()).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  variants: z.array(variantInputSchema).optional(),
});

const productUpdateSchema = productCreateSchema.partial();

const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(), // category slug
  subCategory: z.string().trim().optional(), // subcategory slug
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sellerId: z.string().uuid().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
});

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(500).default(25),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const topDealsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

module.exports = {
  categorySchema,
  subCategorySchema,
  variantInputSchema,
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  nearbyQuerySchema,
  topDealsQuerySchema,
  reviewSchema,
};
