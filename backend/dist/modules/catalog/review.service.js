"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.setReviewApproval = setReviewApproval;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
/** Recomputes avgRating/reviewCount on the product from its approved reviews. */
async function recomputeProductRating(tx, productId) {
    const agg = await tx.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await tx.product.update({
        where: { id: productId },
        data: {
            avgRating: agg._avg.rating || 0,
            reviewCount: agg._count.rating,
        },
    });
}
async function listReviews(productId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { productId, isApproved: true };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.review.findMany({
            where,
            include: { user: { select: { id: true, name: true, profileImage: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.review.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function createReview(productId, userId, data) {
    const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive)
        throw ApiError_1.default.notFound('Product not found.');
    const existing = await prisma_1.default.review.findUnique({ where: { productId_userId: { productId, userId } } });
    if (existing)
        throw ApiError_1.default.conflict('You have already reviewed this product. Edit your existing review instead.');
    return prisma_1.default.$transaction(async (tx) => {
        const review = await tx.review.create({ data: { productId, userId, ...data } });
        await recomputeProductRating(tx, productId);
        return review;
    });
}
async function updateReview(reviewId, userId, data) {
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== userId)
        throw ApiError_1.default.forbidden('You can only edit your own review.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.review.update({ where: { id: reviewId }, data });
        await recomputeProductRating(tx, review.productId);
        return updated;
    });
}
async function deleteReview(reviewId, user) {
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    if (review.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You can only delete your own review.');
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.review.delete({ where: { id: reviewId } });
        await recomputeProductRating(tx, review.productId);
    });
}
/** Admin moderation: approve/hide a review without deleting it. */
async function setReviewApproval(reviewId, isApproved) {
    const review = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw ApiError_1.default.notFound('Review not found.');
    return prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.review.update({ where: { id: reviewId }, data: { isApproved } });
        await recomputeProductRating(tx, review.productId);
        return updated;
    });
}
//# sourceMappingURL=review.service.js.map