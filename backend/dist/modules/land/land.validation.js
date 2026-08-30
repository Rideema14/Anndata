"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVisitRequestsQuerySchema = exports.updateVisitStatusSchema = exports.createVisitRequestSchema = exports.myListingsQuerySchema = exports.landQuerySchema = exports.landUpdateSchema = exports.landCreateSchema = exports.LAND_VISIT_STATUSES = exports.LAND_DEAL_TYPES = void 0;
const zod_1 = require("zod");
exports.LAND_DEAL_TYPES = ['SALE', 'LEASE'];
exports.LAND_VISIT_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
exports.landCreateSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200),
    description: zod_1.z.string().trim().max(5000).optional(),
    areaAcres: zod_1.z.coerce.number().positive(),
    dealType: zod_1.z.enum(exports.LAND_DEAL_TYPES),
    price: zod_1.z.coerce.number().positive(),
    location: zod_1.z.string().trim().min(2).max(200),
    city: zod_1.z.string().trim().max(100).optional(),
    state: zod_1.z.string().trim().max(100).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    soilType: zod_1.z.string().trim().max(100).optional(),
    waterSource: zod_1.z.string().trim().max(100).optional(),
});
exports.landUpdateSchema = exports.landCreateSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
exports.landQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    search: zod_1.z.string().trim().optional(),
    dealType: zod_1.z.enum(exports.LAND_DEAL_TYPES).optional(),
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    minArea: zod_1.z.coerce.number().nonnegative().optional(),
    maxArea: zod_1.z.coerce.number().positive().optional(),
    city: zod_1.z.string().trim().optional(),
    state: zod_1.z.string().trim().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    sortBy: zod_1.z.enum(['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc']).default('newest'),
});
exports.myListingsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
// --- Visit requests -------------------------------------------------------
exports.createVisitRequestSchema = zod_1.z.object({
    visitDate: zod_1.z.coerce.date(),
    visitTime: zod_1.z.string().trim().min(1).max(50),
    message: zod_1.z.string().trim().max(1000).optional(),
});
exports.updateVisitStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
    responseNote: zod_1.z.string().trim().max(500).optional(),
});
exports.listVisitRequestsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.LAND_VISIT_STATUSES).optional(),
});
//# sourceMappingURL=land.validation.js.map