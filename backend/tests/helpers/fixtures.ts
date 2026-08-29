import crypto from 'node:crypto';
import prisma from '../../src/config/prisma';
import type { OrderStatus, Role } from '@prisma/client';

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createUser(role: Role, overrides: Partial<{ name: string; email: string }> = {}) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? `Test ${role}`,
      email: overrides.email ?? `${unique(role.toLowerCase())}@test.local`,
      passwordHash: 'not-a-real-hash',
      role,
      isEmailVerified: true,
    },
  });
}

export async function createCategory() {
  const slug = unique('cat');
  return prisma.category.create({ data: { name: slug, slug } });
}

export async function createProduct(sellerId: string, categoryId: string, overrides: Partial<{ price: number; stock: number }> = {}) {
  const slug = unique('product');
  return prisma.product.create({
    data: {
      sellerId,
      categoryId,
      name: slug,
      slug,
      price: overrides.price ?? 500,
      stock: overrides.stock ?? 50,
    },
  });
}

export async function createAddress(userId: string) {
  return prisma.address.create({
    data: {
      userId,
      fullName: 'Test Buyer',
      phone: '9999999999',
      addressLine1: '123 Test Street',
      city: 'Testville',
      state: 'Test State',
      postalCode: '123456',
    },
  });
}

/**
 * Creates an order with one line item for `product`, optionally already
 * paid (default: yes — most shipment-flow tests need a PAID order, since
 * submitShipment() requires it) and at whatever OrderStatus is requested.
 */
export async function createOrder(
  buyerId: string,
  addressId: string,
  product: { id: string; name: string; price: unknown },
  opts: { status?: OrderStatus; paid?: boolean; quantity?: number } = {},
) {
  const orderNumber = unique('TEST-ORD').toUpperCase();
  const quantity = opts.quantity ?? 1;
  const price = Number(product.price);
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: buyerId,
      addressId,
      status: opts.status ?? 'PENDING',
      subtotal: price * quantity,
      totalAmount: price * quantity,
      items: {
        create: [{ productId: product.id, productName: product.name, quantity, unitPrice: price, totalPrice: price * quantity }],
      },
    },
  });

  if (opts.paid !== false) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: buyerId,
        razorpayOrderId: unique('rzp_test'),
        amount: price * quantity,
        status: 'PAID',
      },
    });
  }

  return order;
}

/** Deletes everything created for one test's fixtures, given the ids collected along the way. Call in a `finally` / `after` block. */
export async function cleanup(ids: { orderIds?: string[]; productIds?: string[]; categoryIds?: string[]; userIds?: string[] }) {
  // Children before parents. Shipment/ShipmentEvent/Dispute/ShipmentAuditLog
  // cascade-delete with their order (or, for audit logs, are intentionally
  // orphan-safe — see schema.prisma) so deleting the order is enough for
  // those; OrderItem/Payment also cascade with the order.
  if (ids.orderIds?.length) await prisma.order.deleteMany({ where: { id: { in: ids.orderIds } } });
  if (ids.productIds?.length) await prisma.product.deleteMany({ where: { id: { in: ids.productIds } } });
  if (ids.categoryIds?.length) await prisma.category.deleteMany({ where: { id: { in: ids.categoryIds } } });
  if (ids.userIds?.length) await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
}
