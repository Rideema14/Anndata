"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySeedPaymentSchema = exports.createSeedPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createSeedPaymentSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid(),
});
exports.verifySeedPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string().min(1),
    razorpay_payment_id: zod_1.z.string().min(1),
    razorpay_signature: zod_1.z.string().min(1),
});
//# sourceMappingURL=seedPayment.validation.js.map