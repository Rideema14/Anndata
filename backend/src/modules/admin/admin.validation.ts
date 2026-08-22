import { z } from 'zod';

export const ROLES = ['BUYER', 'SELLER', 'ADMIN'] as const;

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(ROLES).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().trim().min(1).optional(), // matches name or email
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const platformAnalyticsQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(24).default(6),
});
export type PlatformAnalyticsQuery = z.infer<typeof platformAnalyticsQuerySchema>;

export const adminReviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isApproved: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  productId: z.string().uuid().optional(),
});
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;

export const adminProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sellerId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;
