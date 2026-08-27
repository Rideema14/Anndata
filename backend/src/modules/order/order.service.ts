import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { emitOrderUpdate } from '../../config/socket';
import { notifyUser } from '../notification/notification.service';
import { syncTracking, getTrackingUrl } from './tracking.service';
import type { CheckoutInput, ListOrdersQuery, UpdateStatusInput, CancelOrderInput } from './order.validation';

const ORDER_INCLUDE_DETAIL = {
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, sellerId: true, images: { orderBy: { sortOrder: 'asc' as const }, take: 1 } } },
      variant: true,
    },
  },
  address: true,
  // Buyer contact info — sellers need this on the order detail page to
  // coordinate delivery (name/phone alongside the shipping address).
  user: { select: { id: true, name: true, email: true, phone: true } },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE_DETAIL }>;

// Placeholder business rules — adjust to your actual pricing policy.
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 49;
const TAX_RATE = 0.05; // 5% flat placeholder tax

// Sellers can only advance status manually when auto-tracking is NOT active.
// Once tracking is linked, the cron handles advancement automatically.
const SELLER_STATUS_TRANSITIONS: Partial<Record<string, string>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

async function generateUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomInt(1000, 9999);
    const candidate = `ORD-${ymd}-${rand}`;
    // eslint-disable-next-line no-await-in-loop
    const clash = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }
  throw ApiError.internal('Could not generate a unique order number. Please try again.');
}

function assertCanView(order: OrderWithDetail, user: User) {
  if (user.role === 'ADMIN') return;
  if (order.userId === user.id) return;
  const isSellerOnOrder = order.items.some((item) => item.product?.sellerId === user.id);
  if (isSellerOnOrder) return;
  throw ApiError.forbidden('You do not have permission to view this order.');
}

