import { z } from 'zod';

export const machineryCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type MachineryCategoryInput = z.infer<typeof machineryCategorySchema>;

export const discountTierInputSchema = z.object({
  minQuantity: z.coerce.number().int().positive(),
  discountPercent: z.coerce.number().min(0).max(100),
});
export type DiscountTierInput = z.infer<typeof discountTierInputSchema>;

export const machineryCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  totalUnits: z.coerce.number().int().positive().default(1),
  pricePerDay: z.coerce.number().positive(),
  bufferDays: z.coerce.number().int().min(0).max(30).default(1),
  specifications: z.record(z.any()).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  discountTiers: z.array(discountTierInputSchema).optional(),
});
export type MachineryCreateInput = z.infer<typeof machineryCreateSchema>;

export const machineryUpdateSchema = machineryCreateSchema.partial();
export type MachineryUpdateInput = z.infer<typeof machineryUpdateSchema>;

// Availability filters are opt-in on the search endpoint: pass both dates to
// only see listings with enough free units for that range; omit them to
// browse everything regardless of current bookings.
export const machineryQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(), // category slug
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sellerId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    quantity: z.coerce.number().int().positive().default(1),
    sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  })
  .refine((data) => !(data.startDate && data.endDate) || data.startDate <= data.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });
export type MachineryQuery = z.infer<typeof machineryQuerySchema>;

export const availabilityQuerySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    quantity: z.coerce.number().int().positive().default(1),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const createBookingSchema = z
  .object({
    machineryId: z.string().uuid(),
    quantity: z.coerce.number().int().positive().default(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    addressId: z.string().uuid().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const MACHINERY_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export const updateBookingStatusSchema = z.object({
  status: z.enum(MACHINERY_BOOKING_STATUSES),
  note: z.string().trim().max(500).optional(),
});
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const listBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(MACHINERY_BOOKING_STATUSES).optional(),
  machineryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const machineryReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  bookingId: z.string().uuid().optional(),
});
export type MachineryReviewInput = z.infer<typeof machineryReviewSchema>;

export const calendarQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  machineryId: z.string().uuid().optional(),
});
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

export const machineryAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
  topMachineryLimit: z.coerce.number().int().positive().max(50).default(10),
});
export type MachineryAnalyticsQuery = z.infer<typeof machineryAnalyticsQuerySchema>;
