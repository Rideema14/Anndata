"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewDisputeSchema = exports.listDisputesQuerySchema = exports.DISPUTE_STATUSES = exports.flagShipmentSchema = exports.listShipmentsQuerySchema = exports.SHIPMENT_STATUSES = exports.adminProductsQuerySchema = exports.listPayoutsQuerySchema = exports.createPayoutSchema = exports.sellerBalancesQuerySchema = exports.adminReviewsQuerySchema = exports.platformAnalyticsQuerySchema = exports.updateUserRoleSchema = exports.updateUserStatusSchema = exports.listUsersQuerySchema = exports.ROLES = void 0;
const zod_1 = require("zod");
exports.ROLES = ['BUYER', 'SELLER', 'ADMIN'];
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    role: zod_1.z.enum(exports.ROLES).optional(),
    isActive: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    search: zod_1.z.string().trim().min(1).optional(), // matches name or email
});
exports.updateUserStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(exports.ROLES),
});
exports.platformAnalyticsQuerySchema = zod_1.z.object({
    months: zod_1.z.coerce.number().int().positive().max(24).default(6),
});
exports.adminReviewsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    isApproved: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    minRating: zod_1.z.coerce.number().int().min(1).max(5).optional(),
    productId: zod_1.z.string().uuid().optional(),
});
// ---------------------------------------------------------------------------
// Seller payouts
// ---------------------------------------------------------------------------
exports.sellerBalancesQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    search: zod_1.z.string().trim().min(1).optional(),
});
exports.createPayoutSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().positive('Amount must be greater than 0.'),
    method: zod_1.z.enum(['BANK_TRANSFER', 'UPI', 'OTHER']).default('BANK_TRANSFER'),
    reference: zod_1.z.string().trim().max(120).optional(),
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.listPayoutsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['PAID', 'REVERSED']).optional(),
});
exports.adminProductsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    isActive: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    sellerId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().trim().optional(),
});
// ---------------------------------------------------------------------------
// Shipment management (requirement #10) & disputes (requirement #9)
// ---------------------------------------------------------------------------
exports.SHIPMENT_STATUSES = [
    'AWB_SUBMITTED',
    'AWB_VERIFIED',
    'PICKUP_CONFIRMED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_FAILED',
    'RETURNED',
    'EXCEPTION',
];
exports.listShipmentsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.SHIPMENT_STATUSES).optional(),
    flagged: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    disputed: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    // Matches order number or AWB.
    search: zod_1.z.string().trim().min(1).optional(),
});
// Admin can flag a shipment for investigation and attach a note — this is
// the ONLY shipment field an admin may write directly. Courier-derived
// fields (status, pickupConfirmedAt, deliveredAt, events, ...) are never
// exposed for direct admin edits (requirement #10: "manually changing
// courier-derived historical events should not be allowed").
exports.flagShipmentSchema = zod_1.z.object({
    note: zod_1.z.string().trim().min(1, 'Add a note explaining why this shipment is flagged.').max(1000),
});
exports.DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];
exports.listDisputesQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.DISPUTE_STATUSES).optional(),
});
exports.reviewDisputeSchema = zod_1.z.object({
    status: zod_1.z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
    adminNote: zod_1.z.string().trim().max(1000).optional(),
});
//# sourceMappingURL=admin.validation.js.map