export async function checkout(userId: string, { addressId, notes }: CheckoutInput): Promise<OrderWithDetail> {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.badRequest('Address not found for this account.');

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty.');

  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw ApiError.badRequest(`"${item.product.name}" is no longer available. Remove it from your cart.`);
    }
    const availableStock = item.variant ? item.variant.stock : item.product.stock;
    if (availableStock < item.quantity) {
      throw ApiError.badRequest(`Only ${availableStock} unit(s) of "${item.product.name}" left in stock.`);
    }
  }

  const orderNumber = await generateUniqueOrderNumber();

  let subtotal = 0;
  const itemsData = cart.items.map((item) => {
    const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.discountPrice ?? item.product.price);
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += totalPrice;
    return {
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
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
    const created = await tx.order.create({
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
      include: ORDER_INCLUDE_DETAIL,
    });

    // Decrement stock now, at order-creation time, to prevent overselling
    for (const item of cart.items) {
      const target = item.variantId
        ? tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
        : tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
      // eslint-disable-next-line no-await-in-loop
      const result = await target;
      if (result.count === 0) {
        throw ApiError.conflict(`"${item.product.name}" just sold out while you were checking out. Please update your cart.`);
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  const sellerIds = [...new Set(cart.items.map((item) => item.product.sellerId))];
  Promise.all(sellerIds.map(sellerId => notifyUser({
    userId: sellerId,
    type: 'ORDER_STATUS',
    title: 'New Order Received',
    message: `You have received a new order (#${orderNumber}). Please check your fulfillment dashboard.`,
    relatedEntityType: 'ORDER',
    relatedEntityId: order.id,
    email: {
      subject: `New Order Received - #${orderNumber}`,
      html: `<p>Great news! You have received a new order (<b>#${orderNumber}</b>).</p><p>Please log in to your seller dashboard to review and fulfill the order.</p>`,
    }
  }))).catch(() => {});

  return order;
}

async function restoreStockForOrder(tx: Prisma.TransactionClient, order: OrderWithDetail) {
  for (const item of order.items) {
    if (item.variantId) {
      // eslint-disable-next-line no-await-in-loop
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
  }
}

export async function listOrders(user: User, query: ListOrdersQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.OrderWhereInput = {};
  if (query.scope === 'selling') {
    where.items = { some: { product: { sellerId: user.id } } };
  } else if (user.role === 'ADMIN') {
    if (query.userId) where.userId = query.userId;
  } else {
    where.userId = user.id;
  }
  if (query.status) where.status = query.status;

  const itemsWhere = query.scope === 'selling' && user.role !== 'ADMIN'
    ? { product: { sellerId: user.id } }
    : undefined;

  const [items, totalItems] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          where: itemsWhere,
          include: { product: { select: { id: true, name: true, slug: true, sellerId: true } }, variant: true },
        },
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getOrderById(idOrNumber: string, user: User) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: ORDER_INCLUDE_DETAIL,
  });
  if (!order) throw ApiError.notFound('Order not found.');
  assertCanView(order, user);
  return order;
}

export async function updateStatus(idOrNumber: string, user: User, { status, note, trackingCarrier, trackingNumber }: UpdateStatusInput) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: ORDER_INCLUDE_DETAIL,
  });
  if (!order) throw ApiError.notFound('Order not found.');
  const orderId = order.id;

  if (user.role !== 'ADMIN') {
    const isSellerOnOrder = order.items.some((item) => item.product?.sellerId === user.id);
    if (!isSellerOnOrder) throw ApiError.forbidden('You do not have permission to update this order.');

    // For tracked orders (have tracking number), only allow the initial PENDING→CONFIRMED transition.
    // All subsequent status changes are handled automatically by the tracking cron.
    const trackingNumber = (order as unknown as { trackingNumber?: string }).trackingNumber;
    if (trackingNumber && status !== 'CONFIRMED') {
      throw ApiError.badRequest('This order has live tracking enabled. Status updates happen automatically based on carrier data.');
    }

    const expectedStatus = SELLER_STATUS_TRANSITIONS[order.status];
    if (status !== expectedStatus) {
      throw ApiError.badRequest(`Order must move from ${order.status.toLowerCase()} to ${expectedStatus?.toLowerCase() ?? 'a terminal state'}.`);
    }
  }

  if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
    throw ApiError.badRequest(`Order is already ${order.status.toLowerCase()} and cannot be changed further.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'CONFIRMED' ? { trackingCarrier, trackingNumber } : {}),
        statusHistory: { create: { status, note, changedById: user.id } },
      },
      include: ORDER_INCLUDE_DETAIL,
    });
    if (status === 'CANCELLED' || status === 'RETURNED') {
      await restoreStockForOrder(tx, order);
    }
    return result;
  });

  emitOrderUpdate(updated);

  // After seller confirms with tracking info, trigger the first tracking sync
  const updatedWithTracking = updated as OrderWithDetail & {
    trackingCarrier?: string | null;
    trackingNumber?: string | null;
  };
  if (status === 'CONFIRMED' && updatedWithTracking.trackingCarrier && updatedWithTracking.trackingNumber) {
    const carrierName = updatedWithTracking.trackingCarrier;
    const trackingNumber = updatedWithTracking.trackingNumber;
    const trackUrl = getTrackingUrl(carrierName, trackingNumber);

    notifyUser({
      userId: updated.userId,
      type: 'ORDER_STATUS',
      title: 'Order confirmed — tracking active',
      message: `Your order #${updated.orderNumber} has been confirmed. Tracking number: ${trackingNumber}. Status updates will appear automatically.`,
      relatedEntityType: 'ORDER',
      relatedEntityId: updated.id,
      email: {
        subject: `Your order #${updated.orderNumber} is confirmed`,
        html: `<p>Your order has been confirmed.</p><p><b>Carrier:</b> ${carrierName}</p><p><b>Tracking:</b> ${trackingNumber}</p>${trackUrl ? `<p><a href="${trackUrl}">Track your shipment</a></p>` : ''}`,
      },
    }).catch(() => {});

    // Fire initial sync asynchronously
    syncTracking(updated.id).catch(() => {});
  }

  return updated;
}

export async function cancelOrder(idOrNumber: string, user: User, { reason }: CancelOrderInput) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
    include: ORDER_INCLUDE_DETAIL,
  });
  if (!order) throw ApiError.notFound('Order not found.');
  const orderId = order.id;

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw ApiError.forbidden('You do not have permission to cancel this order.');
  }
  if (order.status !== 'PENDING') {
    throw ApiError.badRequest(`Order can no longer be cancelled once it is ${order.status.toLowerCase()}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        statusHistory: { create: { status: 'CANCELLED', note: reason || 'Cancelled by request.', changedById: user.id } },
      },
      include: ORDER_INCLUDE_DETAIL,
    });
    await restoreStockForOrder(tx, order);
    return result;
  });

  emitOrderUpdate(updated);
  return updated;
}