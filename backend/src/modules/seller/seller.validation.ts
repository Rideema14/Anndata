import { z } from 'zod';

export const applySchema = z.object({
  businessName: z.string().trim().min(2).max(150),
  businessDescription: z.string().trim().max(2000).optional(),
  gstNumber: z.string().trim().max(20).optional(),
});
export type ApplyInput = z.infer<typeof applySchema>;

export const updateProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(150).optional(),
  businessDescription: z.string().trim().max(2000).optional(),
  gstNumber: z.string().trim().max(20).optional(),
  bankAccountHolder: z.string().trim().max(150).optional(),
  bankAccountNumber: z.string().trim().min(6).max(30).optional(),
  bankIfscCode: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code')
    .optional(),
  bankName: z.string().trim().max(150).optional(),
  serviceAreaLat: z.coerce.number().min(-90).max(90).optional(),
  serviceAreaLng: z.coerce.number().min(-180).max(180).optional(),
  serviceAreaRadiusKm: z.coerce.number().positive().max(1000).optional(),
});
export type UpdateSellerProfileInput = z.infer<typeof updateProfileSchema>;

export const reviewApplicationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().max(1000).optional(),
});
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;

export const listApplicationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['UNSUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
});
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
  topProductsLimit: z.coerce.number().int().positive().max(50).default(10),
});
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
