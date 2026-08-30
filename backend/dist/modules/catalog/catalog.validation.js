"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = exports.topDealsQuerySchema = exports.nearbyQuerySchema = exports.productQuerySchema = exports.productUpdateSchema = exports.productCreateSchema = exports.variantInputSchema = exports.subCategorySchema = exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    description: zod_1.z.string().trim().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.subCategorySchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    name: zod_1.z.string().trim().min(2).max(80),
    description: zod_1.z.string().trim().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.variantInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(100),
    sku: zod_1.z.string().trim().max(60).optional(),
    price: zod_1.z.coerce.number().positive(),
    stock: zod_1.z.coerce.number().int().min(0).default(0),
    attributes: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.productCreateSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    subCategoryId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().trim().min(2).max(200),
    description: zod_1.z.string().trim().max(5000).optional(),
    brand: zod_1.z.string().trim().max(100).optional(),
    price: zod_1.z.coerce.number().positive(),
    discountPrice: zod_1.z.coerce.number().positive().optional(),
    stock: zod_1.z.coerce.number().int().min(0).default(0),
    unit: zod_1.z.string().trim().max(30).default('piece'),
    specifications: zod_1.z.record(zod_1.z.any()).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    variants: zod_1.z.array(exports.variantInputSchema).optional(),
});
exports.productUpdateSchema = exports.productCreateSchema.partial();
exports.productQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    search: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().trim().optional(), // category slug
    subCategory: zod_1.z.string().trim().optional(), // subcategory slug
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
});
exports.nearbyQuerySchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90),
    lng: zod_1.z.coerce.number().min(-180).max(180),
    radiusKm: zod_1.z.coerce.number().positive().max(500).default(25),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(20),
});
exports.topDealsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(50).default(20),
});
exports.reviewSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().max(1000).optional(),
});
//# sourceMappingURL=catalog.validation.js.map