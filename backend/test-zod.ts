import { z } from 'zod';

const MACHINERY_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

const listBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(MACHINERY_BOOKING_STATUSES).optional(),
  machineryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

const machineryQuerySchema = z
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

try {
  console.log('Testing listBookingsQuerySchema');
  const b = listBookingsQuerySchema.parse({ limit: '50' });
  console.log('listBookingsQuerySchema passed:', b);
} catch (err) {
  console.error('listBookingsQuerySchema failed:', err);
}

try {
  console.log('\nTesting machineryQuerySchema');
  const m = machineryQuerySchema.parse({ sortBy: 'newest', limit: '48' });
  console.log('machineryQuerySchema passed:', m);
} catch (err) {
  console.error('machineryQuerySchema failed:', err);
}
