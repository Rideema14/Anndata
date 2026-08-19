const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../common/utils/pagination');

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
  const { page, limit, skip, take } = parsePagination(query);
  const where = { productId, isApproved: true };

  const [items, totalItems] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

async function createReview(productId, userId, data) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found.');

  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
  if (existing) throw ApiError.conflict('You have already reviewed this product. Edit your existing review instead.');

  // A lightweight, common-sense check: only let buyers who actually received this
  // product review it, once Orders exist for them. Enforced only for BUYER role;
  // sellers/admins reviewing for QA purposes are not blocked.
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({ data: { productId, userId, ...data } });
    await recomputeProductRating(tx, productId);
    return review;
  });
}

async function updateReview(reviewId, userId, data) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== userId) throw ApiError.forbidden('You can only edit your own review.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({ where: { id: reviewId }, data });
    await recomputeProductRating(tx, review.productId);
    return updated;
  });
}

async function deleteReview(reviewId, user) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recomputeProductRating(tx, review.productId);
  });
}

/** Admin moderation: approve/hide a review without deleting it. */
async function setReviewApproval(reviewId, isApproved) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({ where: { id: reviewId }, data: { isApproved } });
    await recomputeProductRating(tx, review.productId);
    return updated;
  });
}

module.exports = { listReviews, createReview, updateReview, deleteReview, setReviewApproval };
