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

<<<<<<< HEAD
export const sellerBalancesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().min(1).optional(),
});
export type SellerBalancesQuery = z.infer<typeof sellerBalancesQuerySchema>;

export const listPayoutsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListPayoutsQuery = z.infer<typeof listPayoutsQuerySchema>;

export const createPayoutSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'UPI', 'OTHER']).default('BANK_TRANSFER'),
  reference: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
=======
// ---------------------------------------------------------------------------
// Shipment management (requirement #10) & disputes (requirement #9)
// ---------------------------------------------------------------------------

export const SHIPMENT_STATUSES = [
  'AWB_SUBMITTED',
  'AWB_VERIFIED',
  'PICKUP_CONFIRMED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'RETURNED',
  'EXCEPTION',
] as const;

export const listShipmentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  flagged: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  disputed: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  // Matches order number or AWB.
  search: z.string().trim().min(1).optional(),
});
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;

// Admin can flag a shipment for investigation and attach a note — this is
// the ONLY shipment field an admin may write directly. Courier-derived
// fields (status, pickupConfirmedAt, deliveredAt, events, ...) are never
// exposed for direct admin edits (requirement #10: "manually changing
// courier-derived historical events should not be allowed").
export const flagShipmentSchema = z.object({
  note: z.string().trim().min(1, 'Add a note explaining why this shipment is flagged.').max(1000),
});
export type FlagShipmentInput = z.infer<typeof flagShipmentSchema>;

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
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
