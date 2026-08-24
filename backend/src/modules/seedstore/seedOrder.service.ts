import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { emitOrderUpdate } from '../../config/socket';
import type { SeedCheckoutInput, ListSeedOrdersQuery, UpdateSeedOrderStatusInput, CancelSeedOrderInput } from './seedOrder.validation';

const SEED_ORDER_INCLUDE_DETAIL = {
  items: { include: { seed: { select: { id: true, name: true, slug: true, sellerId: true } }, variant: true } },
  address: true,
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  payment: true,
} satisfies Prisma.SeedOrderInclude;

type SeedOrderWithDetail = Prisma.SeedOrderGetPayload<{ include: typeof SEED_ORDER_INCLUDE_DETAIL }>;

// Same placeholder business rules as the main store's order.service.ts —
// adjust to your actual pricing policy, and keep both in sync if you do.
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 49;
const TAX_RATE = 0.05;

async function generateUniqueSeedOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomInt(1000, 9999);
    const candidate = `SORD-${ymd}-${rand}`;
    // eslint-disable-next-line no-await-in-loop
    const clash = await prisma.seedOrder.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }
  throw ApiError.internal('Could not generate a unique order number. Please try again.');
}

function assertCanView(order: SeedOrderWithDetail, user: User) {
  if (user.role === 'ADMIN') return;
  if (order.userId === user.id) return;
  const isSellerOnOrder = order.items.some((item) => item.seed?.sellerId === user.id);
  if (isSellerOnOrder) return;
  throw ApiError.forbidden('You do not have permission to view this order.');
}

export async function checkoutSeeds(userId: string, { addressId, notes }: SeedCheckoutInput): Promise<SeedOrderWithDetail> {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.badRequest('Address not found for this account.');

  const cart = await prisma.seedCart.findUnique({
    where: { userId },
    include: { items: { include: { seed: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your seed cart is empty.');

  for (const item of cart.items) {
    if (!item.seed.isActive) {
      throw ApiError.badRequest(`"${item.seed.name}" is no longer available. Remove it from your cart.`);
    }
    const availableStock = item.variant ? item.variant.stock : item.seed.stock;
    if (availableStock < item.quantity) {
      throw ApiError.badRequest(`Only ${availableStock} unit(s) of "${item.seed.name}" left in stock.`);
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

  const order = await prisma.$transaction(async (tx) => {
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
        throw ApiError.conflict(`"${item.seed.name}" just sold out while you were checking out. Please update your cart.`);
      }
    }

    await tx.seedCartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
}

async function restoreStockForSeedOrder(tx: Prisma.TransactionClient, order: SeedOrderWithDetail) {
  for (const item of order.items) {
    if (item.variantId) {
      // eslint-disable-next-line no-await-in-loop
      await tx.seedVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await tx.seed.update({ where: { id: item.seedId }, data: { stock: { increment: item.quantity } } });
    }
  }
}

export async function listSeedOrders(user: User, query: ListSeedOrdersQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.SeedOrderWhereInput = {};
  if (query.scope === 'selling') {
    where.items = { some: { seed: { sellerId: user.id } } };
  } else if (user.role === 'ADMIN') {
    if (query.userId) where.userId = query.userId;
  } else {
    where.userId = user.id;
  }
  if (query.status) where.status = query.status;

  const itemsWhere = query.scope === 'selling' && user.role !== 'ADMIN'
    ? { seed: { sellerId: user.id } }
    : undefined;

  const [items, totalItems] = await Promise.all([
    prisma.seedOrder.findMany({
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
    prisma.seedOrder.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getSeedOrderById(orderId: string, user: User) {
  const order = await prisma.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
  if (!order) throw ApiError.notFound('Order not found.');
  assertCanView(order, user);
  return order;
}

export async function updateSeedOrderStatus(orderId: string, user: User, { status, note }: UpdateSeedOrderStatusInput) {
  const order = await prisma.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
  if (!order) throw ApiError.notFound('Order not found.');

  if (user.role !== 'ADMIN') {
    const isSellerOnOrder = order.items.some((item) => item.seed?.sellerId === user.id);
    if (!isSellerOnOrder) throw ApiError.forbidden('You do not have permission to update this order.');
  }

  if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
    throw ApiError.badRequest(`Order is already ${order.status.toLowerCase()} and cannot be changed further.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
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

  emitOrderUpdate(updated);
  return updated;
}

export async function cancelSeedOrder(orderId: string, user: User, { reason }: CancelSeedOrderInput) {
  const order = await prisma.seedOrder.findUnique({ where: { id: orderId }, include: SEED_ORDER_INCLUDE_DETAIL });
  if (!order) throw ApiError.notFound('Order not found.');

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw ApiError.forbidden('You do not have permission to cancel this order.');
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw ApiError.badRequest(`Order can no longer be cancelled once it is ${order.status.toLowerCase()}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
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

  emitOrderUpdate(updated);
  return updated;
}
