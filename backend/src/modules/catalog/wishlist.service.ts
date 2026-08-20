import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { PaginationQuery } from '../../common/utils/pagination';

export async function listWishlist(userId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const [items, totalItems] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId },
      include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found.');

  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}
