import crypto from 'crypto';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { emitOrderUpdate } from '../../config/socket';
import { notifyUser } from '../notification/notification.service';
import logger from '../../common/utils/logger';

// ---------------------------------------------------------------------------
// Supported carriers & their tracking URL templates
// ---------------------------------------------------------------------------

export const SUPPORTED_CARRIERS = [
  { code: 'DELHIVERY', name: 'Delhivery', trackingUrl: (awb: string) => `https://www.delhivery.com/tracking?uniqueIdentifier=${encodeURIComponent(awb)}` },
  { code: 'BLUEDART', name: 'BlueDart', trackingUrl: (awb: string) => `https://www.bluedart.com/tracking/${encodeURIComponent(awb)}` },
  { code: 'DTDC', name: 'DTDC', trackingUrl: (awb: string) => `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}` },
  { code: 'INDIA_POST', name: 'India Post', trackingUrl: (awb: string) => `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?TrackConsignmentID=${encodeURIComponent(awb)}` },
  { code: 'EKART', name: 'Ekart Logistics', trackingUrl: (awb: string) => `https://ekartlogistics.com/track/${encodeURIComponent(awb)}` },
  { code: 'XPRESSBEES', name: 'XpressBees', trackingUrl: (awb: string) => `https://www.xpressbees.com/shipment/tracking?awb=${encodeURIComponent(awb)}` },
  { code: 'SHADOWFAX', name: 'Shadowfax', trackingUrl: (awb: string) => `https://tracker.shadowfax.in/#/track/${encodeURIComponent(awb)}` },
  { code: 'ECOM_EXPRESS', name: 'Ecom Express', trackingUrl: (awb: string) => `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}` },
  { code: 'PROFESSIONAL', name: 'Professional Couriers', trackingUrl: (awb: string) => `https://www.tpcindia.com/track.aspx?id=${encodeURIComponent(awb)}` },
  { code: 'OTHER', name: 'Other', trackingUrl: () => '' },
] as const;

export type CarrierCode = typeof SUPPORTED_CARRIERS[number]['code'];

export function getCarrier(code: string) {
  return SUPPORTED_CARRIERS.find((c) => c.code === code);
}

export function getTrackingUrl(carrierCode: string, trackingNumber: string): string {
  const carrier = getCarrier(carrierCode);
  return carrier ? carrier.trackingUrl(trackingNumber) : '';
}

// ---------------------------------------------------------------------------
// Unified tracking status — normalizes across carriers
// ---------------------------------------------------------------------------

export type TrackingStatus =
  | 'InfoReceived'   // Carrier has info but not yet picked up
  | 'PickedUp'       // Package collected from sender
  | 'InTransit'      // Moving between hubs
  | 'OutForDelivery' // On the delivery vehicle
  | 'Delivered'      // Successfully delivered
  | 'Exception'      // Delivery exception / failed attempt
  | 'Returned';      // Returned to sender

/** Maps our tracking status to an OrderStatus for auto-advancement. */
const STATUS_TO_ORDER_STATUS: Partial<Record<TrackingStatus, string>> = {
  PickedUp: 'CONFIRMED',
  InTransit: 'PROCESSING',
  OutForDelivery: 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
};

/** Order of statuses for "can we advance?" checks (higher index = further along). */
const ORDER_STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
};

// ---------------------------------------------------------------------------
// Simulation engine — generates realistic tracking events
// ---------------------------------------------------------------------------

interface SimEvent {
  status: TrackingStatus;
  description: string;
  location: string;
  delayMinutes: number; // delay from order confirmation
}

const SIMULATION_TIMELINE: SimEvent[] = [
  { status: 'PickedUp', description: 'Shipment picked up from seller', location: 'Seller Warehouse', delayMinutes: 1 },
  { status: 'InTransit', description: 'Arrived at origin sorting facility', location: 'Origin Hub', delayMinutes: 2 },
  { status: 'InTransit', description: 'Departed origin facility', location: 'Origin Hub', delayMinutes: 3 },
  { status: 'InTransit', description: 'In transit to destination city', location: 'En Route', delayMinutes: 4 },
  { status: 'InTransit', description: 'Arrived at destination hub', location: 'Destination Hub', delayMinutes: 6 },
  { status: 'InTransit', description: 'Shipment processed at destination facility', location: 'Destination Hub', delayMinutes: 7 },
  { status: 'OutForDelivery', description: 'Out for delivery', location: 'Local Delivery Center', delayMinutes: 9 },
  { status: 'Delivered', description: 'Delivered — signed by recipient', location: 'Delivery Address', delayMinutes: 11 },
];

function generateSimulationEvents(confirmTime: Date): Array<{ status: TrackingStatus; description: string; location: string; eventTime: Date }> {
  return SIMULATION_TIMELINE.map((evt) => ({
    status: evt.status,
    description: evt.description,
    location: evt.location,
    eventTime: new Date(confirmTime.getTime() + evt.delayMinutes * 60 * 1000),
  }));
}

// ---------------------------------------------------------------------------
// TrackingMore API client (real mode)
// ---------------------------------------------------------------------------

interface TrackingMoreEvent {
  Date: string;
  StatusDescription: string;
  Details: string;
}

interface TrackingMoreResponse {
  meta: { code: number };
  data: {
    items: Array<{
      tracking_number: string;
      delivery_status: string;
      origin_info?: { trackinfo?: TrackingMoreEvent[] };
      destination_info?: { trackinfo?: TrackingMoreEvent[] };
    }>;
  };
}

