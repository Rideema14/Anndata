"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerReviewsQuerySchema = exports.analyticsQuerySchema = exports.listApplicationsQuerySchema = exports.reviewApplicationSchema = exports.updateProfileSchema = exports.applySchema = void 0;
const zod_1 = require("zod");
exports.applySchema = zod_1.z.object({
    businessName: zod_1.z.string().trim().min(2).max(150),
    businessDescription: zod_1.z.string().trim().max(2000).optional(),
    gstNumber: zod_1.z.string().trim().max(20).optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    businessName: zod_1.z.string().trim().min(2).max(150).optional(),
    businessDescription: zod_1.z.string().trim().max(2000).optional(),
    gstNumber: zod_1.z.string().trim().max(20).optional(),
    bankAccountHolder: zod_1.z.string().trim().max(150).optional(),
    bankAccountNumber: zod_1.z.string().trim().min(6).max(30).optional(),
    bankIfscCode: zod_1.z
        .string()
        .trim()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code')
        .optional(),
    bankName: zod_1.z.string().trim().max(150).optional(),
    serviceAreaLat: zod_1.z.coerce.number().min(-90).max(90).optional(),
    serviceAreaLng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    serviceAreaRadiusKm: zod_1.z.coerce.number().positive().max(1000).optional(),
});
exports.reviewApplicationSchema = zod_1.z.object({
    decision: zod_1.z.enum(['APPROVE', 'REJECT']),
    note: zod_1.z.string().trim().max(1000).optional(),
});
exports.listApplicationsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(['UNSUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
});
exports.analyticsQuerySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().positive().max(365).default(30),
    topProductsLimit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
exports.sellerReviewsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    productId: zod_1.z.string().uuid().optional(),
    minRating: zod_1.z.coerce.number().int().min(1).max(5).optional(),
});
//# sourceMappingURL=seller.validation.js.map