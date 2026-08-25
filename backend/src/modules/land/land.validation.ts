import { z } from 'zod';

export const LAND_DEAL_TYPES = ['SALE', 'LEASE'] as const;
export const LAND_VISIT_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const;

export const landCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  areaAcres: z.coerce.number().positive(),
  dealType: z.enum(LAND_DEAL_TYPES),
  price: z.coerce.number().positive(),
  location: z.string().trim().min(2).max(200),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  soilType: z.string().trim().max(100).optional(),
  waterSource: z.string().trim().max(100).optional(),
});
export type LandCreateInput = z.infer<typeof landCreateSchema>;

export const landUpdateSchema = landCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type LandUpdateInput = z.infer<typeof landUpdateSchema>;

export const landQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().optional(),
  dealType: z.enum(LAND_DEAL_TYPES).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  maxArea: z.coerce.number().positive().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  sellerId: z.string().uuid().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc']).default('newest'),
});
export type LandQuery = z.infer<typeof landQuerySchema>;

export const myListingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type MyListingsQuery = z.infer<typeof myListingsQuerySchema>;

// --- Visit requests -------------------------------------------------------

export const createVisitRequestSchema = z.object({
  visitDate: z.coerce.date(),
  visitTime: z.string().trim().min(1).max(50),
  message: z.string().trim().max(1000).optional(),
});
export type CreateVisitRequestInput = z.infer<typeof createVisitRequestSchema>;

export const updateVisitStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  responseNote: z.string().trim().max(500).optional(),
});
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;

export const listVisitRequestsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(LAND_VISIT_STATUSES).optional(),
});
export type ListVisitRequestsQuery = z.infer<typeof listVisitRequestsQuerySchema>;
