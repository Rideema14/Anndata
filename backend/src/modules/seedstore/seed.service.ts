import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { User } from '@prisma/client';
import type { SeedCreateInput, SeedUpdateInput, SeedQuery, SeedVariantInput } from './seed.validation';

const SEED_INCLUDE_SUMMARY = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  seedCategory: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.SeedInclude;

function assertOwnership(seed: { sellerId: string }, user: User) {
  if (user.role !== 'ADMIN' && seed.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to modify this seed listing.');
  }
}

function sortToOrderBy(sortBy: SeedQuery['sortBy']): Prisma.SeedOrderByWithRelationInput {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'rating':
      return { avgRating: 'desc' };
    case 'popular':
      return { viewCount: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export async function listSeeds(query: SeedQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.SeedWhereInput = { isActive: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
      { variety: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.seedCategory) where.seedCategory = { slug: query.seedCategory };
  if (query.sowingSeason) where.sowingSeason = query.sowingSeason;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
  }

  const [items, totalItems] = await Promise.all([
    prisma.seed.findMany({
      where,
      include: SEED_INCLUDE_SUMMARY,
      orderBy: sortToOrderBy(query.sortBy),
      skip,
      take,
    }),
    prisma.seed.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getSeedBySlug(slug: string, viewerId?: string) {
  const seed = await prisma.seed.findUnique({
    where: { slug },
    include: {
      ...SEED_INCLUDE_SUMMARY,
      variants: true,
      seller: { select: { id: true, name: true, profileImage: true } },
    },
  });
  if (!seed || !seed.isActive) throw ApiError.notFound('Seed not found.');

  prisma.seed.update({ where: { id: seed.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  let isWishlisted = false;
  if (viewerId) {
    const wish = await prisma.seedWishlist.findUnique({
      where: { userId_seedId: { userId: viewerId, seedId: seed.id } },
    });
    isWishlisted = Boolean(wish);
  }

  return { ...seed, isWishlisted };
}

async function getSeedForOwner(id: string, user: User) {
  const seed = await prisma.seed.findUnique({ where: { id } });
  if (!seed) throw ApiError.notFound('Seed not found.');
  assertOwnership(seed, user);
  return seed;
}

export async function createSeed(seller: User, data: SeedCreateInput) {
  const { variants, ...seedData } = data;

  if (seedData.discountPrice && seedData.discountPrice >= seedData.price) {
    throw ApiError.badRequest('discountPrice must be lower than price.');
  }

  const category = await prisma.seedCategory.findUnique({ where: { id: seedData.seedCategoryId } });
  if (!category) throw ApiError.badRequest('seedCategoryId does not exist.');

  const baseSlug = slugify(seedData.name);
  const clash = await prisma.seed.findUnique({ where: { slug: baseSlug } });
  const slug = clash ? slugifyUnique(seedData.name) : baseSlug;

  return prisma.seed.create({
    data: {
      ...seedData,
      slug,
      sellerId: seller.id,
      variants: variants && variants.length > 0 ? { create: variants } : undefined,
    },
    include: SEED_INCLUDE_SUMMARY,
  });
}

export async function updateSeed(id: string, user: User, data: SeedUpdateInput) {
  const seed = await getSeedForOwner(id, user);

  const { variants, ...seedData } = data; // variant changes go through dedicated endpoints
  const updateData: Prisma.SeedUncheckedUpdateInput = { ...seedData };

  if (seedData.name && seedData.name !== seed.name) {
    const baseSlug = slugify(seedData.name);
    const clash = await prisma.seed.findFirst({ where: { slug: baseSlug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(seedData.name) : baseSlug;
  }

  const nextPrice = seedData.price ?? Number(seed.price);
  const nextDiscount = seedData.discountPrice ?? (seed.discountPrice ? Number(seed.discountPrice) : undefined);
  if (nextDiscount && Number(nextDiscount) >= Number(nextPrice)) {
    throw ApiError.badRequest('discountPrice must be lower than price.');
  }

  return prisma.seed.update({ where: { id }, data: updateData, include: SEED_INCLUDE_SUMMARY });
}

export async function deleteSeed(id: string, user: User) {
  const seed = await getSeedForOwner(id, user);
  const images = await prisma.seedImage.findMany({ where: { seedId: id } });

  await prisma.seed.delete({ where: { id: seed.id } });

  await Promise.all(images.filter((img) => img.publicId).map((img) => deleteAsset(img.publicId).catch(() => {})));
}

export async function addSeedImages(seedId: string, user: User, files: Express.Multer.File[]) {
  const seed = await getSeedForOwner(seedId, user);
  const existingCount = await prisma.seedImage.count({ where: { seedId } });

  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer, { folder: 'agri-marketplace/seeds' })));

  const images = await prisma.$transaction(
    uploaded.map((img, idx) =>
      prisma.seedImage.create({
        data: {
          seedId: seed.id,
          url: img.url,
          publicId: img.publicId,
          isPrimary: existingCount === 0 && idx === 0,
          sortOrder: existingCount + idx,
        },
      })
    )
  );

  return images;
}

export async function removeSeedImage(seedId: string, imageId: string, user: User) {
  await getSeedForOwner(seedId, user);
  const image = await prisma.seedImage.findFirst({ where: { id: imageId, seedId } });
  if (!image) throw ApiError.notFound('Image not found.');

  await prisma.seedImage.delete({ where: { id: imageId } });
  if (image.publicId) await deleteAsset(image.publicId).catch(() => {});

  if (image.isPrimary) {
    const next = await prisma.seedImage.findFirst({ where: { seedId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.seedImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}

export async function addVariant(seedId: string, user: User, data: SeedVariantInput) {
  await getSeedForOwner(seedId, user);
  return prisma.seedVariant.create({ data: { ...data, seedId } });
}

export async function updateVariant(seedId: string, variantId: string, user: User, data: Partial<SeedVariantInput>) {
  await getSeedForOwner(seedId, user);
  const variant = await prisma.seedVariant.findFirst({ where: { id: variantId, seedId } });
  if (!variant) throw ApiError.notFound('Variant not found.');
  return prisma.seedVariant.update({ where: { id: variantId }, data });
}

export async function removeVariant(seedId: string, variantId: string, user: User) {
  await getSeedForOwner(seedId, user);
  const variant = await prisma.seedVariant.findFirst({ where: { id: variantId, seedId } });
  if (!variant) throw ApiError.notFound('Variant not found.');
  await prisma.seedVariant.delete({ where: { id: variantId } });
}
