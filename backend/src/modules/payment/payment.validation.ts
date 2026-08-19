import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
