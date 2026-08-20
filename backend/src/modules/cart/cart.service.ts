import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';

const CART_INCLUDE = {
  items: {
    include: {
      product: {
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
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

function computeCartSummary(cart: CartWithItems) {
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.discountPrice ?? item.product.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return { ...item, unitPrice, lineTotal };
  });
  return { ...cart, items, subtotal: Math.round(subtotal * 100) / 100 };
}

export async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: CART_INCLUDE });
  }
  return computeCartSummary(cart);
}

async function validateStockAvailable(productId: string, variantId: string | undefined, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found.');

  if (variantId) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw ApiError.badRequest('Variant does not belong to this product.');
    if (variant.stock < quantity) throw ApiError.badRequest(`Only ${variant.stock} unit(s) of this variant left in stock.`);
  } else if (product.stock < quantity) {
    throw ApiError.badRequest(`Only ${product.stock} unit(s) left in stock.`);
  }
}

export async function addItem(userId: string, { productId, variantId, quantity }: { productId: string; variantId?: string; quantity: number }) {
  await validateStockAvailable(productId, variantId, quantity);

  const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  if (existing) {
    await validateStockAvailable(productId, variantId, existing.quantity + quantity);
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
  }

  return getOrCreateCart(userId);
}

export async function updateItemQuantity(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found.');

  await validateStockAvailable(item.productId, item.variantId ?? undefined, quantity);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  return getOrCreateCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getOrCreateCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart(userId);
}
