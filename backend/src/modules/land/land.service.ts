import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { LandCreateInput, LandUpdateInput, LandQuery, MyListingsQuery } from './land.validation';

const LAND_INCLUDE_SUMMARY = {
  images: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.LandInclude;

function assertOwnership(land: { sellerId: string }, user: User) {
  if (user.role !== 'ADMIN' && land.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to modify this land listing.');
  }
}

function sortToOrderBy(sortBy: LandQuery['sortBy']): Prisma.LandOrderByWithRelationInput {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'area_asc':
      return { areaAcres: 'asc' };
    case 'area_desc':
      return { areaAcres: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export async function listLand(query: LandQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.LandWhereInput = { isActive: true };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.dealType) where.dealType = query.dealType;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
  if (query.state) where.state = { equals: query.state, mode: 'insensitive' };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
  }
  if (query.minArea !== undefined || query.maxArea !== undefined) {
    where.areaAcres = {};
    if (query.minArea !== undefined) where.areaAcres.gte = query.minArea;
    if (query.maxArea !== undefined) where.areaAcres.lte = query.maxArea;
  }

  const [items, totalItems] = await Promise.all([
    prisma.land.findMany({ where, include: LAND_INCLUDE_SUMMARY, orderBy: sortToOrderBy(query.sortBy), skip, take }),
    prisma.land.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getLandBySlug(slug: string) {
  const land = await prisma.land.findUnique({
    where: { slug },
    include: {
      ...LAND_INCLUDE_SUMMARY,
      seller: { select: { id: true, name: true, profileImage: true, phone: true } },
    },
  });
  if (!land || !land.isActive) throw ApiError.notFound('Land listing not found.');

  prisma.land.update({ where: { id: land.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return land;
}

async function getLandForOwner(id: string, user: User) {
  const land = await prisma.land.findUnique({ where: { id } });
  if (!land) throw ApiError.notFound('Land listing not found.');
  assertOwnership(land, user);
  return land;
}

export async function myListings(seller: User, query: MyListingsQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.LandWhereInput = { sellerId: seller.id };
  const [items, totalItems] = await Promise.all([
    prisma.land.findMany({ where, include: LAND_INCLUDE_SUMMARY, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.land.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function createLand(seller: User, data: LandCreateInput) {
  const baseSlug = slugify(data.title);
  const clash = await prisma.land.findUnique({ where: { slug: baseSlug } });
  const slug = clash ? slugifyUnique(data.title) : baseSlug;

  return prisma.land.create({
    data: { ...data, slug, sellerId: seller.id },
    include: LAND_INCLUDE_SUMMARY,
  });
}

export async function updateLand(id: string, user: User, data: LandUpdateInput) {
  const land = await getLandForOwner(id, user);

  const updateData: Prisma.LandUncheckedUpdateInput = { ...data };
  if (data.title && data.title !== land.title) {
    const baseSlug = slugify(data.title);
    const clash = await prisma.land.findFirst({ where: { slug: baseSlug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.title) : baseSlug;
  }

  return prisma.land.update({ where: { id }, data: updateData, include: LAND_INCLUDE_SUMMARY });
}

export async function deleteLand(id: string, user: User) {
  const land = await getLandForOwner(id, user);
  const activeVisits = await prisma.landVisitRequest.count({
    where: { landId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
  });
  if (activeVisits > 0) {
    throw ApiError.conflict('Cannot delete a listing with pending or accepted visit requests. Deactivate it instead.');
  }

  const images = await prisma.landImage.findMany({ where: { landId: id } });
  await prisma.land.delete({ where: { id: land.id } });
  await Promise.all(images.filter((img) => img.publicId).map((img) => deleteAsset(img.publicId).catch(() => {})));
}

export async function addLandImages(landId: string, user: User, files: Express.Multer.File[]) {
  const land = await getLandForOwner(landId, user);
  const existingCount = await prisma.landImage.count({ where: { landId } });

  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer, { folder: 'agri-marketplace/land' })));

  return prisma.$transaction(
    uploaded.map((img, idx) =>
      prisma.landImage.create({
        data: {
          landId: land.id,
          url: img.url,
          publicId: img.publicId,
          isPrimary: existingCount === 0 && idx === 0,
          sortOrder: existingCount + idx,
        },
      })
    )
  );
}

export async function removeLandImage(landId: string, imageId: string, user: User) {
  await getLandForOwner(landId, user);
  const image = await prisma.landImage.findFirst({ where: { id: imageId, landId } });
  if (!image) throw ApiError.notFound('Image not found.');

  await prisma.landImage.delete({ where: { id: imageId } });
  if (image.publicId) await deleteAsset(image.publicId).catch(() => {});

  if (image.isPrimary) {
    const next = await prisma.landImage.findFirst({ where: { landId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.landImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}
