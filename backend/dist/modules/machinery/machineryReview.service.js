"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMachineryReviews = listMachineryReviews;
exports.createMachineryReview = createMachineryReview;
exports.updateMachineryReview = updateMachineryReview;
exports.deleteMachineryReview = deleteMachineryReview;
exports.setMachineryReviewApproval = setMachineryReviewApproval;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
async function recomputeMachineryRating(tx, machineryId) {
    const agg = await tx.machineryReview.aggregate({
        where: { machineryId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await tx.machinery.update({
        where: { id: machineryId },
        data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.rating },
    });
}
async function listMachineryReviews(machineryId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { machineryId, isApproved: true };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.machineryReview.findMany({
            where,
            include: { user: { select: { id: true, name: true, profileImage: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.machineryReview.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function createMachineryReview(machineryId, userId, data) {
    const machinery = await prisma_1.default.machinery.findUnique({ where: { id: machineryId } });
    if (!machinery || !machinery.isActive)
        throw ApiError_1.default.notFound('Machinery listing not found.');
    const existing = await prisma_1.default.machineryReview.findUnique({ where: { machineryId_userId: { machineryId, userId } } });
    if (existing)
        throw ApiError_1.default.conflict('You have already reviewed this listing. Edit your existing review instead.');
    if (data.bookingId) {
        const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: data.bookingId } });
        if (!booking || booking.userId !== userId || booking.machineryId !== machineryId) {
            throw ApiError_1.default.badRequest('bookingId does not belong to you for this listing.');
        }
    }
    return prisma_1.default.$transaction(async (tx) => {
        const review = await tx.machineryReview.create({ data: { machineryId, userId, ...data } });
        await recomputeMachineryRating(tx, machineryId);
        return review;
    });
}
async function updateMachineryReview(reviewId, userId, data) {
    const review = await prisma_1.default.machineryReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== userId)
        throw ApiError_1.default.forbidden('You can only edit your own review.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.machineryReview.update({ where: { id: reviewId }, data });
        await recomputeMachineryRating(tx, review.machineryId);
        return updated;
    });
}
async function deleteMachineryReview(reviewId, user) {
    const review = await prisma_1.default.machineryReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You can only delete your own review.');
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.machineryReview.delete({ where: { id: reviewId } });
        await recomputeMachineryRating(tx, review.machineryId);
    });
}
async function setMachineryReviewApproval(reviewId, isApproved) {
    const review = await prisma_1.default.machineryReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.machineryReview.update({ where: { id: reviewId }, data: { isApproved } });
        await recomputeMachineryRating(tx, review.machineryId);
        return updated;
    });
}
//# sourceMappingURL=machineryReview.service.js.map