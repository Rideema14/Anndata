"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSeedCart = getOrCreateSeedCart;
exports.addSeedItem = addSeedItem;
exports.updateSeedItemQuantity = updateSeedItemQuantity;
exports.removeSeedItem = removeSeedItem;
exports.clearSeedCart = clearSeedCart;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
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
                    images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                },
            },
            variant: true,
        },
        orderBy: { createdAt: 'asc' },
    },
};
function computeSeedCartSummary(cart) {
    let subtotal = 0;
    const items = cart.items.map((item) => {
        const unitPrice = item.variant ? Number(item.variant.price) : Number(item.seed.discountPrice ?? item.seed.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        return { ...item, unitPrice, lineTotal };
    });
    return { ...cart, items, subtotal: Math.round(subtotal * 100) / 100 };
}
async function getOrCreateSeedCart(userId) {
    let cart = await prisma_1.default.seedCart.findUnique({ where: { userId }, include: SEED_CART_INCLUDE });
    if (!cart) {
        cart = await prisma_1.default.seedCart.create({ data: { userId }, include: SEED_CART_INCLUDE });
    }
    return computeSeedCartSummary(cart);
}
async function validateStockAvailable(seedId, variantId, quantity) {
    const seed = await prisma_1.default.seed.findUnique({ where: { id: seedId } });
    if (!seed || !seed.isActive)
        throw ApiError_1.default.notFound('Seed not found.');
    if (variantId) {
        const variant = await prisma_1.default.seedVariant.findFirst({ where: { id: variantId, seedId } });
        if (!variant)
            throw ApiError_1.default.badRequest('Variant does not belong to this seed.');
        if (variant.stock < quantity)
            throw ApiError_1.default.badRequest(`Only ${variant.stock} unit(s) of this variant left in stock.`);
    }
    else if (seed.stock < quantity) {
        throw ApiError_1.default.badRequest(`Only ${seed.stock} unit(s) left in stock.`);
    }
}
async function addSeedItem(userId, { seedId, variantId, quantity }) {
    await validateStockAvailable(seedId, variantId, quantity);
    const cart = await prisma_1.default.seedCart.upsert({ where: { userId }, update: {}, create: { userId } });
    const existing = await prisma_1.default.seedCartItem.findFirst({
        where: { cartId: cart.id, seedId, variantId: variantId ?? null },
    });
    if (existing) {
        await validateStockAvailable(seedId, variantId, existing.quantity + quantity);
        await prisma_1.default.seedCartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
    }
    else {
        await prisma_1.default.seedCartItem.create({ data: { cartId: cart.id, seedId, variantId, quantity } });
    }
    return getOrCreateSeedCart(userId);
}
async function updateSeedItemQuantity(userId, itemId, quantity) {
    const cart = await prisma_1.default.seedCart.findUnique({ where: { userId } });
    if (!cart)
        throw ApiError_1.default.notFound('Cart is empty.');
    const item = await prisma_1.default.seedCartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item)
        throw ApiError_1.default.notFound('Cart item not found.');
    await validateStockAvailable(item.seedId, item.variantId ?? undefined, quantity);
    await prisma_1.default.seedCartItem.update({ where: { id: itemId }, data: { quantity } });
    return getOrCreateSeedCart(userId);
}
async function removeSeedItem(userId, itemId) {
    const cart = await prisma_1.default.seedCart.findUnique({ where: { userId } });
    if (!cart)
        throw ApiError_1.default.notFound('Cart is empty.');
    await prisma_1.default.seedCartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return getOrCreateSeedCart(userId);
}
async function clearSeedCart(userId) {
    const cart = await prisma_1.default.seedCart.findUnique({ where: { userId } });
    if (!cart)
        return getOrCreateSeedCart(userId);
    await prisma_1.default.seedCartItem.deleteMany({ where: { cartId: cart.id } });
    return getOrCreateSeedCart(userId);
}
//# sourceMappingURL=seedCart.service.js.map