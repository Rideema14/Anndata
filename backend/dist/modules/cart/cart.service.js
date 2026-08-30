"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCart = getOrCreateCart;
exports.addItem = addItem;
exports.updateItemQuantity = updateItemQuantity;
exports.removeItem = removeItem;
exports.clearCart = clearCart;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
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
    let cart = await prisma_1.default.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
    if (!cart) {
        cart = await prisma_1.default.cart.create({ data: { userId }, include: CART_INCLUDE });
    }
    return computeCartSummary(cart);
}
async function validateStockAvailable(productId, variantId, quantity) {
    const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive)
        throw ApiError_1.default.notFound('Product not found.');
    if (variantId) {
        const variant = await prisma_1.default.productVariant.findFirst({ where: { id: variantId, productId } });
        if (!variant)
            throw ApiError_1.default.badRequest('Variant does not belong to this product.');
        if (variant.stock < quantity)
            throw ApiError_1.default.badRequest(`Only ${variant.stock} unit(s) of this variant left in stock.`);
    }
    else if (product.stock < quantity) {
        throw ApiError_1.default.badRequest(`Only ${product.stock} unit(s) left in stock.`);
    }
}
async function addItem(userId, { productId, variantId, quantity }) {
    await validateStockAvailable(productId, variantId, quantity);
    const cart = await prisma_1.default.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    const existing = await prisma_1.default.cartItem.findFirst({
        where: { cartId: cart.id, productId, variantId: variantId ?? null },
    });
    if (existing) {
        await validateStockAvailable(productId, variantId, existing.quantity + quantity);
        await prisma_1.default.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
    }
    else {
        await prisma_1.default.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
    }
    return getOrCreateCart(userId);
}
async function updateItemQuantity(userId, itemId, quantity) {
    const cart = await prisma_1.default.cart.findUnique({ where: { userId } });
    if (!cart)
        throw ApiError_1.default.notFound('Cart is empty.');
    const item = await prisma_1.default.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item)
        throw ApiError_1.default.notFound('Cart item not found.');
    await validateStockAvailable(item.productId, item.variantId ?? undefined, quantity);
    await prisma_1.default.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return getOrCreateCart(userId);
}
async function removeItem(userId, itemId) {
    const cart = await prisma_1.default.cart.findUnique({ where: { userId } });
    if (!cart)
        throw ApiError_1.default.notFound('Cart is empty.');
    await prisma_1.default.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return getOrCreateCart(userId);
}
async function clearCart(userId) {
    const cart = await prisma_1.default.cart.findUnique({ where: { userId } });
    if (!cart)
        return getOrCreateCart(userId);
    await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
    return getOrCreateCart(userId);
}
//# sourceMappingURL=cart.service.js.map