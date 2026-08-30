"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.listBookings = listBookings;
exports.getBookingById = getBookingById;
exports.updateBookingStatus = updateBookingStatus;
exports.cancelBooking = cancelBooking;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const socket_1 = require("../../config/socket");
const machineryAvailability_service_1 = require("./machineryAvailability.service");
const BOOKING_INCLUDE_DETAIL = {
    machinery: { select: { id: true, name: true, slug: true, sellerId: true, bufferDays: true } },
    user: { select: { id: true, name: true, phone: true, profileImage: true } },
    address: true,
    statusHistory: { orderBy: { changedAt: 'asc' } },
    payment: true,
};
const TAX_RATE = env_1.env.pricing.taxRate; // now sourced from .env — see config/env.ts
const MAX_SERIALIZATION_RETRIES = 3;
async function generateUniqueBookingNumber() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = crypto_1.default.randomInt(1000, 9999);
        const candidate = `MRENT-${ymd}-${rand}`;
        // eslint-disable-next-line no-await-in-loop
        const clash = await prisma_1.default.machineryBooking.findUnique({ where: { bookingNumber: candidate } });
        if (!clash)
            return candidate;
    }
    throw ApiError_1.default.internal('Could not generate a unique booking number. Please try again.');
}
/** Highest tier whose minQuantity the booking meets or exceeds — best discount qualified for, not stacked. */
function pickDiscountTier(tiers, quantity) {
    const eligible = tiers.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity);
    return eligible[0] ?? null;
}
function assertCanView(booking, user) {
    if (user.role === 'ADMIN')
        return;
    if (booking.userId === user.id)
        return;
    if (booking.machinery.sellerId === user.id)
        return;
    throw ApiError_1.default.forbidden('You do not have permission to view this booking.');
}
/**
 * Runs the booking-creation transaction at SERIALIZABLE isolation, so
 * Postgres itself detects two concurrent bookings that would both succeed
 * in isolation but conflict together (the classic "two people book the last
 * unit at the same time" race) and aborts one with a serialization failure
 * (Prisma error code P2034) rather than silently over-booking. That failure
 * is expected under real contention, not a bug — retrying a few times is
 * the correct response, same as any optimistic-concurrency conflict.
 */
