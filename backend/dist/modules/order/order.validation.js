"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDisputeSchema = exports.submitShipmentSchema = exports.cancelOrderSchema = exports.listOrdersQuerySchema = exports.updateStatusSchema = exports.CARRIER_CODES = exports.ORDER_STATUSES = exports.checkoutSchema = void 0;
const zod_1 = require("zod");
const tracking_service_1 = require("./tracking.service");
exports.checkoutSchema = zod_1.z.object({
    addressId: zod_1.z.string().uuid(),
    notes: zod_1.z.string().trim().max(500).optional(),
});
exports.ORDER_STATUSES = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'DISPUTED',
];
// Kept in sync with tracking.service.ts's SUPPORTED_CARRIERS (single source
// of truth — this re-export just keeps the zod enum literal-typed).
exports.CARRIER_CODES = tracking_service_1.CARRIER_CODES;
// Admin-only free-form status override (see order.routes.ts — sellers no
// longer have access to this endpoint at all; see submitShipmentSchema
// below for the seller's one and only shipment-related action). The
// business-rule state machine itself (which transitions are even legal)
// lives in shipment.constants.ts's ORDER_STATUS_TRANSITIONS and is
// enforced in order.service.ts, not here — this schema only checks shape.
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.ORDER_STATUSES),
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.listOrdersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.ORDER_STATUSES).optional(),
    userId: zod_1.z.string().uuid().optional(),
    scope: zod_1.z.enum(['mine', 'selling']).optional(),
});
exports.cancelOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().max(500).optional(),
});
// ---------------------------------------------------------------------------
// Shipment (requirement #2) — this is now the ONLY way a seller can act on
// an order's shipment. No status, no tracking fields beyond these two.
// ---------------------------------------------------------------------------
exports.submitShipmentSchema = zod_1.z
    .object({
    carrierCode: zod_1.z.enum(exports.CARRIER_CODES),
    carrierName: zod_1.z.string().trim().min(1).max(100).optional(),
    awb: zod_1.z
        .string()
        .trim()
        .min(6, 'Enter a valid AWB / tracking number (6–40 characters).')
        .max(40, 'Enter a valid AWB / tracking number (6–40 characters).')
        .regex(/^[A-Za-z0-9-\s]+$/, 'AWB can only contain letters, numbers, and hyphens.'),
})
    .superRefine((data, ctx) => {
    if (data.carrierCode === 'OTHER' && !data.carrierName) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['carrierName'], message: 'Please name the courier/agent when selecting "Other".' });
    }
});
// ---------------------------------------------------------------------------
// Disputes (requirement #9)
// ---------------------------------------------------------------------------
exports.createDisputeSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(3, 'Please describe the problem.').max(200),
    details: zod_1.z.string().trim().max(1000).optional(),
});
//# sourceMappingURL=order.validation.js.map