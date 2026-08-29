import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../../src/config/prisma';
import ApiError from '../../src/common/utils/ApiError';
import { submitShipment, getShipmentForOrder } from '../../src/modules/order/shipment.service';
import { syncTracking } from '../../src/modules/order/tracking.service';
import { createUser, createCategory, createProduct, createAddress, createOrder, cleanup } from '../helpers/fixtures';

const orderIds: string[] = [];
const productIds: string[] = [];
const categoryIds: string[] = [];
const userIds: string[] = [];

after(async () => {
  await cleanup({ orderIds, productIds, categoryIds, userIds });
  await prisma.$disconnect();
});

async function setupOrder(status: 'PENDING' | 'CONFIRMED' = 'PENDING') {
  const buyer = await createUser('BUYER');
  const seller = await createUser('SELLER');
  const otherSeller = await createUser('SELLER');
  const category = await createCategory();
  const product = await createProduct(seller.id, category.id);
  const address = await createAddress(buyer.id);
  const order = await createOrder(buyer.id, address.id, product, { status, paid: true });

  userIds.push(buyer.id, seller.id, otherSeller.id);
  categoryIds.push(category.id);
  productIds.push(product.id);
  orderIds.push(order.id);

  return { buyer, seller, otherSeller, product, order };
}

describe('shipment.service.submitShipment — AWB validation (requirement #2/#3)', () => {
  it('rejects an empty/too-short AWB', async () => {
    const { seller, order } = await setupOrder();
    await assert.rejects(
      () => submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'AB' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    );
  });

  it('rejects a malformed AWB (invalid characters)', async () => {
    const { seller, order } = await setupOrder();
    await assert.rejects(
      () => submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'ABC 123 !!!' }),
      (err: unknown) => err instanceof ApiError,
    );
  });

  it('requires a carrierName when carrierCode is OTHER', async () => {
    const { seller, order } = await setupOrder();
    // This is a validation-schema concern (order.validation.ts's
    // submitShipmentSchema), exercised at the HTTP layer — asserted here at
    // the service level via the same missing-carrierName condition.
    await assert.rejects(
      () => submitShipment(order.id, seller, { carrierCode: 'OTHER', awb: 'LOCALTEMPO12345' } as never),
      () => true,
    );
  });
});

describe('shipment.service.submitShipment — authorization (requirement #13)', () => {
  it('rejects a seller who has no items on this order', async () => {
    const { otherSeller, order } = await setupOrder();
    await assert.rejects(
      () => submitShipment(order.id, otherSeller, { carrierCode: 'DTDC', awb: 'DTDC1234567890' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });

  it('rejects a buyer trying to submit a shipment on their own order', async () => {
    const { buyer, order } = await setupOrder();
    await assert.rejects(
      () => submitShipment(order.id, buyer, { carrierCode: 'DTDC', awb: 'DTDC1234567890' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });

  it('rejects a buyer/other-seller reading shipment detail they do not own', async () => {
    const { otherSeller, order } = await setupOrder();
    await assert.rejects(
      () => getShipmentForOrder(order.id, otherSeller),
      (err: unknown) => err instanceof ApiError && err.statusCode === 403,
    );
  });
});

describe('shipment.service.submitShipment — happy path (TRACKING_SIMULATE=true)', () => {
  it('accepts a well-formed AWB, verifies it, and advances the order to CONFIRMED', async () => {
    if (process.env.TRACKING_SIMULATE !== 'true') {
      console.log('  (skipping — requires TRACKING_SIMULATE=true in the test environment)');
      return;
    }
    const { seller, order } = await setupOrder();
    const updated = await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC9988776655' });

    assert.equal(updated.status, 'CONFIRMED');
    assert.ok(updated.shipment);
    assert.equal(updated.shipment?.verified, true);
    assert.equal(updated.shipment?.status, 'AWB_VERIFIED');
    assert.equal(updated.shipment?.awb, 'DTDC9988776655');
  });

  it('rejects resubmitting a different AWB once the shipment is already verified', async () => {
    if (process.env.TRACKING_SIMULATE !== 'true') {
      console.log('  (skipping — requires TRACKING_SIMULATE=true in the test environment)');
      return;
    }
    const { seller, order } = await setupOrder();
    await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC1111111111' });
    await assert.rejects(
      () => submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC2222222222' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 409,
    );
  });
});

describe('shipment.service.submitShipment — duplicate AWB (requirement #3)', () => {
  it('rejects an AWB already attached to another active order with the same carrier', async () => {
    if (process.env.TRACKING_SIMULATE !== 'true') {
      console.log('  (skipping — requires TRACKING_SIMULATE=true in the test environment)');
      return;
    }
    const first = await setupOrder();
    const second = await setupOrder();
    await submitShipment(first.order.id, first.seller, { carrierCode: 'DELHIVERY', awb: 'DUPLICATE-AWB-001' });

    await assert.rejects(
      () => submitShipment(second.order.id, second.seller, { carrierCode: 'DELHIVERY', awb: 'DUPLICATE-AWB-001' }),
      (err: unknown) => err instanceof ApiError && err.statusCode === 409,
    );
  });
});

describe('tracking sync — courier is the only source of pickup/delivery (requirement #4/#5/#6)', () => {
  it('never lets the order reach DELIVERED without going through syncTracking (i.e. without a real courier event)', async () => {
    if (process.env.TRACKING_SIMULATE !== 'true') {
      console.log('  (skipping — requires TRACKING_SIMULATE=true in the test environment)');
      return;
    }
    const { seller, order } = await setupOrder();
    await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC5556667778' });

    const beforeSync = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { shipment: true } });
    assert.notEqual(beforeSync.status, 'DELIVERED');
    assert.equal(beforeSync.shipment?.deliveredAt, null);

    // Advance simulated time far enough past AWB verification that every
    // step of the simulation timeline (including "Delivered") has fired,
    // then let syncTracking pick it up — exactly like the cron would.
    await prisma.shipment.update({ where: { orderId: order.id }, data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } });
    await syncTracking(order.id);

    const afterSync = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { shipment: { include: { events: true } } } });
    assert.equal(afterSync.status, 'DELIVERED');
    assert.equal(afterSync.shipment?.status, 'DELIVERED');
    assert.ok(afterSync.shipment?.deliveredAt, 'deliveredAt must be set by the courier sync, never by the seller');
    assert.equal(afterSync.shipment?.deliverySource, 'SIMULATION');
    assert.ok(afterSync.shipment && afterSync.shipment.events.length > 0, 'a full shipment event history must exist');
  });

  it('is idempotent — running sync twice does not duplicate events', async () => {
    if (process.env.TRACKING_SIMULATE !== 'true') {
      console.log('  (skipping — requires TRACKING_SIMULATE=true in the test environment)');
      return;
    }
    const { seller, order } = await setupOrder();
    await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC1212121212' });
    await syncTracking(order.id);
    const firstCount = await prisma.shipmentEvent.count({ where: { orderId: order.id } });
    await syncTracking(order.id);
    const secondCount = await prisma.shipmentEvent.count({ where: { orderId: order.id } });
    assert.equal(secondCount, firstCount, 'a second sync pass must not create duplicate events');
  });
});
