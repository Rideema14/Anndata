"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMachinery = listMachinery;
exports.getMachineryBySlug = getMachineryBySlug;
exports.getMachineryAvailability = getMachineryAvailability;
exports.createMachinery = createMachinery;
exports.updateMachinery = updateMachinery;
exports.deleteMachinery = deleteMachinery;
exports.addMachineryImages = addMachineryImages;
exports.removeMachineryImage = removeMachineryImage;
exports.addDiscountTier = addDiscountTier;
exports.updateDiscountTier = updateDiscountTier;
exports.removeDiscountTier = removeDiscountTier;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
const pagination_1 = require("../../common/utils/pagination");
const machineryAvailability_service_1 = require("./machineryAvailability.service");
const MACHINERY_INCLUDE_SUMMARY = {
    images: { orderBy: { sortOrder: 'asc' } },
    category: { select: { id: true, name: true, slug: true } },
    discountTiers: { orderBy: { minQuantity: 'asc' } },
};
function assertOwnership(machinery, user) {
    if (user.role !== 'ADMIN' && machinery.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to modify this machinery listing.');
    }
}
function sortToOrderBy(sortBy) {
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
async function listMachinery(query, requester) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    // Only show inactive listings to the seller who owns them (or an admin) —
    // everyone else, including a seller browsing other sellers' machinery,
    // only ever sees active listings.
    const includeInactive = Boolean(query.sellerId && requester && (requester.role === 'ADMIN' || requester.id === query.sellerId));
    const where = includeInactive ? {} : { isActive: true };
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.category)
        where.category = { slug: query.category };
    if (query.sellerId)
        where.sellerId = query.sellerId;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.pricePerDay = {};
        if (query.minPrice !== undefined)
            where.pricePerDay.gte = query.minPrice;
        if (query.maxPrice !== undefined)
            where.pricePerDay.lte = query.maxPrice;
    }
    const hasDateFilter = Boolean(query.startDate && query.endDate);
    if (!hasDateFilter) {
        const [items, totalItems] = await Promise.all([
            prisma_1.default.machinery.findMany({ where, include: MACHINERY_INCLUDE_SUMMARY, orderBy: sortToOrderBy(query.sortBy), skip, take }),
            prisma_1.default.machinery.count({ where }),
        ]);
        return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
    }
    // Date-filtered path: resolve candidates by the ordinary attributes first,
    // then filter/paginate that set by real availability via one raw query —
    // this is the piece Prisma's query builder can't express directly (a
    // correlated subquery summing overlapping bookings per row).
    const candidates = await prisma_1.default.machinery.findMany({ where, select: { id: true }, take: AVAILABILITY_CANDIDATE_CAP });
    const candidateIds = candidates.map((c) => c.id);
    if (candidateIds.length === 0) {
        return { items: [], meta: (0, pagination_1.buildPaginationMeta)(page, limit, 0) };
    }
    const availableRows = await prisma_1.default.$queryRaw(client_1.Prisma.sql `
      SELECT m.id
      FROM machinery m
      WHERE m.id IN (${client_1.Prisma.join(candidateIds)})
        AND m."totalUnits" - COALESCE((
          SELECT SUM(mb.quantity) FROM machinery_bookings mb
          WHERE mb."machineryId" = m.id
            AND mb.status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED')
            AND mb."endDate" >= (${query.startDate}::date - (m."bufferDays"::text || ' days')::interval)
            AND mb."startDate" <= (${query.endDate}::date + (m."bufferDays"::text || ' days')::interval)
        ), 0) >= ${query.quantity}
    `);
    const availableIds = availableRows.map((r) => r.id);
    const totalItems = availableIds.length;
    const pageIds = availableIds.slice(skip, skip + take);
    if (pageIds.length === 0) {
        return { items: [], meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
    }
    // Re-fetch full records for just this page — findMany with `id: { in }`
    // doesn't preserve array order, so re-apply the requested sort here too.
    const items = await prisma_1.default.machinery.findMany({
        where: { id: { in: pageIds } },
        include: MACHINERY_INCLUDE_SUMMARY,
        orderBy: sortToOrderBy(query.sortBy),
    });
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getMachineryBySlug(slug) {
    const machinery = await prisma_1.default.machinery.findUnique({
        where: { slug },
        include: {
            ...MACHINERY_INCLUDE_SUMMARY,
            seller: { select: { id: true, name: true, profileImage: true } },
        },
    });
    if (!machinery || !machinery.isActive)
        throw ApiError_1.default.notFound('Machinery listing not found.');
    prisma_1.default.machinery.update({ where: { id: machinery.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    return machinery;
}
async function getMachineryAvailability(machineryId, startDate, endDate, quantity) {
    const machinery = await prisma_1.default.machinery.findUnique({ where: { id: machineryId } });
    if (!machinery || !machinery.isActive)
        throw ApiError_1.default.notFound('Machinery listing not found.');
    if (startDate < new Date(new Date().toDateString())) {
        throw ApiError_1.default.badRequest('You cannot book a start date that has already passed. Please choose today or a later date.');
    }
    const result = await (0, machineryAvailability_service_1.checkAvailability)(prisma_1.default, machineryId, machinery.totalUnits, machinery.bufferDays, startDate, endDate);
    return { ...result, requestedQuantity: quantity, isAvailable: result.availableQuantity >= quantity };
}
async function getMachineryForOwner(id, user) {
    const machinery = await prisma_1.default.machinery.findUnique({ where: { id } });
    if (!machinery)
        throw ApiError_1.default.notFound('Machinery listing not found.');
    assertOwnership(machinery, user);
    return machinery;
}
async function createMachinery(seller, data) {
    const { discountTiers, ...machineryData } = data;
    const category = await prisma_1.default.machineryCategory.findUnique({ where: { id: machineryData.categoryId } });
    if (!category)
        throw ApiError_1.default.badRequest('Please choose a valid category.');
    const baseSlug = (0, slugify_1.slugify)(machineryData.name);
    const clash = await prisma_1.default.machinery.findUnique({ where: { slug: baseSlug } });
    const slug = clash ? (0, slugify_1.slugifyUnique)(machineryData.name) : baseSlug;
    return prisma_1.default.machinery.create({
        data: {
            ...machineryData,
            slug,
            sellerId: seller.id,
            discountTiers: discountTiers && discountTiers.length > 0 ? { create: discountTiers } : undefined,
        },
        include: MACHINERY_INCLUDE_SUMMARY,
    });
}
async function updateMachinery(id, user, data) {
    const machinery = await getMachineryForOwner(id, user);
    const { discountTiers, ...machineryData } = data; // discount tier changes go through dedicated endpoints
    const updateData = { ...machineryData };
    if (machineryData.name && machineryData.name !== machinery.name) {
        const baseSlug = (0, slugify_1.slugify)(machineryData.name);
        const clash = await prisma_1.default.machinery.findFirst({ where: { slug: baseSlug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(machineryData.name) : baseSlug;
    }
    return prisma_1.default.machinery.update({ where: { id }, data: updateData, include: MACHINERY_INCLUDE_SUMMARY });
}
async function deleteMachinery(id, user) {
    const machinery = await getMachineryForOwner(id, user);
    const activeBookings = await prisma_1.default.machineryBooking.count({
        where: { machineryId: id, status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
    });
    if (activeBookings > 0) {
        throw ApiError_1.default.conflict('Cannot delete a listing with active or upcoming bookings. Deactivate it instead.');
    }
    const images = await prisma_1.default.machineryImage.findMany({ where: { machineryId: id } });
    await prisma_1.default.machinery.delete({ where: { id: machinery.id } });
    await Promise.all(images.filter((img) => img.publicId).map((img) => (0, cloudinary_1.deleteAsset)(img.publicId).catch(() => { })));
}
async function addMachineryImages(machineryId, user, files) {
    const machinery = await getMachineryForOwner(machineryId, user);
    const existingCount = await prisma_1.default.machineryImage.count({ where: { machineryId } });
    const uploaded = await Promise.all(files.map((file) => (0, cloudinary_1.uploadBuffer)(file.buffer, { folder: 'agri-marketplace/machinery' })));
    return prisma_1.default.$transaction(uploaded.map((img, idx) => prisma_1.default.machineryImage.create({
        data: {
            machineryId: machinery.id,
            url: img.url,
            publicId: img.publicId,
            isPrimary: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
        },
    })));
}
async function removeMachineryImage(machineryId, imageId, user) {
    await getMachineryForOwner(machineryId, user);
    const image = await prisma_1.default.machineryImage.findFirst({ where: { id: imageId, machineryId } });
    if (!image)
        throw ApiError_1.default.notFound('Image not found.');
    await prisma_1.default.machineryImage.delete({ where: { id: imageId } });
    if (image.publicId)
        await (0, cloudinary_1.deleteAsset)(image.publicId).catch(() => { });
    if (image.isPrimary) {
        const next = await prisma_1.default.machineryImage.findFirst({ where: { machineryId }, orderBy: { sortOrder: 'asc' } });
        if (next)
            await prisma_1.default.machineryImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}
async function addDiscountTier(machineryId, user, data) {
    await getMachineryForOwner(machineryId, user);
    const clash = await prisma_1.default.machineryDiscountTier.findUnique({
        where: { machineryId_minQuantity: { machineryId, minQuantity: data.minQuantity } },
    });
    if (clash)
        throw ApiError_1.default.conflict('A discount tier for this quantity already exists.');
    return prisma_1.default.machineryDiscountTier.create({ data: { ...data, machineryId } });
}
async function updateDiscountTier(machineryId, tierId, user, data) {
    await getMachineryForOwner(machineryId, user);
    const tier = await prisma_1.default.machineryDiscountTier.findFirst({ where: { id: tierId, machineryId } });
    if (!tier)
        throw ApiError_1.default.notFound('Discount tier not found.');
    return prisma_1.default.machineryDiscountTier.update({ where: { id: tierId }, data });
}
async function removeDiscountTier(machineryId, tierId, user) {
    await getMachineryForOwner(machineryId, user);
    const tier = await prisma_1.default.machineryDiscountTier.findFirst({ where: { id: tierId, machineryId } });
    if (!tier)
        throw ApiError_1.default.notFound('Discount tier not found.');
    await prisma_1.default.machineryDiscountTier.delete({ where: { id: tierId } });
}
//# sourceMappingURL=machinery.service.js.map