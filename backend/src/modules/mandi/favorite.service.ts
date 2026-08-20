import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';

export async function listFavorites(userId: string) {
  return prisma.favoriteMandi.findMany({
    where: { userId },
    include: { mandi: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addFavorite(userId: string, mandiId: string) {
  const mandi = await prisma.mandi.findUnique({ where: { id: mandiId } });
  if (!mandi || !mandi.isActive) throw ApiError.notFound('Mandi not found.');

  return prisma.favoriteMandi.upsert({
    where: { userId_mandiId: { userId, mandiId } },
    update: {},
    create: { userId, mandiId },
  });
}

export async function removeFavorite(userId: string, mandiId: string) {
  await prisma.favoriteMandi.deleteMany({ where: { userId, mandiId } });
}
