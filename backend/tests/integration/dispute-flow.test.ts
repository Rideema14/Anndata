import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../../src/config/prisma';
import ApiError from '../../src/common/utils/ApiError';
import { createDispute } from '../../src/modules/order/dispute.service';
import { reviewDispute } from '../../src/modules/admin/admin.service';
import { createUser, createCategory, createProduct, createAddress, createOrder, cleanup } from '../helpers/fixtures';

const orderIds: string[] = [];
const productIds: string[] = [];
const categoryIds: string[] = [];
const userIds: string[] = [];

after(async () => {
  await cleanup({ orderIds, productIds, categoryIds, userIds });
  await prisma.$disconnect();
});

async function setupOrder(status: 'PENDING' | 'SHIPPED' | 'DELIVERED' = 'DELIVERED') {
  const buyer = await createUser('BUYER');
  const otherBuyer = await createUser('BUYER');
  const seller = await createUser('SELLER');
  const admin = await createUser('ADMIN');
  const category = await createCategory();
  const product = await createProduct(seller.id, category.id);
  const address = await createAddress(buyer.id);
  const order = await createOrder(buyer.id, address.id, product, { status, paid: true });

  userIds.push(buyer.id, otherBuyer.id, seller.id, admin.id);
  categoryIds.push(category.id);
  productIds.push(product.id);
  orderIds.push(order.id);

  return { buyer, otherBuyer, seller, admin, product, order };
}

describe('dispute.service.createDispute — requirement #9', () => {
  it('rejects a dispute on an order that has not been delivered yet', async () => {
    const { buyer, order } = await setupOrder('SHIPPED');
    await assert.rejects(
      () => createDispute(order.id, buyer, { reason: 'Never arrived' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });

  it('rejects a buyer disputing an order that is not theirs', async () => {
    const { otherBuyer, order } = await setupOrder('DELIVERED');
    await assert.rejects(
      () => createDispute(order.id, otherBuyer, { reason: 'Not mine to dispute' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });

  it('opens a dispute on a delivered order and puts the order on hold (DISPUTED)', async () => {
    const { buyer, order } = await setupOrder('DELIVERED');
    const dispute = await createDispute(order.id, buyer, { reason: 'Box was empty', details: 'Packaging looked tampered with.' });

    assert.equal(dispute.status, 'OPEN');
    assert.equal(dispute.reason, 'Box was empty');

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updatedOrder.status, 'DISPUTED', 'order must be taken out of DELIVERED while the dispute is open');
  });

  it('does not delete or alter any prior shipment events when a dispute is opened', async () => {
    const { buyer, order } = await setupOrder('DELIVERED');
    await prisma.shipmentEvent.create({
      data: { orderId: order.id, status: 'Delivered', description: 'Delivered to recipient', eventTime: new Date(), source: 'TRACKING_API' },
    });
    const eventsBefore = await prisma.shipmentEvent.count({ where: { orderId: order.id } });

    await createDispute(order.id, buyer, { reason: 'Item damaged' });

    const eventsAfter = await prisma.shipmentEvent.count({ where: { orderId: order.id } });
    assert.equal(eventsAfter, eventsBefore, 'shipment evidence must be preserved untouched');
  });

  it('rejects opening a second dispute while one is already open', async () => {
    const { buyer, order } = await setupOrder('DELIVERED');
    await createDispute(order.id, buyer, { reason: 'First report' });
    // The order is now DISPUTED, not DELIVERED, so a second attempt should
    // fail the "must be DELIVERED" check before it even reaches the
    // already-open-dispute check — either way, it must be rejected.
    await assert.rejects(() => createDispute(order.id, buyer, { reason: 'Second report' }), (err: unknown) => err instanceof ApiError);
  });
});

describe('admin.service.reviewDispute — requirement #9', () => {
  it('resolving a dispute takes the order out of DISPUTED and back to DELIVERED', async () => {
    const { buyer, admin, order } = await setupOrder('DELIVERED');
    const dispute = await createDispute(order.id, buyer, { reason: 'Wrong item received' });

    const reviewed = await reviewDispute(dispute.id, admin, { status: 'RESOLVED', adminNote: 'Refund issued.' });
    assert.equal(reviewed.status, 'RESOLVED');
    assert.equal(reviewed.adminNote, 'Refund issued.');
    assert.ok(reviewed.resolvedAt);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updatedOrder.status, 'DELIVERED');
  });

  it('rejecting a dispute also closes it and restores DELIVERED (delivery evidence upheld)', async () => {
    const { buyer, admin, order } = await setupOrder('DELIVERED');
    const dispute = await createDispute(order.id, buyer, { reason: 'Claims non-delivery' });

    const reviewed = await reviewDispute(dispute.id, admin, { status: 'REJECTED', adminNote: 'GPS + OTP evidence confirms delivery.' });
    assert.equal(reviewed.status, 'REJECTED');

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updatedOrder.status, 'DELIVERED');
  });

  it('marking a dispute UNDER_REVIEW keeps the order in DISPUTED', async () => {
    const { buyer, admin, order } = await setupOrder('DELIVERED');
    const dispute = await createDispute(order.id, buyer, { reason: 'Investigating' });

    await reviewDispute(dispute.id, admin, { status: 'UNDER_REVIEW' });

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(updatedOrder.status, 'DISPUTED');
  });

  it('rejects reviewing a dispute that is already closed', async () => {
    const { buyer, admin, order } = await setupOrder('DELIVERED');
    const dispute = await createDispute(order.id, buyer, { reason: 'One-time report' });
    await reviewDispute(dispute.id, admin, { status: 'RESOLVED' });

    await assert.rejects(
      () => reviewDispute(dispute.id, admin, { status: 'REJECTED' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });
});
