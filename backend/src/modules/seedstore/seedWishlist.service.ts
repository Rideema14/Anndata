import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { PaginationQuery } from '../../common/utils/pagination';

export async function listSeedWishlist(userId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const [items, totalItems] = await Promise.all([
    prisma.seedWishlist.findMany({
      where: { userId },
      include: { seed: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.seedWishlist.count({ where: { userId } }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function addToSeedWishlist(userId: string, seedId: string) {
  const seed = await prisma.seed.findUnique({ where: { id: seedId } });
  if (!seed || !seed.isActive) throw ApiError.notFound('Seed not found.');

  return prisma.seedWishlist.upsert({
    where: { userId_seedId: { userId, seedId } },
    update: {},
    create: { userId, seedId },
  });
}

export async function removeFromSeedWishlist(userId: string, seedId: string) {
  await prisma.seedWishlist.deleteMany({ where: { userId, seedId } });
}
