"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.nearbyProducts = nearbyProducts;
exports.topDeals = topDeals;
exports.getProductBySlug = getProductBySlug;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.addProductImages = addProductImages;
exports.removeProductImage = removeProductImage;
exports.addVariant = addVariant;
exports.updateVariant = updateVariant;
exports.removeVariant = removeVariant;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
const pagination_1 = require("../../common/utils/pagination");
const PRODUCT_INCLUDE_SUMMARY = {
    images: { orderBy: { sortOrder: 'asc' } },
    category: { select: { id: true, name: true, slug: true } },
    subCategory: { select: { id: true, name: true, slug: true } },
};
function assertOwnership(product, user) {
    if (user.role !== 'ADMIN' && product.sellerId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to modify this product.');
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
async function listProducts(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { isActive: true };
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.category)
        where.category = { slug: query.category };
    if (query.subCategory)
        where.subCategory = { slug: query.subCategory };
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
        prisma_1.default.product.findMany({
            where,
            include: PRODUCT_INCLUDE_SUMMARY,
            orderBy: sortToOrderBy(query.sortBy),
            skip,
            take,
        }),
        prisma_1.default.product.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
/** Haversine-distance "nearby products" query, using a derived table so we can
 * filter/order on the computed distance alias (Postgres disallows referencing
 * a SELECT-list alias directly in WHERE). */
async function nearbyProducts({ lat, lng, radiusKm, limit }) {
    return prisma_1.default.$queryRaw `
    SELECT * FROM (
      SELECT
        id, name, slug, price, "discountPrice", stock, unit, "avgRating", "reviewCount",
        latitude, longitude,
        (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(${lat}::float)) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng}::float))
            + sin(radians(${lat}::float)) * sin(radians(latitude))
          ))
        )) AS "distanceKm"
      FROM products
      WHERE "isActive" = true AND latitude IS NOT NULL AND longitude IS NOT NULL
    ) sub
    WHERE "distanceKm" <= ${radiusKm}::float
    ORDER BY "distanceKm" ASC
    LIMIT ${limit}
  `;
}
async function topDeals({ limit }) {
    return prisma_1.default.$queryRaw `
    SELECT
      id, name, slug, price, "discountPrice", stock, unit, "avgRating", "reviewCount",
      ROUND((("price" - "discountPrice") / "price" * 100)::numeric, 2) AS "discountPercent"
    FROM products
    WHERE "isActive" = true AND "discountPrice" IS NOT NULL AND "discountPrice" < "price"
    ORDER BY "discountPercent" DESC
    LIMIT ${limit}
  `;
}
async function getProductBySlug(slug, viewerId) {
    const product = await prisma_1.default.product.findUnique({
        where: { slug },
        include: {
            ...PRODUCT_INCLUDE_SUMMARY,
            variants: true,
            seller: { select: { id: true, name: true, profileImage: true } },
        },
    });
    if (!product || !product.isActive)
        throw ApiError_1.default.notFound('Product not found.');
    // Fire-and-forget view count bump — not worth blocking the response for.
    prisma_1.default.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    let isWishlisted = false;
    if (viewerId) {
        const wish = await prisma_1.default.wishlist.findUnique({
            where: { userId_productId: { userId: viewerId, productId: product.id } },
        });
        isWishlisted = Boolean(wish);
    }
    return { ...product, isWishlisted };
}
async function getProductForOwner(id, user) {
    const product = await prisma_1.default.product.findUnique({ where: { id } });
    if (!product)
        throw ApiError_1.default.notFound('Product not found.');
    assertOwnership(product, user);
    return product;
}
async function createProduct(seller, data) {
    const { variants, ...productData } = data;
    if (productData.discountPrice && productData.discountPrice >= productData.price) {
        throw ApiError_1.default.badRequest('discountPrice must be lower than price.');
    }
    if (productData.subCategoryId) {
        const subCategory = await prisma_1.default.subCategory.findUnique({ where: { id: productData.subCategoryId } });
        if (!subCategory || subCategory.categoryId !== productData.categoryId) {
            throw ApiError_1.default.badRequest('subCategoryId does not belong to the given categoryId.');
        }
    }
    const category = await prisma_1.default.category.findUnique({ where: { id: productData.categoryId } });
    if (!category)
        throw ApiError_1.default.badRequest('categoryId does not exist.');
    const baseSlug = (0, slugify_1.slugify)(productData.name);
    const clash = await prisma_1.default.product.findUnique({ where: { slug: baseSlug } });
    const slug = clash ? (0, slugify_1.slugifyUnique)(productData.name) : baseSlug;
    return prisma_1.default.product.create({
        data: {
            ...productData,
            slug,
            sellerId: seller.id,
            variants: variants && variants.length > 0 ? { create: variants } : undefined,
        },
        include: PRODUCT_INCLUDE_SUMMARY,
    });
}
async function updateProduct(id, user, data) {
    const product = await getProductForOwner(id, user);
    const { variants, ...productData } = data; // variant changes go through dedicated endpoints
    // Unchecked variant, not the relation-style ProductUpdateInput — our data
    // carries scalar FK fields (categoryId, subCategoryId) directly, matching
    // how the Zod schema (and createProduct below) shape this data.
    const updateData = { ...productData };
    if (productData.name && productData.name !== product.name) {
        const baseSlug = (0, slugify_1.slugify)(productData.name);
        const clash = await prisma_1.default.product.findFirst({ where: { slug: baseSlug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(productData.name) : baseSlug;
    }
    const nextPrice = productData.price ?? Number(product.price);
    const nextDiscount = productData.discountPrice ?? (product.discountPrice ? Number(product.discountPrice) : undefined);
    if (nextDiscount && Number(nextDiscount) >= Number(nextPrice)) {
        throw ApiError_1.default.badRequest('discountPrice must be lower than price.');
    }
    return prisma_1.default.product.update({ where: { id }, data: updateData, include: PRODUCT_INCLUDE_SUMMARY });
}
async function deleteProduct(id, user) {
    const product = await getProductForOwner(id, user);
    const images = await prisma_1.default.productImage.findMany({ where: { productId: id } });
    await prisma_1.default.product.delete({ where: { id: product.id } });
    await Promise.all(images.filter((img) => img.publicId).map((img) => (0, cloudinary_1.deleteAsset)(img.publicId).catch(() => { })));
}
async function addProductImages(productId, user, files) {
    const product = await getProductForOwner(productId, user);
    const existingCount = await prisma_1.default.productImage.count({ where: { productId } });
    const uploaded = await Promise.all(files.map((file) => (0, cloudinary_1.uploadBuffer)(file.buffer, { folder: 'agri-marketplace/products' })));
    const images = await prisma_1.default.$transaction(uploaded.map((img, idx) => prisma_1.default.productImage.create({
        data: {
            productId: product.id,
            url: img.url,
            publicId: img.publicId,
            isPrimary: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
        },
    })));
    return images;
}
async function removeProductImage(productId, imageId, user) {
    await getProductForOwner(productId, user);
    const image = await prisma_1.default.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image)
        throw ApiError_1.default.notFound('Image not found.');
    await prisma_1.default.productImage.delete({ where: { id: imageId } });
    if (image.publicId)
        await (0, cloudinary_1.deleteAsset)(image.publicId).catch(() => { });
    if (image.isPrimary) {
        const next = await prisma_1.default.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: 'asc' } });
        if (next)
            await prisma_1.default.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}
async function addVariant(productId, user, data) {
    await getProductForOwner(productId, user);
    return prisma_1.default.productVariant.create({ data: { ...data, productId } });
}
async function updateVariant(productId, variantId, user, data) {
    await getProductForOwner(productId, user);
    const variant = await prisma_1.default.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant)
        throw ApiError_1.default.notFound('Variant not found.');
    return prisma_1.default.productVariant.update({ where: { id: variantId }, data });
}
async function removeVariant(productId, variantId, user) {
    await getProductForOwner(productId, user);
    const variant = await prisma_1.default.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant)
        throw ApiError_1.default.notFound('Variant not found.');
    await prisma_1.default.productVariant.delete({ where: { id: variantId } });
}
//# sourceMappingURL=product.service.js.map