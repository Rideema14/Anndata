import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { SeedReviewInput } from './seed.validation';
import type { PaginationQuery } from '../../common/utils/pagination';

async function recomputeSeedRating(tx: Prisma.TransactionClient, seedId: string) {
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

export async function listSeedReviews(seedId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.SeedReviewWhereInput = { seedId, isApproved: true };

  const [items, totalItems] = await Promise.all([
    prisma.seedReview.findMany({
      where,
      include: { user: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.seedReview.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function createSeedReview(seedId: string, userId: string, data: SeedReviewInput) {
  const seed = await prisma.seed.findUnique({ where: { id: seedId } });
  if (!seed || !seed.isActive) throw ApiError.notFound('Seed not found.');

  const existing = await prisma.seedReview.findUnique({ where: { seedId_userId: { seedId, userId } } });
  if (existing) throw ApiError.conflict('You have already reviewed this seed. Edit your existing review instead.');

  return prisma.$transaction(async (tx) => {
    const review = await tx.seedReview.create({ data: { seedId, userId, ...data } });
    await recomputeSeedRating(tx, seedId);
    return review;
  });
}

export async function updateSeedReview(reviewId: string, userId: string, data: Partial<SeedReviewInput>) {
  const review = await prisma.seedReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== userId) throw ApiError.forbidden('You can only edit your own review.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.seedReview.update({ where: { id: reviewId }, data });
    await recomputeSeedRating(tx, review.seedId);
    return updated;
  });
}

export async function deleteSeedReview(reviewId: string, user: { id: string; role: string }) {
  const review = await prisma.seedReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.seedReview.delete({ where: { id: reviewId } });
    await recomputeSeedRating(tx, review.seedId);
  });
}

export async function setSeedReviewApproval(reviewId: string, isApproved: boolean) {
  const review = await prisma.seedReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.seedReview.update({ where: { id: reviewId }, data: { isApproved } });
    await recomputeSeedRating(tx, review.seedId);
    return updated;
  });
}
