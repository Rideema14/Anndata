"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedReviewSchema = exports.seedQuerySchema = exports.seedUpdateSchema = exports.seedCreateSchema = exports.SOWING_SEASONS = exports.seedVariantInputSchema = exports.seedCategorySchema = void 0;
const zod_1 = require("zod");
exports.seedCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    description: zod_1.z.string().trim().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.seedVariantInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(100),
    sku: zod_1.z.string().trim().max(60).optional(),
    price: zod_1.z.coerce.number().positive(),
    stock: zod_1.z.coerce.number().int().min(0).default(0),
    attributes: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.SOWING_SEASONS = ['Kharif', 'Rabi', 'Zaid'];
exports.seedCreateSchema = zod_1.z.object({
    seedCategoryId: zod_1.z.string().uuid(),
    name: zod_1.z.string().trim().min(2).max(200),
    description: zod_1.z.string().trim().max(5000).optional(),
    brand: zod_1.z.string().trim().max(100).optional(),
    variety: zod_1.z.string().trim().max(100).optional(),
    sowingSeason: zod_1.z.enum(exports.SOWING_SEASONS).optional(),
    germinationRatePercent: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    price: zod_1.z.coerce.number().positive(),
    discountPrice: zod_1.z.coerce.number().positive().optional(),
    stock: zod_1.z.coerce.number().int().min(0).default(0),
    unit: zod_1.z.string().trim().max(30).default('kg'),
    specifications: zod_1.z.record(zod_1.z.any()).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    variants: zod_1.z.array(exports.seedVariantInputSchema).optional(),
});
exports.seedUpdateSchema = exports.seedCreateSchema.partial();
exports.seedQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    search: zod_1.z.string().trim().optional(),
    seedCategory: zod_1.z.string().trim().optional(), // category slug
    sowingSeason: zod_1.z.enum(exports.SOWING_SEASONS).optional(),
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
});
exports.seedReviewSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().max(1000).optional(),
});
//# sourceMappingURL=seed.validation.js.map