import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../../src/config/prisma';
import ApiError from '../../src/common/utils/ApiError';
import { updateStatus } from '../../src/modules/order/order.service';
import { createUser, createCategory, createProduct, createAddress, createOrder, cleanup } from '../helpers/fixtures';

const orderIds: string[] = [];
const productIds: string[] = [];
const categoryIds: string[] = [];
const userIds: string[] = [];

after(async () => {
  await cleanup({ orderIds, productIds, categoryIds, userIds });
  await prisma.$disconnect();
});

async function setupOrder(status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' = 'SHIPPED') {
  const buyer = await createUser('BUYER');
  const seller = await createUser('SELLER');
  const admin = await createUser('ADMIN');
  const category = await createCategory();
  const product = await createProduct(seller.id, category.id);
  const address = await createAddress(buyer.id);
  const order = await createOrder(buyer.id, address.id, product, { status, paid: true });

  userIds.push(buyer.id, seller.id, admin.id);
  categoryIds.push(category.id);
  productIds.push(product.id);
  orderIds.push(order.id);

  return { buyer, seller, admin, product, order };
}

describe('The seller must NEVER be able to manually mark an order as delivered (requirement #18)', () => {
  it('rejects a seller attempting to set DELIVERED via updateStatus, regardless of current order status', async () => {
    const { seller, order } = await setupOrder('OUT_FOR_DELIVERY');
    await assert.rejects(
      () => updateStatus(order.id, seller, { status: 'DELIVERED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
    const unchanged = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(unchanged.status, 'OUT_FOR_DELIVERY', 'order status must be untouched by the rejected attempt');
  });

  it('rejects a seller attempting ANY manual status change, not only DELIVERED', async () => {
    const { seller, order } = await setupOrder('CONFIRMED');
    await assert.rejects(
      () => updateStatus(order.id, seller, { status: 'SHIPPED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });

  it('rejects a plain buyer attempting to set DELIVERED on their own order', async () => {
    const { buyer, order } = await setupOrder('OUT_FOR_DELIVERY');
    await assert.rejects(
      () => updateStatus(order.id, buyer, { status: 'DELIVERED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });
});

describe('Admin manual override — governed by the explicit transition graph (requirement #8)', () => {
  it('rejects the specific invalid transitions the spec calls out', async () => {
    const delivered = await setupOrder('DELIVERED');
    await assert.rejects(
      () => updateStatus(delivered.order.id, delivered.admin, { status: 'SHIPPED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );

    const delivered2 = await setupOrder('DELIVERED');
    await assert.rejects(
      () => updateStatus(delivered2.order.id, delivered2.admin, { status: 'PROCESSING' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );

    const shipped = await setupOrder('SHIPPED');
    await assert.rejects(
      () => updateStatus(shipped.order.id, shipped.admin, { status: 'PENDING' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });

  it('allows a valid single-step admin transition', async () => {
    const { admin, order } = await setupOrder('SHIPPED');
    const updated = await updateStatus(order.id, admin, { status: 'OUT_FOR_DELIVERY' });
    assert.equal(updated.status, 'OUT_FOR_DELIVERY');
  });

  it('rejects an admin trying to set DISPUTED directly (must go through the dispute flow, which pairs it with a Dispute record)', async () => {
    const { admin, order } = await setupOrder('DELIVERED');
    await assert.rejects(
      () => updateStatus(order.id, admin, { status: 'DISPUTED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });

  it('blocks any generic status change while an order is under an open dispute', async () => {
    const { admin, order } = await setupOrder('DELIVERED');
    await prisma.order.update({ where: { id: order.id }, data: { status: 'DISPUTED' } });
    await assert.rejects(
      () => updateStatus(order.id, admin, { status: 'RETURNED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });
});
