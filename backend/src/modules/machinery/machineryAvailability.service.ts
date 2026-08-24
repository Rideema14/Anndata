/**
 * Availability for a machinery listing is NOT a stored counter — it's
 * computed per date-range by summing the quantity of existing bookings that
 * conflict with the requested range, then subtracting from totalUnits.
 *
 * "Conflict" accounts for the mandatory buffer period after each booking
 * (recovery time before the same units can go out again). Widening the
 * requested range by the buffer on both sides and doing a standard interval
 * overlap test against each existing booking's raw [startDate, endDate]
 * gives the correct symmetric result regardless of which booking comes
 * first chronologically:
 *
 *   conflict  ⟺  requestedStart <= existingEnd + buffer
 *             AND existingStart <= requestedEnd + buffer
 *
 * Rearranged into a WHERE clause on the existing rows:
 *   existingEnd   >= requestedStart - buffer
 *   existingStart <= requestedEnd + buffer
 *
 * Example: an existing booking ends Day 5 with a 1-day buffer. The unit is
 * occupied through Day 6 (recovery), so the earliest a new booking can start
 * is Day 7 — requestedStart <= 5+1 is false once requestedStart is 7, so no
 * conflict is reported, which is exactly the intended rule.
 */
import type { Prisma, MachineryBookingStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';

// Every status except CANCELLED still occupies the unit for its date range —
// a booking that already happened (COMPLETED) is history, not a live hold,
// but its dates are almost always in the past anyway, so including it here
// costs nothing and stays correct for the rare backdated-record case.
const BLOCKING_STATUSES: MachineryBookingStatus[] = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'];

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function countRentalDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1; // inclusive of both ends
}

type PrismaOrTx = typeof prisma | Prisma.TransactionClient;

/**
 * Sum of quantities from bookings that conflict with [startDate, endDate]
 * given this listing's buffer. Pass a transaction client during booking
 * creation so the read participates in that transaction's isolation level.
 */
export async function getConflictingQuantity(
  client: PrismaOrTx,
  machineryId: string,
  startDate: Date,
  endDate: Date,
  bufferDays: number,
  excludeBookingId?: string
): Promise<number> {
  const where: Prisma.MachineryBookingWhereInput = {
    machineryId,
    status: { in: BLOCKING_STATUSES },
    endDate: { gte: addDays(startDate, -bufferDays) },
    startDate: { lte: addDays(endDate, bufferDays) },
  };
  if (excludeBookingId) where.id = { not: excludeBookingId };

  const result = await client.machineryBooking.aggregate({ where, _sum: { quantity: true } });
  return result._sum.quantity ?? 0;
}

export interface AvailabilityResult {
  totalUnits: number;
  bookedQuantity: number;
  availableQuantity: number;
}

export async function checkAvailability(
  client: PrismaOrTx,
  machineryId: string,
  totalUnits: number,
  bufferDays: number,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<AvailabilityResult> {
  const bookedQuantity = await getConflictingQuantity(client, machineryId, startDate, endDate, bufferDays, excludeBookingId);
  return { totalUnits, bookedQuantity, availableQuantity: totalUnits - bookedQuantity };
}

/** Throws if fewer than `quantity` units are free for the range. Used inside the booking-creation transaction. */
export async function assertAvailable(
  client: PrismaOrTx,
  machineryId: string,
  totalUnits: number,
  bufferDays: number,
  startDate: Date,
  endDate: Date,
  quantity: number,
  excludeBookingId?: string
): Promise<void> {
  const { availableQuantity } = await checkAvailability(client, machineryId, totalUnits, bufferDays, startDate, endDate, excludeBookingId);
  if (availableQuantity < quantity) {
    throw ApiError.conflict(
      availableQuantity <= 0
        ? 'No units are available for those dates.'
        : `Only ${availableQuantity} unit(s) available for those dates.`
    );
  }
}
