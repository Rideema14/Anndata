"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getAnalytics = getAnalytics;
exports.getBookingCalendar = getBookingCalendar;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
async function getDashboard(sellerId) {
    const today = new Date(new Date().toDateString());
    const [activeListings, totalListings, bookingsToFulfill, activeRentalsToday, revenueRows, revenue30dRows] = await Promise.all([
        prisma_1.default.machinery.count({ where: { sellerId, isActive: true } }),
        prisma_1.default.machinery.count({ where: { sellerId } }),
        prisma_1.default.machineryBooking.count({ where: { machinery: { sellerId }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
        prisma_1.default.machineryBooking.count({
            where: { machinery: { sellerId }, status: 'ACTIVE', startDate: { lte: today }, endDate: { gte: today } },
        }),
        prisma_1.default.$queryRaw `
      SELECT COALESCE(SUM(mb."totalAmount"), 0)::float AS revenue
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId} AND mb.status != 'CANCELLED'
    `,
        prisma_1.default.$queryRaw `
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
async function getAnalytics(sellerId, { days, topMachineryLimit }) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const to = new Date();
    const [bookingTrend, topMachinery, statusBreakdown, bookedUnitDaysRows, fleetAgg] = await Promise.all([
        prisma_1.default.$queryRaw `
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
        prisma_1.default.$queryRaw `
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
        prisma_1.default.$queryRaw `
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
        prisma_1.default.$queryRaw(client_1.Prisma.sql `
        SELECT COALESCE(SUM(
          mb.quantity * (LEAST(mb."endDate", ${to}::date) - GREATEST(mb."startDate", ${from}::date) + 1)
        ), 0)::float AS "bookedUnitDays"
        FROM machinery_bookings mb
        JOIN machinery m ON m.id = mb."machineryId"
        WHERE m."sellerId" = ${sellerId}
          AND mb.status != 'CANCELLED'
          AND mb."startDate" <= ${to}::date
          AND mb."endDate" >= ${from}::date
      `),
        prisma_1.default.machinery.aggregate({ where: { sellerId, isActive: true }, _sum: { totalUnits: true } }),
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
/**
 * Booking blocks (not a pre-expanded day-by-day grid) — the shape a calendar
 * / resource-timeline UI component expects: each entry already carries the
 * machine, quantity, and date range, which is what actually needs to render
 * as "these many of this machine, booked from this day to this day."
 */
async function getBookingCalendar(sellerId, { from, to, machineryId }) {
    const where = {
        machinery: { sellerId },
        startDate: { lte: to },
        endDate: { gte: from },
    };
    if (machineryId)
        where.machineryId = machineryId;
    const bookings = await prisma_1.default.machineryBooking.findMany({
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
//# sourceMappingURL=machineryAnalytics.service.js.map