async function runSerializable(fn) {
    for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt += 1) {
        try {
            // eslint-disable-next-line no-await-in-loop
            return await prisma_1.default.$transaction(fn, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (err) {
            const isSerializationFailure = err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
            if (!isSerializationFailure || attempt === MAX_SERIALIZATION_RETRIES)
                throw err;
            // fall through and retry
        }
    }
    // Unreachable — the loop above always either returns or throws — but
    // TypeScript can't see that, so satisfy the return type explicitly.
    throw ApiError_1.default.conflict('Could not complete the booking due to high demand. Please try again.');
}
async function createBooking(userId, data) {
    const today = new Date(new Date().toDateString());
    if (data.startDate < today) {
        throw ApiError_1.default.badRequest('You cannot book a start date that has already passed. Please choose today or a later date.');
    }
    if (data.addressId) {
        const address = await prisma_1.default.address.findFirst({ where: { id: data.addressId, userId } });
        if (!address)
            throw ApiError_1.default.badRequest('Address not found for this account.');
    }
    const machinery = await prisma_1.default.machinery.findUnique({ where: { id: data.machineryId }, include: { discountTiers: true } });
    if (!machinery || !machinery.isActive)
        throw ApiError_1.default.notFound('Machinery listing not found.');
    const rentalDays = (0, machineryAvailability_service_1.countRentalDays)(data.startDate, data.endDate);
    const pricePerDay = Number(machinery.pricePerDay);
    const baseSubtotal = pricePerDay * data.quantity * rentalDays;
    const tier = pickDiscountTier(machinery.discountTiers, data.quantity);
    const discountPercent = tier ? Number(tier.discountPercent) : 0;
    const subtotal = Math.round(baseSubtotal * (1 - discountPercent / 100) * 100) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;
    const bookingNumber = await generateUniqueBookingNumber();
    return runSerializable(async (tx) => {
        // Re-checked inside the transaction (not just from the pre-fetch above)
        // so this is the value Postgres's serializable isolation actually
        // guards — the pre-fetch is only there to compute pricing before we
        // open the transaction, not to gate the availability decision itself.
        await (0, machineryAvailability_service_1.assertAvailable)(tx, machinery.id, machinery.totalUnits, machinery.bufferDays, data.startDate, data.endDate, data.quantity);
        return tx.machineryBooking.create({
            data: {
                bookingNumber,
                machineryId: machinery.id,
                userId,
                addressId: data.addressId,
                quantity: data.quantity,
                startDate: data.startDate,
                endDate: data.endDate,
                pricePerDaySnapshot: pricePerDay,
                discountPercentApplied: discountPercent,
                subtotal,
                tax,
                totalAmount,
                notes: data.notes,
                statusHistory: { create: { status: 'PENDING', note: 'Booking created.' } },
            },
            include: BOOKING_INCLUDE_DETAIL,
        });
    });
}
async function listBookings(user, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.scope === 'selling') {
        where.machinery = { sellerId: user.id };
    }
    else if (query.scope === 'mine') {
        where.userId = user.id;
    }
    else if (user.role === 'ADMIN') {
        if (query.userId)
            where.userId = query.userId;
    }
    else {
        // Either the renter, or the seller of the machinery being booked.
        where.OR = [{ userId: user.id }, { machinery: { sellerId: user.id } }];
    }
    if (query.status)
        where.status = query.status;
    if (query.machineryId)
        where.machineryId = query.machineryId;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.machineryBooking.findMany({
            where,
            include: {
                machinery: { select: { id: true, name: true, slug: true, sellerId: true } },
                user: { select: { id: true, name: true, phone: true, profileImage: true } },
                payment: { select: { status: true, method: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.machineryBooking.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getBookingById(bookingId, user) {
    const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
    if (!booking)
        throw ApiError_1.default.notFound('Booking not found.');
    assertCanView(booking, user);
    return booking;
}
async function updateBookingStatus(bookingId, user, { status, note }) {
    const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
    if (!booking)
        throw ApiError_1.default.notFound('Booking not found.');
    if (user.role !== 'ADMIN' && booking.machinery.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to update this booking.');
    }
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        throw ApiError_1.default.badRequest(`Booking is already ${booking.status.toLowerCase()} and cannot be changed further.`);
    }
    const updated = await prisma_1.default.machineryBooking.update({
        where: { id: bookingId },
        data: { status, statusHistory: { create: { status, note, changedById: user.id } } },
        include: BOOKING_INCLUDE_DETAIL,
    });
    (0, socket_1.emitOrderUpdate)({ id: updated.id, orderNumber: updated.bookingNumber, status: updated.status, updatedAt: updated.updatedAt, userId: updated.userId });
    return updated;
}
async function cancelBooking(bookingId, user, { reason }) {
    const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
    if (!booking)
        throw ApiError_1.default.notFound('Booking not found.');
    if (user.role !== 'ADMIN' && booking.userId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to cancel this booking.');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        throw ApiError_1.default.badRequest(`Booking can no longer be cancelled once it is ${booking.status.toLowerCase()}.`);
    }
    const updated = await prisma_1.default.machineryBooking.update({
        where: { id: bookingId },
        data: {
            status: 'CANCELLED',
            cancelReason: reason,
            statusHistory: { create: { status: 'CANCELLED', note: reason || 'Cancelled by request.', changedById: user.id } },
        },
        include: BOOKING_INCLUDE_DETAIL,
    });
    // No stock to restore, unlike Order/SeedOrder — availability here is
    // computed live from non-cancelled bookings, so cancelling one frees its
    // date range automatically on the next availability check.
    (0, socket_1.emitOrderUpdate)({ id: updated.id, orderNumber: updated.bookingNumber, status: updated.status, updatedAt: updated.updatedAt, userId: updated.userId });
    return updated;
}
//# sourceMappingURL=machineryBooking.service.js.map