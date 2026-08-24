import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { User } from '@prisma/client';
import type { ProductCreateInput, ProductUpdateInput, ProductQuery, VariantInput } from './catalog.validation';

const PRODUCT_INCLUDE_SUMMARY = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: { select: { id: true, name: true, slug: true } },
  subCategory: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

function assertOwnership(product: { sellerId: string }, user: User) {
  if (user.role !== 'ADMIN' && product.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to modify this product.');
  }
}

function sortToOrderBy(sortBy: ProductQuery['sortBy']): Prisma.ProductOrderByWithRelationInput {
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

export async function listProducts(query: ProductQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = { slug: query.category };
  if (query.subCategory) where.subCategory = { slug: query.subCategory };
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
  }

  const [items, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE_SUMMARY,
      orderBy: sortToOrderBy(query.sortBy),
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

interface NearbyProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  unit: string;
  avgRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

/** Haversine-distance "nearby products" query, using a derived table so we can
 * filter/order on the computed distance alias (Postgres disallows referencing
 * a SELECT-list alias directly in WHERE). */
export async function nearbyProducts({ lat, lng, radiusKm, limit }: { lat: number; lng: number; radiusKm: number; limit: number }) {
  return prisma.$queryRaw<NearbyProductRow[]>`
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

interface TopDealRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number;
  stock: number;
  unit: string;
  avgRating: number;
  reviewCount: number;
  discountPercent: number;
}

export async function topDeals({ limit }: { limit: number }) {
  return prisma.$queryRaw<TopDealRow[]>`
    SELECT
      id, name, slug, price, "discountPrice", stock, unit, "avgRating", "reviewCount",
      ROUND((("price" - "discountPrice") / "price" * 100)::numeric, 2) AS "discountPercent"
    FROM products
    WHERE "isActive" = true AND "discountPrice" IS NOT NULL AND "discountPrice" < "price"
    ORDER BY "discountPercent" DESC
    LIMIT ${limit}
  `;
}

export async function getProductBySlug(slug: string, viewerId?: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      ...PRODUCT_INCLUDE_SUMMARY,
      variants: true,
      seller: { select: { id: true, name: true, profileImage: true } },
    },
  });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found.');

  // Fire-and-forget view count bump — not worth blocking the response for.
  prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  let isWishlisted = false;
  if (viewerId) {
    const wish = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: viewerId, productId: product.id } },
    });
    isWishlisted = Boolean(wish);
  }

  return { ...product, isWishlisted };
}

async function getProductForOwner(id: string, user: User) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound('Product not found.');
  assertOwnership(product, user);
  return product;
}

export async function createProduct(seller: User, data: ProductCreateInput) {
  const { variants, ...productData } = data;

  if (productData.discountPrice && productData.discountPrice >= productData.price) {
    throw ApiError.badRequest('discountPrice must be lower than price.');
  }
  if (productData.subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: productData.subCategoryId } });
    if (!subCategory || subCategory.categoryId !== productData.categoryId) {
      throw ApiError.badRequest('subCategoryId does not belong to the given categoryId.');
    }
  }

  const category = await prisma.category.findUnique({ where: { id: productData.categoryId } });
  if (!category) throw ApiError.badRequest('categoryId does not exist.');

  const baseSlug = slugify(productData.name);
  const clash = await prisma.product.findUnique({ where: { slug: baseSlug } });
  const slug = clash ? slugifyUnique(productData.name) : baseSlug;

  return prisma.product.create({
    data: {
      ...productData,
      slug,
      sellerId: seller.id,
      variants: variants && variants.length > 0 ? { create: variants } : undefined,
    },
    include: PRODUCT_INCLUDE_SUMMARY,
  });
}

export async function updateProduct(id: string, user: User, data: ProductUpdateInput) {
  const product = await getProductForOwner(id, user);

  const { variants, ...productData } = data; // variant changes go through dedicated endpoints
  // Unchecked variant, not the relation-style ProductUpdateInput — our data
  // carries scalar FK fields (categoryId, subCategoryId) directly, matching
  // how the Zod schema (and createProduct below) shape this data.
  const updateData: Prisma.ProductUncheckedUpdateInput = { ...productData };

  if (productData.name && productData.name !== product.name) {
    const baseSlug = slugify(productData.name);
    const clash = await prisma.product.findFirst({ where: { slug: baseSlug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(productData.name) : baseSlug;
  }

  const nextPrice = productData.price ?? Number(product.price);
  const nextDiscount = productData.discountPrice ?? (product.discountPrice ? Number(product.discountPrice) : undefined);
  if (nextDiscount && Number(nextDiscount) >= Number(nextPrice)) {
    throw ApiError.badRequest('discountPrice must be lower than price.');
  }

  return prisma.product.update({ where: { id }, data: updateData, include: PRODUCT_INCLUDE_SUMMARY });
}

export async function deleteProduct(id: string, user: User) {
  const product = await getProductForOwner(id, user);
  const images = await prisma.productImage.findMany({ where: { productId: id } });

  await prisma.product.delete({ where: { id: product.id } });

  await Promise.all(images.filter((img) => img.publicId).map((img) => deleteAsset(img.publicId).catch(() => {})));
}

export async function addProductImages(productId: string, user: User, files: Express.Multer.File[]) {
  const product = await getProductForOwner(productId, user);
  const existingCount = await prisma.productImage.count({ where: { productId } });

  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer, { folder: 'agri-marketplace/products' })));

  const images = await prisma.$transaction(
    uploaded.map((img, idx) =>
      prisma.productImage.create({
        data: {
          productId: product.id,
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

export async function removeProductImage(productId: string, imageId: string, user: User) {
  await getProductForOwner(productId, user);
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) throw ApiError.notFound('Image not found.');

  await prisma.productImage.delete({ where: { id: imageId } });
  if (image.publicId) await deleteAsset(image.publicId).catch(() => {});

  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}

export async function addVariant(productId: string, user: User, data: VariantInput) {
  await getProductForOwner(productId, user);
  return prisma.productVariant.create({ data: { ...data, productId } });
}

export async function updateVariant(productId: string, variantId: string, user: User, data: Partial<VariantInput>) {
  await getProductForOwner(productId, user);
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw ApiError.notFound('Variant not found.');
  return prisma.productVariant.update({ where: { id: variantId }, data });
}

export async function removeVariant(productId: string, variantId: string, user: User) {
  await getProductForOwner(productId, user);
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw ApiError.notFound('Variant not found.');
  await prisma.productVariant.delete({ where: { id: variantId } });
}
