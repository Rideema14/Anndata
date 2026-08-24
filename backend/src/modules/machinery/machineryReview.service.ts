import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { MachineryReviewInput } from './machinery.validation';
import type { PaginationQuery } from '../../common/utils/pagination';

async function recomputeMachineryRating(tx: Prisma.TransactionClient, machineryId: string) {
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

export async function listMachineryReviews(machineryId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.MachineryReviewWhereInput = { machineryId, isApproved: true };

  const [items, totalItems] = await Promise.all([
    prisma.machineryReview.findMany({
      where,
      include: { user: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.machineryReview.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function createMachineryReview(machineryId: string, userId: string, data: MachineryReviewInput) {
  const machinery = await prisma.machinery.findUnique({ where: { id: machineryId } });
  if (!machinery || !machinery.isActive) throw ApiError.notFound('Machinery listing not found.');

  const existing = await prisma.machineryReview.findUnique({ where: { machineryId_userId: { machineryId, userId } } });
  if (existing) throw ApiError.conflict('You have already reviewed this listing. Edit your existing review instead.');

  if (data.bookingId) {
    const booking = await prisma.machineryBooking.findUnique({ where: { id: data.bookingId } });
    if (!booking || booking.userId !== userId || booking.machineryId !== machineryId) {
      throw ApiError.badRequest('bookingId does not belong to you for this listing.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.machineryReview.create({ data: { machineryId, userId, ...data } });
    await recomputeMachineryRating(tx, machineryId);
    return review;
  });
}

export async function updateMachineryReview(reviewId: string, userId: string, data: Partial<MachineryReviewInput>) {
  const review = await prisma.machineryReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== userId) throw ApiError.forbidden('You can only edit your own review.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.machineryReview.update({ where: { id: reviewId }, data });
    await recomputeMachineryRating(tx, review.machineryId);
    return updated;
  });
}

export async function deleteMachineryReview(reviewId: string, user: { id: string; role: string }) {
  const review = await prisma.machineryReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.machineryReview.delete({ where: { id: reviewId } });
    await recomputeMachineryRating(tx, review.machineryId);
  });
}

export async function setMachineryReviewApproval(reviewId: string, isApproved: boolean) {
  const review = await prisma.machineryReview.findUnique({ where: { id: reviewId } });
  if (!review) throw ApiError.notFound('Review not found.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.machineryReview.update({ where: { id: reviewId }, data: { isApproved } });
    await recomputeMachineryRating(tx, review.machineryId);
    return updated;
  });
}
