"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestVisit = requestVisit;
exports.listVisitRequestsForLand = listVisitRequestsForLand;
exports.myVisitRequests = myVisitRequests;
exports.getVisitRequestById = getVisitRequestById;
exports.updateVisitStatus = updateVisitStatus;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const VISIT_INCLUDE_DETAIL = {
    land: { select: { id: true, title: true, slug: true, sellerId: true, location: true } },
    buyer: { select: { id: true, name: true, phone: true, email: true } },
};
function assertCanView(visit, user) {
    if (user.role === 'ADMIN')
        return;
    if (visit.buyerId === user.id)
        return;
    if (visit.land.sellerId === user.id)
        return;
    throw ApiError_1.default.forbidden('You do not have permission to view this visit request.');
}
/**
 * Buyer-initiated visit request. A buyer can only have one *live* request
 * per listing — a repeat request reschedules the existing one and puts it
 * back to PENDING, matching the "replace the previous request" behaviour
 * the frontend's LandContext already does client-side.
 */
async function requestVisit(landId, buyer, data) {
    if (buyer.role === 'ADMIN') {
        throw ApiError_1.default.badRequest('Admin accounts cannot request land visits.');
    }
    const land = await prisma_1.default.land.findUnique({ where: { id: landId } });
    if (!land || !land.isActive)
        throw ApiError_1.default.notFound('Land listing not found.');
    if (land.sellerId === buyer.id)
        throw ApiError_1.default.badRequest('You cannot request a visit for your own listing.');
    const today = new Date(new Date().toDateString());
    if (data.visitDate < today)
        throw ApiError_1.default.badRequest('visitDate cannot be in the past.');
    return prisma_1.default.landVisitRequest.upsert({
        where: { landId_buyerId: { landId, buyerId: buyer.id } },
        create: {
            landId,
            buyerId: buyer.id,
            visitDate: data.visitDate,
            visitTime: data.visitTime,
            message: data.message,
            status: 'PENDING',
        },
        update: {
            visitDate: data.visitDate,
            visitTime: data.visitTime,
            message: data.message,
            status: 'PENDING',
            responseNote: null,
        },
        include: VISIT_INCLUDE_DETAIL,
    });
}
async function listVisitRequestsForLand(landId, user, query) {
    const land = await prisma_1.default.land.findUnique({ where: { id: landId } });
    if (!land)
        throw ApiError_1.default.notFound('Land listing not found.');
    if (user.role !== 'ADMIN' && land.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to view visit requests for this listing.');
    }
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { landId };
    if (query.status)
        where.status = query.status;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.landVisitRequest.findMany({ where, include: VISIT_INCLUDE_DETAIL, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.landVisitRequest.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function myVisitRequests(buyer, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { buyerId: buyer.id };
    if (query.status)
        where.status = query.status;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.landVisitRequest.findMany({ where, include: VISIT_INCLUDE_DETAIL, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.landVisitRequest.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getVisitRequestById(id, user) {
    const visit = await prisma_1.default.landVisitRequest.findUnique({ where: { id }, include: VISIT_INCLUDE_DETAIL });
    if (!visit)
        throw ApiError_1.default.notFound('Visit request not found.');
    assertCanView(visit, user);
    return visit;
}
/** Seller (or admin) accepts/rejects/completes a request on their listing. */
async function updateVisitStatus(id, user, { status, responseNote }) {
    const visit = await prisma_1.default.landVisitRequest.findUnique({ where: { id }, include: VISIT_INCLUDE_DETAIL });
    if (!visit)
        throw ApiError_1.default.notFound('Visit request not found.');
    const isOwner = visit.land.sellerId === user.id;
    const isBuyer = visit.buyerId === user.id;
    if (user.role !== 'ADMIN' && !isOwner && !isBuyer) {
        throw ApiError_1.default.forbidden('You do not have permission to update this visit request.');
    }
    // Only the seller (or admin) can accept/reject/complete; the buyer's only
    // allowed transition is cancelling their own request.
    if (status !== 'CANCELLED' && !isOwner && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('Only the listing owner can accept, reject, or complete a visit request.');
    }
    if (status === 'CANCELLED' && !isBuyer && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('Only the requesting buyer can cancel a visit request.');
    }
    if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(visit.status)) {
        throw ApiError_1.default.badRequest(`This visit request is already ${visit.status.toLowerCase()} and cannot be changed further.`);
    }
    return prisma_1.default.landVisitRequest.update({
        where: { id },
        data: { status, responseNote },
        include: VISIT_INCLUDE_DETAIL,
    });
}
//# sourceMappingURL=landVisit.service.js.map