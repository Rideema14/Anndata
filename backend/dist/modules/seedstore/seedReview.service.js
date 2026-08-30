"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeedReviews = listSeedReviews;
exports.createSeedReview = createSeedReview;
exports.updateSeedReview = updateSeedReview;
exports.deleteSeedReview = deleteSeedReview;
exports.setSeedReviewApproval = setSeedReviewApproval;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
async function recomputeSeedRating(tx, seedId) {
    const agg = await tx.seedReview.aggregate({
        where: { seedId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await tx.seed.update({
        where: { id: seedId },
        data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.rating },
    });
}
async function listSeedReviews(seedId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { seedId, isApproved: true };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.seedReview.findMany({
            where,
            include: { user: { select: { id: true, name: true, profileImage: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.seedReview.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function createSeedReview(seedId, userId, data) {
    const seed = await prisma_1.default.seed.findUnique({ where: { id: seedId } });
    if (!seed || !seed.isActive)
        throw ApiError_1.default.notFound('Seed not found.');
    const existing = await prisma_1.default.seedReview.findUnique({ where: { seedId_userId: { seedId, userId } } });
    if (existing)
        throw ApiError_1.default.conflict('You have already reviewed this seed. Edit your existing review instead.');
    return prisma_1.default.$transaction(async (tx) => {
        const review = await tx.seedReview.create({ data: { seedId, userId, ...data } });
        await recomputeSeedRating(tx, seedId);
        return review;
    });
}
async function updateSeedReview(reviewId, userId, data) {
    const review = await prisma_1.default.seedReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== userId)
        throw ApiError_1.default.forbidden('You can only edit your own review.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.seedReview.update({ where: { id: reviewId }, data });
        await recomputeSeedRating(tx, review.seedId);
        return updated;
    });
}
async function deleteSeedReview(reviewId, user) {
    const review = await prisma_1.default.seedReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You can only delete your own review.');
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.seedReview.delete({ where: { id: reviewId } });
        await recomputeSeedRating(tx, review.seedId);
    });
}
async function setSeedReviewApproval(reviewId, isApproved) {
    const review = await prisma_1.default.seedReview.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.seedReview.update({ where: { id: reviewId }, data: { isApproved } });
        await recomputeSeedRating(tx, review.seedId);
        return updated;
    });
}
//# sourceMappingURL=seedReview.service.js.map