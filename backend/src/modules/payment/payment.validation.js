const { z } = require('zod');

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

module.exports = { createPaymentSchema, verifyPaymentSchema };
