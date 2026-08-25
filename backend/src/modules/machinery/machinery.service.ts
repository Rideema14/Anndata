import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { checkAvailability } from './machineryAvailability.service';
import type { User } from '@prisma/client';
import type { MachineryCreateInput, MachineryUpdateInput, MachineryQuery, DiscountTierInput } from './machinery.validation';

const MACHINERY_INCLUDE_SUMMARY = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: { select: { id: true, name: true, slug: true } },
  discountTiers: { orderBy: { minQuantity: 'asc' as const } },
} satisfies Prisma.MachineryInclude;

function assertOwnership(machinery: { sellerId: string }, user: User) {
  if (user.role !== 'ADMIN' && machinery.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to modify this machinery listing.');
  }
}

function sortToOrderBy(sortBy: MachineryQuery['sortBy']): Prisma.MachineryOrderByWithRelationInput {
  switch (sortBy) {
    case 'price_asc':
      return { pricePerDay: 'asc' };
    case 'price_desc':
      return { pricePerDay: 'desc' };
    case 'rating':
      return { avgRating: 'desc' };
    case 'popular':
      return { viewCount: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

// Cap on how many non-date-filtered candidates we'll availability-check per
// search — keeps the raw availability query bounded even on a large catalog.
// Fine for now; a catalog that regularly exceeds this needs the whole
// approach reworked into a single indexed query rather than two stages.
const AVAILABILITY_CANDIDATE_CAP = 500;

export async function listMachinery(query: MachineryQuery, requester?: User) {
  const { page, limit, skip, take } = parsePagination(query);

  // Only show inactive listings to the seller who owns them (or an admin) —
  // everyone else, including a seller browsing other sellers' machinery,
  // only ever sees active listings.
  const includeInactive = Boolean(
    query.sellerId && requester && (requester.role === 'ADMIN' || requester.id === query.sellerId)
  );
  const where: Prisma.MachineryWhereInput = includeInactive ? {} : { isActive: true };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = { slug: query.category };
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.pricePerDay = {};
    if (query.minPrice !== undefined) where.pricePerDay.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.pricePerDay.lte = query.maxPrice;
  }

  const hasDateFilter = Boolean(query.startDate && query.endDate);

  if (!hasDateFilter) {
    const [items, totalItems] = await Promise.all([
      prisma.machinery.findMany({ where, include: MACHINERY_INCLUDE_SUMMARY, orderBy: sortToOrderBy(query.sortBy), skip, take }),
      prisma.machinery.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, totalItems) };
  }

  // Date-filtered path: resolve candidates by the ordinary attributes first,
  // then filter/paginate that set by real availability via one raw query —
  // this is the piece Prisma's query builder can't express directly (a
  // correlated subquery summing overlapping bookings per row).
  const candidates = await prisma.machinery.findMany({ where, select: { id: true }, take: AVAILABILITY_CANDIDATE_CAP });
  const candidateIds = candidates.map((c) => c.id);
  if (candidateIds.length === 0) {
    return { items: [], meta: buildPaginationMeta(page, limit, 0) };
  }

  const availableRows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT m.id
      FROM machinery m
      WHERE m.id IN (${Prisma.join(candidateIds)})
        AND m."totalUnits" - COALESCE((
          SELECT SUM(mb.quantity) FROM machinery_bookings mb
          WHERE mb."machineryId" = m.id
            AND mb.status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED')
            AND mb."endDate" >= (${query.startDate}::date - (m."bufferDays"::text || ' days')::interval)
            AND mb."startDate" <= (${query.endDate}::date + (m."bufferDays"::text || ' days')::interval)
        ), 0) >= ${query.quantity}
    `
  );

  const availableIds = availableRows.map((r) => r.id);
  const totalItems = availableIds.length;
  const pageIds = availableIds.slice(skip, skip + take);

  if (pageIds.length === 0) {
    return { items: [], meta: buildPaginationMeta(page, limit, totalItems) };
  }

  // Re-fetch full records for just this page — findMany with `id: { in }`
  // doesn't preserve array order, so re-apply the requested sort here too.
  const items = await prisma.machinery.findMany({
    where: { id: { in: pageIds } },
    include: MACHINERY_INCLUDE_SUMMARY,
    orderBy: sortToOrderBy(query.sortBy),
  });

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getMachineryBySlug(slug: string) {
  const machinery = await prisma.machinery.findUnique({
    where: { slug },
    include: {
      ...MACHINERY_INCLUDE_SUMMARY,
      seller: { select: { id: true, name: true, profileImage: true } },
    },
  });
  if (!machinery || !machinery.isActive) throw ApiError.notFound('Machinery listing not found.');

  prisma.machinery.update({ where: { id: machinery.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return machinery;
}

export async function getMachineryAvailability(machineryId: string, startDate: Date, endDate: Date, quantity: number) {
  const machinery = await prisma.machinery.findUnique({ where: { id: machineryId } });
  if (!machinery || !machinery.isActive) throw ApiError.notFound('Machinery listing not found.');
  if (startDate < new Date(new Date().toDateString())) {
    throw ApiError.badRequest('You cannot book a start date that has already passed. Please choose today or a later date.');
  }

  const result = await checkAvailability(prisma, machineryId, machinery.totalUnits, machinery.bufferDays, startDate, endDate);
  return { ...result, requestedQuantity: quantity, isAvailable: result.availableQuantity >= quantity };
}

async function getMachineryForOwner(id: string, user: User) {
  const machinery = await prisma.machinery.findUnique({ where: { id } });
  if (!machinery) throw ApiError.notFound('Machinery listing not found.');
  assertOwnership(machinery, user);
  return machinery;
}

export async function createMachinery(seller: User, data: MachineryCreateInput) {
  const { discountTiers, ...machineryData } = data;

  const category = await prisma.machineryCategory.findUnique({ where: { id: machineryData.categoryId } });
  if (!category) throw ApiError.badRequest('Please choose a valid category.');

  const baseSlug = slugify(machineryData.name);
  const clash = await prisma.machinery.findUnique({ where: { slug: baseSlug } });
  const slug = clash ? slugifyUnique(machineryData.name) : baseSlug;

  return prisma.machinery.create({
    data: {
      ...machineryData,
      slug,
      sellerId: seller.id,
      discountTiers: discountTiers && discountTiers.length > 0 ? { create: discountTiers } : undefined,
    },
    include: MACHINERY_INCLUDE_SUMMARY,
  });
}

export async function updateMachinery(id: string, user: User, data: MachineryUpdateInput) {
  const machinery = await getMachineryForOwner(id, user);

  const { discountTiers, ...machineryData } = data; // discount tier changes go through dedicated endpoints
  const updateData: Prisma.MachineryUncheckedUpdateInput = { ...machineryData };

  if (machineryData.name && machineryData.name !== machinery.name) {
    const baseSlug = slugify(machineryData.name);
    const clash = await prisma.machinery.findFirst({ where: { slug: baseSlug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(machineryData.name) : baseSlug;
  }

  return prisma.machinery.update({ where: { id }, data: updateData, include: MACHINERY_INCLUDE_SUMMARY });
}

export async function deleteMachinery(id: string, user: User) {
  const machinery = await getMachineryForOwner(id, user);
  const activeBookings = await prisma.machineryBooking.count({
    where: { machineryId: id, status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
  });
  if (activeBookings > 0) {
    throw ApiError.conflict('Cannot delete a listing with active or upcoming bookings. Deactivate it instead.');
  }

  const images = await prisma.machineryImage.findMany({ where: { machineryId: id } });
  await prisma.machinery.delete({ where: { id: machinery.id } });
  await Promise.all(images.filter((img) => img.publicId).map((img) => deleteAsset(img.publicId).catch(() => {})));
}

export async function addMachineryImages(machineryId: string, user: User, files: Express.Multer.File[]) {
  const machinery = await getMachineryForOwner(machineryId, user);
  const existingCount = await prisma.machineryImage.count({ where: { machineryId } });

  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer, { folder: 'agri-marketplace/machinery' })));

  return prisma.$transaction(
    uploaded.map((img, idx) =>
      prisma.machineryImage.create({
        data: {
          machineryId: machinery.id,
          url: img.url,
          publicId: img.publicId,
          isPrimary: existingCount === 0 && idx === 0,
          sortOrder: existingCount + idx,
        },
      })
    )
  );
}

export async function removeMachineryImage(machineryId: string, imageId: string, user: User) {
  await getMachineryForOwner(machineryId, user);
  const image = await prisma.machineryImage.findFirst({ where: { id: imageId, machineryId } });
  if (!image) throw ApiError.notFound('Image not found.');

  await prisma.machineryImage.delete({ where: { id: imageId } });
  if (image.publicId) await deleteAsset(image.publicId).catch(() => {});

  if (image.isPrimary) {
    const next = await prisma.machineryImage.findFirst({ where: { machineryId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.machineryImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}

export async function addDiscountTier(machineryId: string, user: User, data: DiscountTierInput) {
  await getMachineryForOwner(machineryId, user);
  const clash = await prisma.machineryDiscountTier.findUnique({
    where: { machineryId_minQuantity: { machineryId, minQuantity: data.minQuantity } },
  });
  if (clash) throw ApiError.conflict('A discount tier for this quantity already exists.');
  return prisma.machineryDiscountTier.create({ data: { ...data, machineryId } });
}

export async function updateDiscountTier(machineryId: string, tierId: string, user: User, data: Partial<DiscountTierInput>) {
  await getMachineryForOwner(machineryId, user);
  const tier = await prisma.machineryDiscountTier.findFirst({ where: { id: tierId, machineryId } });
  if (!tier) throw ApiError.notFound('Discount tier not found.');
  return prisma.machineryDiscountTier.update({ where: { id: tierId }, data });
}

export async function removeDiscountTier(machineryId: string, tierId: string, user: User) {
  await getMachineryForOwner(machineryId, user);
  const tier = await prisma.machineryDiscountTier.findFirst({ where: { id: tierId, machineryId } });
  if (!tier) throw ApiError.notFound('Discount tier not found.');
  await prisma.machineryDiscountTier.delete({ where: { id: tierId } });
}
