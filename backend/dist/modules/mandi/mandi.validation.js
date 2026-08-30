"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertSchema = exports.priceHistoryQuerySchema = exports.priceQuerySchema = exports.bulkPriceEntrySchema = exports.priceEntrySchema = exports.districtsQuerySchema = exports.mandiListQuerySchema = exports.cropSchema = exports.mandiSchema = void 0;
const zod_1 = require("zod");
exports.mandiSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(150),
    state: zod_1.z.string().trim().min(2).max(100),
    district: zod_1.z.string().trim().min(2).max(100),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.cropSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    category: zod_1.z.string().trim().max(60).optional(),
    unit: zod_1.z.string().trim().max(20).default('Quintal'),
});
exports.mandiListQuerySchema = zod_1.z.object({
    state: zod_1.z.string().trim().optional(),
    district: zod_1.z.string().trim().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
exports.districtsQuerySchema = zod_1.z.object({
    state: zod_1.z.string().trim().min(1),
});
exports.priceEntrySchema = zod_1.z.object({
    mandiId: zod_1.z.string().uuid(),
    cropId: zod_1.z.string().uuid(),
    variety: zod_1.z.string().trim().max(60).optional(),
    minPrice: zod_1.z.coerce.number().nonnegative(),
    maxPrice: zod_1.z.coerce.number().nonnegative(),
    modalPrice: zod_1.z.coerce.number().nonnegative(),
    priceDate: zod_1.z.coerce.date(),
});
exports.bulkPriceEntrySchema = zod_1.z.object({
    entries: zod_1.z.array(exports.priceEntrySchema).min(1).max(500),
});
exports.priceQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    state: zod_1.z.string().trim().optional(),
    district: zod_1.z.string().trim().optional(),
    mandiId: zod_1.z.string().uuid().optional(),
    cropId: zod_1.z.string().uuid().optional(),
    fromDate: zod_1.z.coerce.date().optional(),
    toDate: zod_1.z.coerce.date().optional(),
    exactDate: zod_1.z.string().trim().optional(),
});
exports.priceHistoryQuerySchema = zod_1.z.object({
    cropId: zod_1.z.string().uuid(),
    mandiId: zod_1.z.string().uuid(),
    days: zod_1.z.coerce.number().int().positive().max(730).default(30),
});
exports.alertSchema = zod_1.z.object({
    cropId: zod_1.z.string().uuid(),
    mandiId: zod_1.z.string().uuid().optional(),
    priceType: zod_1.z.enum(['MIN', 'MAX', 'MODAL']).default('MODAL'),
    condition: zod_1.z.enum(['ABOVE', 'BELOW']),
    thresholdPrice: zod_1.z.coerce.number().positive(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=mandi.validation.js.map