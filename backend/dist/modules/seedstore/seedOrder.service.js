"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSeeds = checkoutSeeds;
exports.listSeedOrders = listSeedOrders;
exports.getSeedOrderById = getSeedOrderById;
exports.updateSeedOrderStatus = updateSeedOrderStatus;
exports.cancelSeedOrder = cancelSeedOrder;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const socket_1 = require("../../config/socket");
const notification_service_1 = require("../notification/notification.service");
const SEED_ORDER_INCLUDE_DETAIL = {
    items: { include: { seed: { select: { id: true, name: true, slug: true, sellerId: true } }, variant: true } },
    address: true,
    statusHistory: { orderBy: { changedAt: 'asc' } },
    payment: true,
};
// Same business rules as the main store's order.service.ts — now sourced
// from .env (see config/env.ts) so both stay in sync automatically.
const FREE_SHIPPING_THRESHOLD = env_1.env.pricing.freeShippingThreshold;
const FLAT_SHIPPING_FEE = env_1.env.pricing.platformFee;
const TAX_RATE = env_1.env.pricing.taxRate;
async function generateUniqueSeedOrderNumber() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = crypto_1.default.randomInt(1000, 9999);
        const candidate = `SORD-${ymd}-${rand}`;
        // eslint-disable-next-line no-await-in-loop
        const clash = await prisma_1.default.seedOrder.findUnique({ where: { orderNumber: candidate } });
        if (!clash)
            return candidate;
    }
    throw ApiError_1.default.internal('Could not generate a unique order number. Please try again.');
}
function assertCanView(order, user) {
    if (user.role === 'ADMIN')
        return;
    if (order.userId === user.id)
        return;
    const isSellerOnOrder = order.items.some((item) => item.seed?.sellerId === user.id);
    if (isSellerOnOrder)
        return;
    throw ApiError_1.default.forbidden('You do not have permission to view this order.');
}
async function checkoutSeeds(userId, { addressId, notes }) {
    const address = await prisma_1.default.address.findFirst({ where: { id: addressId, userId } });
    if (!address)
        throw ApiError_1.default.badRequest('Address not found for this account.');
    const cart = await prisma_1.default.seedCart.findUnique({
        where: { userId },
        include: { items: { include: { seed: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0)
        throw ApiError_1.default.badRequest('Your seed cart is empty.');
    for (const item of cart.items) {
        if (!item.seed.isActive) {
            throw ApiError_1.default.badRequest(`"${item.seed.name}" is no longer available. Remove it from your cart.`);
        }
        const availableStock = item.variant ? item.variant.stock : item.seed.stock;
        if (availableStock < item.quantity) {
            throw ApiError_1.default.badRequest(`Only ${availableStock} unit(s) of "${item.seed.name}" left in stock.`);
        }
    }
    const orderNumber = await generateUniqueSeedOrderNumber();
    let subtotal = 0;
    const itemsData = cart.items.map((item) => {
        const unitPrice = item.variant ? Number(item.variant.price) : Number(item.seed.discountPrice ?? item.seed.price);
        const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += totalPrice;
        return {
            seedId: item.seedId,
            variantId: item.variantId,
            seedName: item.seed.name,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
        };
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + shippingFee + tax) * 100) / 100;
    const order = await prisma_1.default.$transaction(async (tx) => {
        const created = await tx.seedOrder.create({
            data: {
                orderNumber,
                userId,
                addressId,
                notes,
                subtotal,
                shippingFee,
                tax,
                totalAmount,
                items: { create: itemsData },
                statusHistory: { create: { status: 'PENDING', note: 'Order placed.' } },
            },
            include: SEED_ORDER_INCLUDE_DETAIL,
        });
        // Same race-safe guard as the main store: a conditional UPDATE ... WHERE
        // stock >= quantity, not a plain decrement, so two concurrent checkouts
        // for the last unit can't both succeed. See order.service.ts for the
        // full explanation.
        for (const item of cart.items) {
            const target = item.variantId
                ? tx.seedVariant.updateMany({
                    where: { id: item.variantId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                })
                : tx.seed.updateMany({
                    where: { id: item.seedId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
            // eslint-disable-next-line no-await-in-loop
            const result = await target;
            if (result.count === 0) {
                throw ApiError_1.default.conflict(`"${item.seed.name}" just sold out while you were checking out. Please update your cart.`);
            }
        }
        await tx.seedCartItem.deleteMany({ where: { cartId: cart.id } });
        return created;
    });
    const sellerIds = [...new Set(cart.items.map((item) => item.seed.sellerId))];
    Promise.all(sellerIds.map(sellerId => (0, notification_service_1.notifyUser)({
        userId: sellerId,
        type: 'ORDER_STATUS',
        title: 'New Seed Order Received',
        message: `You have received a new seed order (#${orderNumber}). Please check your fulfillment dashboard.`,
        relatedEntityType: 'SEED_ORDER',
        relatedEntityId: order.id,
        email: {
            subject: `New Seed Order Received - #${orderNumber}`,
            html: `<p>Great news! You have received a new seed order (<b>#${orderNumber}</b>).</p><p>Please log in to your seller dashboard to review and fulfill the order.</p>`,
        }
    }))).catch(() => { });
    return order;
}
async function restoreStockForSeedOrder(tx, order) {
    for (const item of order.items) {
        if (item.variantId) {
            // eslint-disable-next-line no-await-in-loop
            await tx.seedVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        else {
            // eslint-disable-next-line no-await-in-loop
            await tx.seed.update({ where: { id: item.seedId }, data: { stock: { increment: item.quantity } } });
        }
    }
}
async function listSeedOrders(user, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.scope === 'selling') {
        where.items = { some: { seed: { sellerId: user.id } } };
    }
    else if (user.role === 'ADMIN') {
        if (query.userId)
            where.userId = query.userId;
    }
    else {
        where.userId = user.id;
    }
    if (query.status)
        where.status = query.status;
    const itemsWhere = query.scope === 'selling' && user.role !== 'ADMIN'
        ? { seed: { sellerId: user.id } }
        : undefined;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.seedOrder.findMany({
            where,
            include: {
                items: {
                    where: itemsWhere,
                    include: { seed: { select: { id: true, name: true, slug: true, sellerId: true } }, variant: true },
                },
                user: { select: { id: true, name: true, email: true } },
                payment: { select: { status: true, method: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.seedOrder.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getSeedOrderById(orderId, user) {
    const order = await prisma_1.default.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    assertCanView(order, user);
    return order;
}
async function updateSeedOrderStatus(orderId, user, { status, note }) {
    const order = await prisma_1.default.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (user.role !== 'ADMIN') {
        const isSellerOnOrder = order.items.some((item) => item.seed?.sellerId === user.id);
        if (!isSellerOnOrder)
            throw ApiError_1.default.forbidden('You do not have permission to update this order.');
    }
    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
        throw ApiError_1.default.badRequest(`Order is already ${order.status.toLowerCase()} and cannot be changed further.`);
    }
    const updated = await prisma_1.default.$transaction(async (tx) => {
        const result = await tx.seedOrder.update({
            where: { id: orderId },
            data: { status, statusHistory: { create: { status, note, changedById: user.id } } },
            include: SEED_ORDER_INCLUDE_DETAIL,
        });
        if (status === 'CANCELLED' || status === 'RETURNED') {
            await restoreStockForSeedOrder(tx, order);
        }
        return result;
    });
    (0, socket_1.emitOrderUpdate)(updated);
    return updated;
}
async function cancelSeedOrder(orderId, user, { reason }) {
    const order = await prisma_1.default.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
        throw ApiError_1.default.forbidden('You do not have permission to cancel this order.');
    }
    if (order.status !== 'PENDING') {
        throw ApiError_1.default.badRequest(`Order can no longer be cancelled once it is ${order.status.toLowerCase()}.`);
    }
    const updated = await prisma_1.default.$transaction(async (tx) => {
        const result = await tx.seedOrder.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                cancelReason: reason,
                statusHistory: { create: { status: 'CANCELLED', note: reason || 'Cancelled by request.', changedById: user.id } },
            },
            include: SEED_ORDER_INCLUDE_DETAIL,
        });
        await restoreStockForSeedOrder(tx, order);
        return result;
    });
    (0, socket_1.emitOrderUpdate)(updated);
    return updated;
}
//# sourceMappingURL=seedOrder.service.js.map