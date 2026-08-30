"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineryAnalyticsQuerySchema = exports.calendarQuerySchema = exports.machineryReviewSchema = exports.cancelBookingSchema = exports.listBookingsQuerySchema = exports.updateBookingStatusSchema = exports.MACHINERY_BOOKING_STATUSES = exports.createBookingSchema = exports.availabilityQuerySchema = exports.machineryQuerySchema = exports.machineryUpdateSchema = exports.machineryCreateSchema = exports.discountTierInputSchema = exports.machineryCategorySchema = void 0;
const zod_1 = require("zod");
exports.machineryCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    description: zod_1.z.string().trim().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.discountTierInputSchema = zod_1.z.object({
    minQuantity: zod_1.z.coerce.number().int().positive(),
    discountPercent: zod_1.z.coerce.number().min(0).max(100),
});
exports.machineryCreateSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    name: zod_1.z.string().trim().min(2).max(200),
    description: zod_1.z.string().trim().max(5000).optional(),
    brand: zod_1.z.string().trim().max(100).optional(),
    model: zod_1.z.string().trim().max(100).optional(),
    totalUnits: zod_1.z.coerce.number().int().positive().default(1),
    pricePerDay: zod_1.z.coerce.number().positive(),
    bufferDays: zod_1.z.coerce.number().int().min(0).max(30).default(1),
    specifications: zod_1.z.record(zod_1.z.any()).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    discountTiers: zod_1.z.array(exports.discountTierInputSchema).optional(),
});
exports.machineryUpdateSchema = exports.machineryCreateSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
// Availability filters are opt-in on the search endpoint: pass both dates to
// only see listings with enough free units for that range; omit them to
// browse everything regardless of current bookings.
exports.machineryQuerySchema = zod_1.z
    .object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    search: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().trim().optional(), // category slug
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    sellerId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
    quantity: zod_1.z.coerce.number().int().positive().default(1),
    sortBy: zod_1.z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
})
    .refine((data) => !(data.startDate && data.endDate) || data.startDate <= data.endDate, {
    message: 'Please choose an end date that is on or after the start date.',
    path: ['startDate'],
});
exports.availabilityQuerySchema = zod_1.z
    .object({
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    quantity: zod_1.z.coerce.number().int().positive().default(1),
})
    .refine((data) => data.startDate <= data.endDate, {
    message: 'Please choose an end date that is on or after the start date.',
    path: ['startDate'],
});
exports.createBookingSchema = zod_1.z
    .object({
    machineryId: zod_1.z.string().uuid(),
    quantity: zod_1.z.coerce.number().int().positive().default(1),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    addressId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().trim().max(500).optional(),
})
    .refine((data) => data.startDate <= data.endDate, {
    message: 'Please choose an end date that is on or after the start date.',
    path: ['startDate'],
});
exports.MACHINERY_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.MACHINERY_BOOKING_STATUSES),
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.listBookingsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.MACHINERY_BOOKING_STATUSES).optional(),
    machineryId: zod_1.z.string().uuid().optional(),
    userId: zod_1.z.string().uuid().optional(),
    scope: zod_1.z.enum(['mine', 'selling']).optional(),
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().max(500).optional(),
});
exports.machineryReviewSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().max(1000).optional(),
    bookingId: zod_1.z.string().uuid().optional(),
});
exports.calendarQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date(),
    to: zod_1.z.coerce.date(),
    machineryId: zod_1.z.string().uuid().optional(),
});
exports.machineryAnalyticsQuerySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().positive().max(365).default(30),
    topMachineryLimit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
//# sourceMappingURL=machinery.validation.js.map