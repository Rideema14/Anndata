import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';

const SEED_CART_INCLUDE = {
  items: {
    include: {
      seed: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          discountPrice: true,
          stock: true,
          isActive: true,
          images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
        },
      },
      variant: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.SeedCartInclude;

type SeedCartWithItems = Prisma.SeedCartGetPayload<{ include: typeof SEED_CART_INCLUDE }>;

function computeSeedCartSummary(cart: SeedCartWithItems) {
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const unitPrice = item.variant ? Number(item.variant.price) : Number(item.seed.discountPrice ?? item.seed.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return { ...item, unitPrice, lineTotal };
  });
  return { ...cart, items, subtotal: Math.round(subtotal * 100) / 100 };
}

export async function getOrCreateSeedCart(userId: string) {
  let cart = await prisma.seedCart.findUnique({ where: { userId }, include: SEED_CART_INCLUDE });
  if (!cart) {
    cart = await prisma.seedCart.create({ data: { userId }, include: SEED_CART_INCLUDE });
  }
  return computeSeedCartSummary(cart);
}

async function validateStockAvailable(seedId: string, variantId: string | undefined, quantity: number) {
  const seed = await prisma.seed.findUnique({ where: { id: seedId } });
  if (!seed || !seed.isActive) throw ApiError.notFound('Seed not found.');

  if (variantId) {
    const variant = await prisma.seedVariant.findFirst({ where: { id: variantId, seedId } });
    if (!variant) throw ApiError.badRequest('Variant does not belong to this seed.');
    if (variant.stock < quantity) throw ApiError.badRequest(`Only ${variant.stock} unit(s) of this variant left in stock.`);
  } else if (seed.stock < quantity) {
    throw ApiError.badRequest(`Only ${seed.stock} unit(s) left in stock.`);
  }
}

export async function addSeedItem(userId: string, { seedId, variantId, quantity }: { seedId: string; variantId?: string; quantity: number }) {
  await validateStockAvailable(seedId, variantId, quantity);

  const cart = await prisma.seedCart.upsert({ where: { userId }, update: {}, create: { userId } });

  const existing = await prisma.seedCartItem.findFirst({
    where: { cartId: cart.id, seedId, variantId: variantId ?? null },
  });

  if (existing) {
    await validateStockAvailable(seedId, variantId, existing.quantity + quantity);
    await prisma.seedCartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  } else {
    await prisma.seedCartItem.create({ data: { cartId: cart.id, seedId, variantId, quantity } });
  }

  return getOrCreateSeedCart(userId);
}

export async function updateSeedItemQuantity(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.seedCart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  const item = await prisma.seedCartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found.');

  await validateStockAvailable(item.seedId, item.variantId ?? undefined, quantity);
  await prisma.seedCartItem.update({ where: { id: itemId }, data: { quantity } });

  return getOrCreateSeedCart(userId);
}

export async function removeSeedItem(userId: string, itemId: string) {
  const cart = await prisma.seedCart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  await prisma.seedCartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getOrCreateSeedCart(userId);
}

export async function clearSeedCart(userId: string) {
  const cart = await prisma.seedCart.findUnique({ where: { userId } });
  if (!cart) return getOrCreateSeedCart(userId);

  await prisma.seedCartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateSeedCart(userId);
}
