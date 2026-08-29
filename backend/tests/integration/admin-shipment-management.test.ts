import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../../src/config/prisma';
import { submitShipment } from '../../src/modules/order/shipment.service';
import { listShipments, flagShipmentForReview } from '../../src/modules/admin/admin.service';
import { createUser, createCategory, createProduct, createAddress, createOrder, cleanup } from '../helpers/fixtures';

const orderIds: string[] = [];
const productIds: string[] = [];
const categoryIds: string[] = [];
const userIds: string[] = [];

after(async () => {
  await cleanup({ orderIds, productIds, categoryIds, userIds });
  await prisma.$disconnect();
});

async function setupOrder() {
  const buyer = await createUser('BUYER');
  const seller = await createUser('SELLER');
  const admin = await createUser('ADMIN');
  const category = await createCategory();
  const product = await createProduct(seller.id, category.id);
  const address = await createAddress(buyer.id);
  const order = await createOrder(buyer.id, address.id, product, { status: 'PENDING', paid: true });

  userIds.push(buyer.id, seller.id, admin.id);
  categoryIds.push(category.id);
  productIds.push(product.id);
  orderIds.push(order.id);

  return { buyer, seller, admin, product, order };
}

describe('AWB verification when the tracking provider is unavailable (requirement #16)', () => {
  it('accepts the AWB submission but leaves it unverified and flagged, instead of hard-failing (with no TRACKINGMORE_API_KEY / TRACKING_SIMULATE configured)', async () => {
    if (process.env.TRACKING_SIMULATE === 'true' || process.env.TRACKINGMORE_API_KEY) {
      console.log('  (skipping — this test specifically needs NO tracking provider configured)');
      return;
    }
    const { seller, order } = await setupOrder();
    const updated = await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC4443332221' });

    assert.equal(updated.shipment?.verified, false, 'must not be marked verified when the provider could not be reached');
    assert.equal(updated.shipment?.status, 'AWB_SUBMITTED', 'must stay at AWB_SUBMITTED, not silently advance');
    assert.equal(updated.shipment?.flaggedForReview, true, 'must be flagged so an admin knows verification is pending');
    // The order itself still advances to CONFIRMED — the seller did their
    // one job (submit the AWB); it's the *shipment*'s verified flag that
    // stays false, not the whole order stuck at PENDING.
    assert.equal(updated.status, 'CONFIRMED');
  });
});

describe('admin.service — shipment management (requirement #10)', () => {
  it('lists a submitted shipment with the order/seller/courier fields the admin dashboard needs', async () => {
    const { seller, order } = await setupOrder();
    await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC7778889990' });

    const { items } = await listShipments({ search: order.orderNumber });
    assert.equal(items.length, 1);
    const item = items[0];
    assert.equal(item.awb, 'DTDC7778889990');
    assert.equal(item.order.orderNumber, order.orderNumber);
    assert.equal(item.order.user.id, (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).userId);
    assert.ok(item.seller);
  });

  it('flagging a shipment sets flaggedForReview + riskNote without touching status/events (requirement #10)', async () => {
    const { seller, admin, order } = await setupOrder();
    const shipmentAfterSubmit = (await submitShipment(order.id, seller, { carrierCode: 'DTDC', awb: 'DTDC1112223334' })).shipment!;

    const flagged = await flagShipmentForReview(order.id, admin, { note: 'Buyer called in confused about delivery timeline.' });

    assert.equal(flagged.flaggedForReview, true);
    assert.ok(flagged.riskNote?.includes('confused about delivery timeline'));
    // The admin flag action must never be able to alter the courier-derived
    // status — it should be exactly what submitShipment left it at.
    assert.equal(flagged.status, shipmentAfterSubmit.status);
  });
});
