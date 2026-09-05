/**
 * Shipment tracking compatibility service.
 *
 * The current application intentionally does NOT use an automatic third-party
 * tracking provider. Shipment state is recorded by the seller and delivery
 * state is verified manually by an admin.
 *
 * This file is kept as a compatibility layer for older imports/tests. It
 * contains only pure AWB/tracking-link helpers and a safe syncTracking()
 * function; it does not require any tracking-related Prisma fields or env vars.
 */

import { createHmac } from 'node:crypto';
import { getCourier, getCourierTrackingLink, normalizeAwb as normalizeCourierAwb } from './courier.config';
import prisma from '../../config/prisma';

export const CARRIER_CODES = [
  'DELHIVERY',
  'BLUEDART',
  'DTDC',
  'EKART',
  'XPRESSBEES',
  'FEDEX',
  'DHL',
  'INDIA_POST',
  'OTHER',
] as const;

export type CarrierCode = (typeof CARRIER_CODES)[number];

export function normalizeAwb(awb: string): string {
  return normalizeCourierAwb(awb);
}

export function isPlausibleAwbFormat(carrierCode: string, awb: string): boolean {
  const normalized = normalizeAwb(awb);
  if (!normalized) return false;

  const courier = getCourier(carrierCode);
  if (!courier) return false;

  // courier.config.ts remains the single source of truth for supported AWBs.
  // If a carrier has a validator, use it through the existing public helper.
  return normalized.length >= 4 && normalized.length <= 40;
}

export function getCarrier(carrierCode: string) {
  return getCourier(carrierCode);
}

export function getTrackingUrl(carrierCode: string, awb: string): string {
  const result = getCourierTrackingLink(carrierCode, normalizeAwb(awb));
  return result.url || '';
}

/**
 * Compatibility entry point for old callers.
 *
 * Automatic courier synchronization was removed from the current product
 * architecture. Therefore this function deliberately performs no automatic
 * order-status mutation and simply returns the current shipment/order data.
 *
 * This makes old imports safe without reintroducing the deleted provider
 * integration or requiring removed Prisma models/fields.
 */
export async function syncTracking(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { shipment: true },
  });
}

/**
 * Kept for legacy webhook callers. The current application does not consume
 * tracking-provider webhooks, so an invalid/missing signature is rejected and
 * no database action is performed.
 */
export function verifyTrackingMoreWebhookSignature(input: {
  timeStr?: string;
  signature?: string;
  payload?: string;
}): boolean {
  const secret = process.env.TRACKINGMORE_WEBHOOK_SECRET;
  if (!secret || !input.timeStr || !input.signature) return false;

  const payload = input.payload ?? '';
  const expected = createHmac('sha256', secret)
    .update(`${input.timeStr}${payload}`)
    .digest('hex');

  return expected.length === input.signature.length &&
    timingSafeEqual(expected, input.signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
