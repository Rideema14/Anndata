const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../common/utils/pagination');

async function listWishlist(userId, query) {
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

async function addToWishlist(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found.');

  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

async function removeFromWishlist(userId, productId) {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}

module.exports = { listWishlist, addToWishlist, removeFromWishlist };
