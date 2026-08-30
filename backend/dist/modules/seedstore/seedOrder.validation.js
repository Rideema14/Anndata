"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSeedOrderSchema = exports.listSeedOrdersQuerySchema = exports.updateSeedOrderStatusSchema = exports.seedCheckoutSchema = void 0;
const zod_1 = require("zod");
const order_validation_1 = require("../order/order.validation");
exports.seedCheckoutSchema = zod_1.z.object({
    addressId: zod_1.z.string().uuid(),
    notes: zod_1.z.string().trim().max(500).optional(),
});
exports.updateSeedOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(order_validation_1.ORDER_STATUSES),
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.listSeedOrdersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(order_validation_1.ORDER_STATUSES).optional(),
    userId: zod_1.z.string().uuid().optional(),
    scope: zod_1.z.enum(['mine', 'selling']).optional(),
});
exports.cancelSeedOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().max(500).optional(),
});
//# sourceMappingURL=seedOrder.validation.js.map