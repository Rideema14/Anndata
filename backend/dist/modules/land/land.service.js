"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLand = listLand;
exports.getLandBySlug = getLandBySlug;
exports.myListings = myListings;
exports.createLand = createLand;
exports.updateLand = updateLand;
exports.deleteLand = deleteLand;
exports.addLandImages = addLandImages;
exports.removeLandImage = removeLandImage;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
const pagination_1 = require("../../common/utils/pagination");
const LAND_INCLUDE_SUMMARY = {
    images: { orderBy: { sortOrder: 'asc' } },
};
function assertOwnership(land, user) {
    if (user.role !== 'ADMIN' && land.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to modify this land listing.');
    }
}
function sortToOrderBy(sortBy) {
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
async function listLand(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { isActive: true };
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.dealType)
        where.dealType = query.dealType;
    if (query.sellerId)
        where.sellerId = query.sellerId;
    if (query.city)
        where.city = { equals: query.city, mode: 'insensitive' };
    if (query.state)
        where.state = { equals: query.state, mode: 'insensitive' };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined)
            where.price.gte = query.minPrice;
        if (query.maxPrice !== undefined)
            where.price.lte = query.maxPrice;
    }
    if (query.minArea !== undefined || query.maxArea !== undefined) {
        where.areaAcres = {};
        if (query.minArea !== undefined)
            where.areaAcres.gte = query.minArea;
        if (query.maxArea !== undefined)
            where.areaAcres.lte = query.maxArea;
    }
    const [items, totalItems] = await Promise.all([
        prisma_1.default.land.findMany({ where, include: LAND_INCLUDE_SUMMARY, orderBy: sortToOrderBy(query.sortBy), skip, take }),
        prisma_1.default.land.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getLandBySlug(slug) {
    const land = await prisma_1.default.land.findUnique({
        where: { slug },
        include: {
            ...LAND_INCLUDE_SUMMARY,
            seller: { select: { id: true, name: true, profileImage: true, phone: true } },
        },
    });
    if (!land || !land.isActive)
        throw ApiError_1.default.notFound('Land listing not found.');
    prisma_1.default.land.update({ where: { id: land.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    return land;
}
async function getLandForOwner(id, user) {
    const land = await prisma_1.default.land.findUnique({ where: { id } });
    if (!land)
        throw ApiError_1.default.notFound('Land listing not found.');
    assertOwnership(land, user);
    return land;
}
async function myListings(seller, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { sellerId: seller.id };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.land.findMany({ where, include: LAND_INCLUDE_SUMMARY, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.land.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function createLand(seller, data) {
    const baseSlug = (0, slugify_1.slugify)(data.title);
    const clash = await prisma_1.default.land.findUnique({ where: { slug: baseSlug } });
    const slug = clash ? (0, slugify_1.slugifyUnique)(data.title) : baseSlug;
    return prisma_1.default.land.create({
        data: { ...data, slug, sellerId: seller.id },
        include: LAND_INCLUDE_SUMMARY,
    });
}
async function updateLand(id, user, data) {
    const land = await getLandForOwner(id, user);
    const updateData = { ...data };
    if (data.title && data.title !== land.title) {
        const baseSlug = (0, slugify_1.slugify)(data.title);
        const clash = await prisma_1.default.land.findFirst({ where: { slug: baseSlug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(data.title) : baseSlug;
    }
    return prisma_1.default.land.update({ where: { id }, data: updateData, include: LAND_INCLUDE_SUMMARY });
}
async function deleteLand(id, user) {
    const land = await getLandForOwner(id, user);
    const activeVisits = await prisma_1.default.landVisitRequest.count({
        where: { landId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
    });
    if (activeVisits > 0) {
        throw ApiError_1.default.conflict('Cannot delete a listing with pending or accepted visit requests. Deactivate it instead.');
    }
    const images = await prisma_1.default.landImage.findMany({ where: { landId: id } });
    await prisma_1.default.land.delete({ where: { id: land.id } });
    await Promise.all(images.filter((img) => img.publicId).map((img) => (0, cloudinary_1.deleteAsset)(img.publicId).catch(() => { })));
}
async function addLandImages(landId, user, files) {
    const land = await getLandForOwner(landId, user);
    const existingCount = await prisma_1.default.landImage.count({ where: { landId } });
    const uploaded = await Promise.all(files.map((file) => (0, cloudinary_1.uploadBuffer)(file.buffer, { folder: 'agri-marketplace/land' })));
    return prisma_1.default.$transaction(uploaded.map((img, idx) => prisma_1.default.landImage.create({
        data: {
            landId: land.id,
            url: img.url,
            publicId: img.publicId,
            isPrimary: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
        },
    })));
}
async function removeLandImage(landId, imageId, user) {
    await getLandForOwner(landId, user);
    const image = await prisma_1.default.landImage.findFirst({ where: { id: imageId, landId } });
    if (!image)
        throw ApiError_1.default.notFound('Image not found.');
    await prisma_1.default.landImage.delete({ where: { id: imageId } });
    if (image.publicId)
        await (0, cloudinary_1.deleteAsset)(image.publicId).catch(() => { });
    if (image.isPrimary) {
        const next = await prisma_1.default.landImage.findFirst({ where: { landId }, orderBy: { sortOrder: 'asc' } });
        if (next)
            await prisma_1.default.landImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}
//# sourceMappingURL=land.service.js.map