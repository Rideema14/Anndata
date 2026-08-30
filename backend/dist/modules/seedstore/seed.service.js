"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeeds = listSeeds;
exports.getSeedBySlug = getSeedBySlug;
exports.createSeed = createSeed;
exports.updateSeed = updateSeed;
exports.deleteSeed = deleteSeed;
exports.addSeedImages = addSeedImages;
exports.removeSeedImage = removeSeedImage;
exports.addVariant = addVariant;
exports.updateVariant = updateVariant;
exports.removeVariant = removeVariant;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
const pagination_1 = require("../../common/utils/pagination");
const SEED_INCLUDE_SUMMARY = {
    images: { orderBy: { sortOrder: 'asc' } },
    seedCategory: { select: { id: true, name: true, slug: true } },
};
function assertOwnership(seed, user) {
    if (user.role !== 'ADMIN' && seed.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to modify this seed listing.');
    }
}
function sortToOrderBy(sortBy) {
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
async function listSeeds(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { isActive: true };
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
            { variety: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.seedCategory)
        where.seedCategory = { slug: query.seedCategory };
    if (query.sowingSeason)
        where.sowingSeason = query.sowingSeason;
    if (query.sellerId)
        where.sellerId = query.sellerId;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined)
            where.price.gte = query.minPrice;
        if (query.maxPrice !== undefined)
            where.price.lte = query.maxPrice;
    }
    const [items, totalItems] = await Promise.all([
        prisma_1.default.seed.findMany({
            where,
            include: SEED_INCLUDE_SUMMARY,
            orderBy: sortToOrderBy(query.sortBy),
            skip,
            take,
        }),
        prisma_1.default.seed.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getSeedBySlug(slug, viewerId) {
    const seed = await prisma_1.default.seed.findUnique({
        where: { slug },
        include: {
            ...SEED_INCLUDE_SUMMARY,
            variants: true,
            seller: { select: { id: true, name: true, profileImage: true } },
        },
    });
    if (!seed || !seed.isActive)
        throw ApiError_1.default.notFound('Seed not found.');
    prisma_1.default.seed.update({ where: { id: seed.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    let isWishlisted = false;
    if (viewerId) {
        const wish = await prisma_1.default.seedWishlist.findUnique({
            where: { userId_seedId: { userId: viewerId, seedId: seed.id } },
        });
        isWishlisted = Boolean(wish);
    }
    return { ...seed, isWishlisted };
}
async function getSeedForOwner(id, user) {
    const seed = await prisma_1.default.seed.findUnique({ where: { id } });
    if (!seed)
        throw ApiError_1.default.notFound('Seed not found.');
    assertOwnership(seed, user);
    return seed;
}
async function createSeed(seller, data) {
    const { variants, ...seedData } = data;
    if (seedData.discountPrice && seedData.discountPrice >= seedData.price) {
        throw ApiError_1.default.badRequest('discountPrice must be lower than price.');
    }
    const category = await prisma_1.default.seedCategory.findUnique({ where: { id: seedData.seedCategoryId } });
    if (!category)
        throw ApiError_1.default.badRequest('seedCategoryId does not exist.');
    const baseSlug = (0, slugify_1.slugify)(seedData.name);
    const clash = await prisma_1.default.seed.findUnique({ where: { slug: baseSlug } });
    const slug = clash ? (0, slugify_1.slugifyUnique)(seedData.name) : baseSlug;
    return prisma_1.default.seed.create({
        data: {
            ...seedData,
            slug,
            sellerId: seller.id,
            variants: variants && variants.length > 0 ? { create: variants } : undefined,
        },
        include: SEED_INCLUDE_SUMMARY,
    });
}
async function updateSeed(id, user, data) {
    const seed = await getSeedForOwner(id, user);
    const { variants, ...seedData } = data; // variant changes go through dedicated endpoints
    const updateData = { ...seedData };
    if (seedData.name && seedData.name !== seed.name) {
        const baseSlug = (0, slugify_1.slugify)(seedData.name);
        const clash = await prisma_1.default.seed.findFirst({ where: { slug: baseSlug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(seedData.name) : baseSlug;
    }
    const nextPrice = seedData.price ?? Number(seed.price);
    const nextDiscount = seedData.discountPrice ?? (seed.discountPrice ? Number(seed.discountPrice) : undefined);
    if (nextDiscount && Number(nextDiscount) >= Number(nextPrice)) {
        throw ApiError_1.default.badRequest('discountPrice must be lower than price.');
    }
    return prisma_1.default.seed.update({ where: { id }, data: updateData, include: SEED_INCLUDE_SUMMARY });
}
async function deleteSeed(id, user) {
    const seed = await getSeedForOwner(id, user);
    const images = await prisma_1.default.seedImage.findMany({ where: { seedId: id } });
    await prisma_1.default.seed.delete({ where: { id: seed.id } });
    await Promise.all(images.filter((img) => img.publicId).map((img) => (0, cloudinary_1.deleteAsset)(img.publicId).catch(() => { })));
}
async function addSeedImages(seedId, user, files) {
    const seed = await getSeedForOwner(seedId, user);
    const existingCount = await prisma_1.default.seedImage.count({ where: { seedId } });
    const uploaded = await Promise.all(files.map((file) => (0, cloudinary_1.uploadBuffer)(file.buffer, { folder: 'agri-marketplace/seeds' })));
    const images = await prisma_1.default.$transaction(uploaded.map((img, idx) => prisma_1.default.seedImage.create({
        data: {
            seedId: seed.id,
            url: img.url,
            publicId: img.publicId,
            isPrimary: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
        },
    })));
    return images;
}
async function removeSeedImage(seedId, imageId, user) {
    await getSeedForOwner(seedId, user);
    const image = await prisma_1.default.seedImage.findFirst({ where: { id: imageId, seedId } });
    if (!image)
        throw ApiError_1.default.notFound('Image not found.');
    await prisma_1.default.seedImage.delete({ where: { id: imageId } });
    if (image.publicId)
        await (0, cloudinary_1.deleteAsset)(image.publicId).catch(() => { });
    if (image.isPrimary) {
        const next = await prisma_1.default.seedImage.findFirst({ where: { seedId }, orderBy: { sortOrder: 'asc' } });
        if (next)
            await prisma_1.default.seedImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}
async function addVariant(seedId, user, data) {
    await getSeedForOwner(seedId, user);
    return prisma_1.default.seedVariant.create({ data: { ...data, seedId } });
}
async function updateVariant(seedId, variantId, user, data) {
    await getSeedForOwner(seedId, user);
    const variant = await prisma_1.default.seedVariant.findFirst({ where: { id: variantId, seedId } });
    if (!variant)
        throw ApiError_1.default.notFound('Variant not found.');
    return prisma_1.default.seedVariant.update({ where: { id: variantId }, data });
}
async function removeVariant(seedId, variantId, user) {
    await getSeedForOwner(seedId, user);
    const variant = await prisma_1.default.seedVariant.findFirst({ where: { id: variantId, seedId } });
    if (!variant)
        throw ApiError_1.default.notFound('Variant not found.');
    await prisma_1.default.seedVariant.delete({ where: { id: variantId } });
}
//# sourceMappingURL=seed.service.js.map