import { z } from 'zod';
import { CARRIER_CODES, ORDER_STATUSES } from '../order/order.validation';

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

// ---------------------------------------------------------------------------
// Seller payouts
// ---------------------------------------------------------------------------

export const sellerBalancesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().min(1).optional(),
});
export type SellerBalancesQuery = z.infer<typeof sellerBalancesQuerySchema>;

export const createPayoutSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  method: z.enum(['BANK_TRANSFER', 'UPI', 'OTHER']).default('BANK_TRANSFER'),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

export const listPayoutsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sellerId: z.string().uuid().optional(),
  status: z.enum(['PAID', 'REVERSED']).optional(),
});
export type ListPayoutsQuery = z.infer<typeof listPayoutsQuerySchema>;

// ---------------------------------------------------------------------------
// All-orders management (requirement #11/#12/#13) & disputes (requirement #9)
// ---------------------------------------------------------------------------

export const SETTLEMENT_STATUSES = [
  'NOT_ELIGIBLE',
  'PENDING_REVIEW',
  'SELLER_PAYOUT_PENDING',
  'SELLER_PAID',
  'BUYER_REFUND_PENDING',
  'BUYER_REFUNDED',
] as const;

export const listAllOrdersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  settlementStatus: z.enum(SETTLEMENT_STATUSES).optional(),
  paymentStatus: z.enum(['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  carrierCode: z.enum(CARRIER_CODES).optional(),
  // Matches order number, AWB, seller name, or buyer name (requirement #12).
  search: z.string().trim().min(1).optional(),
});
export type ListAllOrdersQuery = z.infer<typeof listAllOrdersQuerySchema>;

export const DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const;

export const listDisputesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(DISPUTE_STATUSES).optional(),
});
export type ListDisputesQuery = z.infer<typeof listDisputesQuerySchema>;

export const reviewDisputeSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
  adminNote: z.string().trim().max(1000).optional(),
});
export type ReviewDisputeInput = z.infer<typeof reviewDisputeSchema>;