function normalizeTrackingMoreStatus(status: string): TrackingStatus {
  const s = status.toLowerCase();
  if (s.includes('delivered')) return 'Delivered';
  if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 'OutForDelivery';
  if (s.includes('transit') || s.includes('departed') || s.includes('arrived') || s.includes('hub')) return 'InTransit';
  if (s.includes('picked') || s.includes('pickup') || s.includes('collected')) return 'PickedUp';
  if (s.includes('exception') || s.includes('failed') || s.includes('undelivered')) return 'Exception';
  if (s.includes('returned') || s.includes('rto')) return 'Returned';
  if (s.includes('info') || s.includes('created') || s.includes('manifest')) return 'InfoReceived';
  return 'InTransit';
}

async function fetchTrackingMoreEvents(trackingNumber: string, carrierCode: string) {
  const apiKey = env.tracking.apiKey;
  if (!apiKey) {
    logger.warn('TrackingMore API key not set — skipping real tracking fetch.');
    return [];
  }

  try {
    const res = await fetch(`https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${trackingNumber}`, {
      headers: {
        'Tracking-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      logger.warn(`TrackingMore API returned ${res.status} for AWB ${trackingNumber}`);
      return [];
    }
    const body = (await res.json()) as TrackingMoreResponse;
    const item = body.data?.items?.[0];
    if (!item) return [];

    const events = [
      ...(item.origin_info?.trackinfo ?? []),
      ...(item.destination_info?.trackinfo ?? []),
    ];

    return events.map((e) => ({
      status: normalizeTrackingMoreStatus(e.StatusDescription),
      description: e.StatusDescription,
      location: e.Details || null,
      eventTime: new Date(e.Date),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`TrackingMore API error for ${trackingNumber}: ${message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Core sync function — called by the cron job
// ---------------------------------------------------------------------------

export async function syncTracking(orderId: string): Promise<void> {
  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipmentEvents: true, items: { include: { product: { select: { sellerId: true } } } } },
  })) as unknown as (Awaited<ReturnType<typeof prisma.order.findUnique>> & {
    trackingNumber: string | null;
    trackingCarrier: string | null;
    shipmentEvents: Array<{ eventTime: Date; description: string }>;
  });

  if (!order || !order.trackingNumber || !order.trackingCarrier) return;

  // Don't sync terminal orders
  if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) return;

  // Get events — either simulated or from API
  let rawEvents: Array<{ status: TrackingStatus; description: string; location: string | null; eventTime: Date }>;

  if (env.tracking.simulate) {
    // Find when the order was confirmed (tracking added)
    const confirmTime = order.updatedAt;
    const allSimEvents = generateSimulationEvents(confirmTime);
    // Only include events whose time has passed
    rawEvents = allSimEvents.filter((e) => e.eventTime <= new Date());
  } else {
    rawEvents = await fetchTrackingMoreEvents(order.trackingNumber, order.trackingCarrier);
  }

  if (rawEvents.length === 0) return;

  // Deduplicate: skip events we've already stored
  const existingKeys = new Set(
    order.shipmentEvents.map((e) => `${e.eventTime.toISOString()}|${e.description}`)
  );

  const newEvents = rawEvents.filter(
    (e) => !existingKeys.has(`${e.eventTime.toISOString()}|${e.description}`)
  );

  if (newEvents.length === 0) {
    // Just update sync timestamp
    await prisma.order.update({ where: { id: orderId }, data: {} });
    return;
  }

  // Save new events
  await prisma.shipmentEvent.createMany({
    data: newEvents.map((e) => ({
      id: crypto.randomUUID(),
      orderId,
      status: e.status,
      description: e.description,
      location: e.location,
      eventTime: e.eventTime,
      source: env.tracking.simulate ? 'SIMULATION' : 'TRACKING_API',
    })),
  });

  // Auto-advance order status based on the latest tracking event
  const latestEvent = rawEvents[rawEvents.length - 1];
  const targetOrderStatus = STATUS_TO_ORDER_STATUS[latestEvent.status];

  if (targetOrderStatus) {
    const currentRank = ORDER_STATUS_RANK[order.status] ?? 0;
    const targetRank = ORDER_STATUS_RANK[targetOrderStatus] ?? 0;

    if (targetRank > currentRank) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: targetOrderStatus as any,
          statusHistory: {
            create: {
              status: targetOrderStatus as any,
              note: `Auto-updated from tracking: ${latestEvent.description}`,
            },
          },
        },
        include: { items: true },
      });

      emitOrderUpdate(updated);

      // Notify buyer of status change
      notifyUser({
        userId: order.userId,
        type: 'ORDER_STATUS',
        title: `Order ${order.orderNumber} — ${latestEvent.description}`,
        message: `Your shipment status: ${latestEvent.description}${latestEvent.location ? ` (${latestEvent.location})` : ''}`,
        relatedEntityType: 'ORDER',
        relatedEntityId: orderId,
      }).catch(() => {});
    } else {
      await prisma.order.update({ where: { id: orderId }, data: {} });
    }
  } else {
    await prisma.order.update({ where: { id: orderId }, data: {} });
  }
}

// ---------------------------------------------------------------------------
// Public API: get timeline for an order
// ---------------------------------------------------------------------------

export async function getTrackingTimeline(orderId: string) {
  const events = await prisma.shipmentEvent.findMany({
    where: { orderId },
    orderBy: { eventTime: 'asc' },
  });
  return events;
}
