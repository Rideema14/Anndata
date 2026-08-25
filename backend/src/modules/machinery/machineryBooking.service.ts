import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { emitOrderUpdate } from '../../config/socket';
import { assertAvailable, countRentalDays } from './machineryAvailability.service';
import type { CreateBookingInput, ListBookingsQuery, UpdateBookingStatusInput, CancelBookingInput } from './machinery.validation';

const BOOKING_INCLUDE_DETAIL = {
  machinery: { select: { id: true, name: true, slug: true, sellerId: true, bufferDays: true } },
  user: { select: { id: true, name: true, phone: true, profileImage: true } },
  address: true,
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  payment: true,
} satisfies Prisma.MachineryBookingInclude;

type BookingWithDetail = Prisma.MachineryBookingGetPayload<{ include: typeof BOOKING_INCLUDE_DETAIL }>;

const TAX_RATE = 0.05; // same placeholder tax used elsewhere — adjust to your actual policy
const MAX_SERIALIZATION_RETRIES = 3;

async function generateUniqueBookingNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomInt(1000, 9999);
    const candidate = `MRENT-${ymd}-${rand}`;
    // eslint-disable-next-line no-await-in-loop
    const clash = await prisma.machineryBooking.findUnique({ where: { bookingNumber: candidate } });
    if (!clash) return candidate;
  }
  throw ApiError.internal('Could not generate a unique booking number. Please try again.');
}

/** Highest tier whose minQuantity the booking meets or exceeds — best discount qualified for, not stacked. */
function pickDiscountTier<T extends { minQuantity: number; discountPercent: Prisma.Decimal }>(tiers: T[], quantity: number): T | null {
  const eligible = tiers.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity);
  return eligible[0] ?? null;
}

function assertCanView(booking: BookingWithDetail, user: User) {
  if (user.role === 'ADMIN') return;
  if (booking.userId === user.id) return;
  if (booking.machinery.sellerId === user.id) return;
  throw ApiError.forbidden('You do not have permission to view this booking.');
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
async function runSerializable<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (err) {
      const isSerializationFailure = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
      if (!isSerializationFailure || attempt === MAX_SERIALIZATION_RETRIES) throw err;
      // fall through and retry
    }
  }
  // Unreachable — the loop above always either returns or throws — but
  // TypeScript can't see that, so satisfy the return type explicitly.
  throw ApiError.conflict('Could not complete the booking due to high demand. Please try again.');
}

export async function createBooking(userId: string, data: CreateBookingInput): Promise<BookingWithDetail> {
  const today = new Date(new Date().toDateString());
  if (data.startDate < today) {
    throw ApiError.badRequest('startDate cannot be in the past.');
  }

  if (data.addressId) {
    const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw ApiError.badRequest('Address not found for this account.');
  }

  const machinery = await prisma.machinery.findUnique({ where: { id: data.machineryId }, include: { discountTiers: true } });
  if (!machinery || !machinery.isActive) throw ApiError.notFound('Machinery listing not found.');

  const rentalDays = countRentalDays(data.startDate, data.endDate);
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
    await assertAvailable(tx, machinery.id, machinery.totalUnits, machinery.bufferDays, data.startDate, data.endDate, data.quantity);

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

export async function listBookings(user: User, query: ListBookingsQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.MachineryBookingWhereInput = {};
  if (query.scope === 'selling') {
    where.machinery = { sellerId: user.id };
  } else if (query.scope === 'mine') {
    where.userId = user.id;
  } else if (user.role === 'ADMIN') {
    if (query.userId) where.userId = query.userId;
  } else {
    // Either the renter, or the seller of the machinery being booked.
    where.OR = [{ userId: user.id }, { machinery: { sellerId: user.id } }];
  }
  if (query.status) where.status = query.status;
  if (query.machineryId) where.machineryId = query.machineryId;

  const [items, totalItems] = await Promise.all([
    prisma.machineryBooking.findMany({
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
    prisma.machineryBooking.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getBookingById(bookingId: string, user: User) {
  const booking = await prisma.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
  if (!booking) throw ApiError.notFound('Booking not found.');
  assertCanView(booking, user);
  return booking;
}

export async function updateBookingStatus(bookingId: string, user: User, { status, note }: UpdateBookingStatusInput) {
  const booking = await prisma.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (user.role !== 'ADMIN' && booking.machinery.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to update this booking.');
  }
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    throw ApiError.badRequest(`Booking is already ${booking.status.toLowerCase()} and cannot be changed further.`);
  }

  const updated = await prisma.machineryBooking.update({
    where: { id: bookingId },
    data: { status, statusHistory: { create: { status, note, changedById: user.id } } },
    include: BOOKING_INCLUDE_DETAIL,
  });

  emitOrderUpdate({ id: updated.id, orderNumber: updated.bookingNumber, status: updated.status, updatedAt: updated.updatedAt, userId: updated.userId });
  return updated;
}

export async function cancelBooking(bookingId: string, user: User, { reason }: CancelBookingInput) {
  const booking = await prisma.machineryBooking.findUnique({ where: { id: bookingId }, include: BOOKING_INCLUDE_DETAIL });
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (user.role !== 'ADMIN' && booking.userId !== user.id) {
    throw ApiError.forbidden('You do not have permission to cancel this booking.');
  }
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw ApiError.badRequest(`Booking can no longer be cancelled once it is ${booking.status.toLowerCase()}.`);
  }

  const updated = await prisma.machineryBooking.update({
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

  emitOrderUpdate({ id: updated.id, orderNumber: updated.bookingNumber, status: updated.status, updatedAt: updated.updatedAt, userId: updated.userId });
  return updated;
}
