"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMachineryPaymentSchema = exports.createMachineryPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createMachineryPaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().uuid(),
});
exports.verifyMachineryPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string().min(1),
    razorpay_payment_id: zod_1.z.string().min(1),
    razorpay_signature: zod_1.z.string().min(1),
});
//# sourceMappingURL=machineryPayment.validation.js.map