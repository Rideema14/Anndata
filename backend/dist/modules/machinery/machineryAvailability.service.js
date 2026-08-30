"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDays = addDays;
exports.countRentalDays = countRentalDays;
exports.getConflictingQuantity = getConflictingQuantity;
exports.checkAvailability = checkAvailability;
exports.assertAvailable = assertAvailable;
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
// Every status except CANCELLED still occupies the unit for its date range —
// a booking that already happened (COMPLETED) is history, not a live hold,
// but its dates are almost always in the past anyway, so including it here
// costs nothing and stays correct for the rare backdated-record case.
const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'];
function addDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}
function countRentalDays(startDate, endDate) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1; // inclusive of both ends
}
/**
 * Sum of quantities from bookings that conflict with [startDate, endDate]
 * given this listing's buffer. Pass a transaction client during booking
 * creation so the read participates in that transaction's isolation level.
 */
async function getConflictingQuantity(client, machineryId, startDate, endDate, bufferDays, excludeBookingId) {
    const where = {
        machineryId,
        status: { in: BLOCKING_STATUSES },
        endDate: { gte: addDays(startDate, -bufferDays) },
        startDate: { lte: addDays(endDate, bufferDays) },
    };
    if (excludeBookingId)
        where.id = { not: excludeBookingId };
    const result = await client.machineryBooking.aggregate({ where, _sum: { quantity: true } });
    return result._sum.quantity ?? 0;
}
async function checkAvailability(client, machineryId, totalUnits, bufferDays, startDate, endDate, excludeBookingId) {
    const bookedQuantity = await getConflictingQuantity(client, machineryId, startDate, endDate, bufferDays, excludeBookingId);
    return { totalUnits, bookedQuantity, availableQuantity: totalUnits - bookedQuantity };
}
/** Throws if fewer than `quantity` units are free for the range. Used inside the booking-creation transaction. */
async function assertAvailable(client, machineryId, totalUnits, bufferDays, startDate, endDate, quantity, excludeBookingId) {
    const { availableQuantity } = await checkAvailability(client, machineryId, totalUnits, bufferDays, startDate, endDate, excludeBookingId);
    if (availableQuantity < quantity) {
        throw ApiError_1.default.conflict(availableQuantity <= 0
            ? 'No machines are free for those dates. Please try different dates.'
            : `Only ${availableQuantity} machine(s) free for those dates. Please reduce the amount or pick different dates.`);
    }
}
//# sourceMappingURL=machineryAvailability.service.js.map