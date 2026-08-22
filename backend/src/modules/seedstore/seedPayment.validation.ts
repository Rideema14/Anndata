import { z } from 'zod';

export const createSeedPaymentSchema = z.object({
  orderId: z.string().uuid(),
});
export type CreateSeedPaymentInput = z.infer<typeof createSeedPaymentSchema>;

export const verifySeedPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifySeedPaymentInput = z.infer<typeof verifySeedPaymentSchema>;
