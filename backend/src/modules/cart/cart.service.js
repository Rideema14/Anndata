const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');

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
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
      variant: true,
    },
    orderBy: { createdAt: 'asc' },
  },
};

function computeCartSummary(cart) {
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.discountPrice ?? item.product.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return { ...item, unitPrice, lineTotal };
  });
  return { ...cart, items, subtotal: Math.round(subtotal * 100) / 100 };
}

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: CART_INCLUDE });
  }
  return computeCartSummary(cart);
}

async function validateStockAvailable(productId, variantId, quantity) {
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

async function addItem(userId, { productId, variantId, quantity }) {
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

async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found.');

  await validateStockAvailable(item.productId, item.variantId, quantity);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  return getOrCreateCart(userId);
}

async function removeItem(userId, itemId) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart is empty.');

  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getOrCreateCart(userId);
}

async function clearCart(userId) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart(userId);
}

module.exports = { getOrCreateCart, addItem, updateItemQuantity, removeItem, clearCart, computeCartSummary, CART_INCLUDE };
