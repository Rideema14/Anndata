import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import type { MachineryAnalyticsQuery, CalendarQuery } from './machinery.validation';

export async function getDashboard(sellerId: string) {
  const today = new Date(new Date().toDateString());

  const [activeListings, totalListings, bookingsToFulfill, activeRentalsToday, revenueRows, revenue30dRows] = await Promise.all([
    prisma.machinery.count({ where: { sellerId, isActive: true } }),
    prisma.machinery.count({ where: { sellerId } }),
    prisma.machineryBooking.count({ where: { machinery: { sellerId }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.machineryBooking.count({
      where: { machinery: { sellerId }, status: 'ACTIVE', startDate: { lte: today }, endDate: { gte: today } },
    }),
    prisma.$queryRaw<{ revenue: number }[]>`
      SELECT COALESCE(SUM(mb."totalAmount"), 0)::float AS revenue
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId} AND mb.status != 'CANCELLED'
    `,
    prisma.$queryRaw<{ revenue: number }[]>`
      SELECT COALESCE(SUM(mb."totalAmount"), 0)::float AS revenue
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId} AND mb.status != 'CANCELLED' AND mb."createdAt" >= NOW() - INTERVAL '30 days'
    `,
  ]);

  return {
    activeListings,
    totalListings,
    bookingsToFulfill,
    activeRentalsToday,
    totalRevenue: revenueRows[0]?.revenue ?? 0,
    revenueLast30Days: revenue30dRows[0]?.revenue ?? 0,
  };
}

interface BookingTrendRow {
  date: Date;
  revenue: number;
  bookingCount: number;
}
interface TopMachineryRow {
  id: string;
  name: string;
  slug: string;
  bookingCount: number;
  revenue: number;
}
interface StatusBreakdownRow {
  status: string;
  count: number;
}

export async function getAnalytics(sellerId: string, { days, topMachineryLimit }: MachineryAnalyticsQuery) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const to = new Date();

  const [bookingTrend, topMachinery, statusBreakdown, bookedUnitDaysRows, fleetAgg] = await Promise.all([
    prisma.$queryRaw<BookingTrendRow[]>`
      SELECT
        DATE_TRUNC('day', mb."createdAt")::date AS date,
        COALESCE(SUM(mb."totalAmount"), 0)::float AS revenue,
        COUNT(*)::int AS "bookingCount"
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId}
        AND mb.status != 'CANCELLED'
        AND mb."createdAt" >= NOW() - (${days}::text || ' days')::interval
      GROUP BY DATE_TRUNC('day', mb."createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<TopMachineryRow[]>`
      SELECT m.id, m.name, m.slug,
        COUNT(mb.id)::int AS "bookingCount",
        COALESCE(SUM(mb."totalAmount"), 0)::float AS revenue
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId} AND mb.status != 'CANCELLED'
      GROUP BY m.id, m.name, m.slug
      ORDER BY revenue DESC
      LIMIT ${topMachineryLimit}
    `,
    prisma.$queryRaw<StatusBreakdownRow[]>`
      SELECT mb.status, COUNT(*)::int AS count
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId}
      GROUP BY mb.status
    `,
    // Booked unit-days: each overlapping booking's quantity times however
    // many of its days fall inside [from, to] — clipped with LEAST/GREATEST
    // rather than counting the booking's full length, so a booking that
    // only partially overlaps the window isn't over-counted.
    prisma.$queryRaw<{ bookedUnitDays: number }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(
          mb.quantity * (LEAST(mb."endDate", ${to}::date) - GREATEST(mb."startDate", ${from}::date) + 1)
        ), 0)::float AS "bookedUnitDays"
        FROM machinery_bookings mb
        JOIN machinery m ON m.id = mb."machineryId"
        WHERE m."sellerId" = ${sellerId}
          AND mb.status != 'CANCELLED'
          AND mb."startDate" <= ${to}::date
          AND mb."endDate" >= ${from}::date
      `
    ),
    prisma.machinery.aggregate({ where: { sellerId, isActive: true }, _sum: { totalUnits: true } }),
  ]);

  const totalUnits = fleetAgg._sum.totalUnits ?? 0;
  const totalPossibleUnitDays = totalUnits * days;
  const bookedUnitDays = bookedUnitDaysRows[0]?.bookedUnitDays ?? 0;
  const utilizationRatePercent = totalPossibleUnitDays > 0 ? Math.round((bookedUnitDays / totalPossibleUnitDays) * 10000) / 100 : 0;

  return {
    bookingTrend,
    topMachinery,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s.count })),
    utilization: {
      periodDays: days,
      fleetSize: totalUnits,
      bookedUnitDays,
      totalPossibleUnitDays,
      utilizationRatePercent,
    },
  };
}

export interface CalendarBooking {
  bookingId: string;
  bookingNumber: string;
  machineryId: string;
  machineryName: string;
  renterName: string;
  quantity: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

/**
 * Booking blocks (not a pre-expanded day-by-day grid) — the shape a calendar
 * / resource-timeline UI component expects: each entry already carries the
 * machine, quantity, and date range, which is what actually needs to render
 * as "these many of this machine, booked from this day to this day."
 */
export async function getBookingCalendar(sellerId: string, { from, to, machineryId }: CalendarQuery): Promise<CalendarBooking[]> {
  const where: Prisma.MachineryBookingWhereInput = {
    machinery: { sellerId },
    startDate: { lte: to },
    endDate: { gte: from },
  };
  if (machineryId) where.machineryId = machineryId;

  const bookings = await prisma.machineryBooking.findMany({
    where,
    select: {
      id: true,
      bookingNumber: true,
      quantity: true,
      startDate: true,
      endDate: true,
      status: true,
      machinery: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return bookings.map((b) => ({
    bookingId: b.id,
    bookingNumber: b.bookingNumber,
    machineryId: b.machinery.id,
    machineryName: b.machinery.name,
    renterName: b.user.name,
    quantity: b.quantity,
    startDate: b.startDate,
    endDate: b.endDate,
    status: b.status,
  }));
}
