import { z } from 'zod';

export const createMachineryPaymentSchema = z.object({
  bookingId: z.string().uuid(),
});
export type CreateMachineryPaymentInput = z.infer<typeof createMachineryPaymentSchema>;

export const verifyMachineryPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyMachineryPaymentInput = z.infer<typeof verifyMachineryPaymentSchema>;
