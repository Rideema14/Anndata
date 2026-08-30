"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CARRIERS = exports.CARRIER_CODES = void 0;
exports.getCarrier = getCarrier;
exports.getTrackingUrl = getTrackingUrl;
exports.normalizeAwb = normalizeAwb;
exports.isPlausibleAwbFormat = isPlausibleAwbFormat;
exports.verifyAwbWithProvider = verifyAwbWithProvider;
exports.syncTracking = syncTracking;
exports.verifyTrack17WebhookToken = verifyTrack17WebhookToken;
exports.handleTrack17WebhookPayload = handleTrack17WebhookPayload;
exports.getTrackingTimeline = getTrackingTimeline;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const socket_1 = require("../../config/socket");
const notification_service_1 = require("../notification/notification.service");
const logger_1 = __importDefault(require("../../common/utils/logger"));
const auditLog_service_1 = require("./auditLog.service");
const shipment_constants_1 = require("./shipment.constants");
// ---------------------------------------------------------------------------
// Supported carriers & their tracking URL templates (unchanged — reused as-is)
// ---------------------------------------------------------------------------
// A real `as const` tuple (not derived via .map()) — z.enum() in
// order.validation.ts needs a literal tuple type, not a plain string[].
exports.CARRIER_CODES = [
    'DELHIVERY',
    'BLUEDART',
    'DTDC',
    'INDIA_POST',
    'EKART',
    'XPRESSBEES',
    'SHADOWFAX',
    'ECOM_EXPRESS',
    'PROFESSIONAL',
    'OTHER',
];
const CARRIER_META = {
    DELHIVERY: { name: 'Delhivery', trackingUrl: (awb) => `https://www.delhivery.com/tracking?uniqueIdentifier=${encodeURIComponent(awb)}` },
    BLUEDART: { name: 'BlueDart', trackingUrl: (awb) => `https://www.bluedart.com/tracking/${encodeURIComponent(awb)}` },
    DTDC: { name: 'DTDC', trackingUrl: (awb) => `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}` },
    INDIA_POST: { name: 'India Post', trackingUrl: (awb) => `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?TrackConsignmentID=${encodeURIComponent(awb)}` },
    EKART: { name: 'Ekart Logistics', trackingUrl: (awb) => `https://ekartlogistics.com/track/${encodeURIComponent(awb)}` },
    XPRESSBEES: { name: 'XpressBees', trackingUrl: (awb) => `https://www.xpressbees.com/shipment/tracking?awb=${encodeURIComponent(awb)}` },
    SHADOWFAX: { name: 'Shadowfax', trackingUrl: (awb) => `https://tracker.shadowfax.in/#/track/${encodeURIComponent(awb)}` },
    ECOM_EXPRESS: { name: 'Ecom Express', trackingUrl: (awb) => `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}` },
    PROFESSIONAL: { name: 'Professional Couriers', trackingUrl: (awb) => `https://www.tpcindia.com/track.aspx?id=${encodeURIComponent(awb)}` },
    OTHER: { name: 'Other', trackingUrl: () => '' },
};
exports.SUPPORTED_CARRIERS = exports.CARRIER_CODES.map((code) => ({ code, ...CARRIER_META[code] }));
function getCarrier(code) {
    return exports.SUPPORTED_CARRIERS.find((c) => c.code === code);
}
function getTrackingUrl(carrierCode, trackingNumber) {
    const carrier = getCarrier(carrierCode);
    return carrier ? carrier.trackingUrl(trackingNumber) : '';
}
// ---------------------------------------------------------------------------
// AWB format validation (requirement #2: reject empty/malformed input before
// ever calling the provider or touching the DB) — unchanged
// ---------------------------------------------------------------------------
function normalizeAwb(raw) {
    return raw.trim().toUpperCase().replace(/\s+/g, '');
}
/**
 * Loose, carrier-agnostic sanity check — real validation happens against the
 * tracking provider (verifyAwbWithProvider). This just rejects the obviously
 * broken input before we spend an API call or a DB row on it: empty,
 * too short/long, or containing characters no courier uses in an AWB.
 */
function isPlausibleAwbFormat(awb) {
    if (!awb)
        return false;
    if (awb.length < 6 || awb.length > 40)
        return false;
    return /^[A-Z0-9-]+$/.test(awb);
}
/** Maps our normalized tracking status to the granular, courier-derived ShipmentStatus. */
const TRACKING_STATUS_TO_SHIPMENT_STATUS = {
    InfoReceived: 'AWB_VERIFIED',
    PickedUp: 'PICKUP_CONFIRMED',
    InTransit: 'IN_TRANSIT',
    OutForDelivery: 'OUT_FOR_DELIVERY',
    Delivered: 'DELIVERED',
    DeliveryFailed: 'DELIVERY_FAILED',
    Exception: 'EXCEPTION',
    Returned: 'RETURNED',
};
/**
 * 17TRACK (v2.4 API) reports a string main `stage` (their "Main Status" —
 * NotFound / InfoReceived / InTransit / Expired / AvailableForPickup /
 * OutForDelivery / DeliveryFailure / Delivered / Exception) plus an optional,
 * finer `sub_status` (e.g. "InTransit_PickedUp", "Exception_Returning") —
 * see https://api.17track.net/en/doc#main-status-of-the-shipping-process.
 * Two sub-statuses get pulled out into their own TrackingStatus because our
 * pipeline treats them as materially different milestones from their parent
 * main status: InTransit_PickedUp -> PickedUp, and Exception_Returning /
 * Exception_Returned -> Returned (17TRACK has no separate "Returned" main
 * status — a return is just an Exception sub-status).
 */
function normalizeTrack17Status(stage, subStatus) {
    if (subStatus === 'InTransit_PickedUp')
        return 'PickedUp';
    if (subStatus === 'Exception_Returning' || subStatus === 'Exception_Returned')
        return 'Returned';
    switch (stage) {
        case 'InfoReceived':
            return 'InfoReceived';
        case 'InTransit':
            return 'InTransit';
        // No direct equivalent in our 8-state model — closest fit is InTransit
        // (parcel reached a pickup point but hasn't started final-mile delivery
        // yet). Rare for the domestic Indian couriers this app maps; mainly
        // relevant to postal/PUDO-style carriers.
        case 'AvailableForPickup':
            return 'InTransit';
        case 'OutForDelivery':
            return 'OutForDelivery';
        case 'DeliveryFailure':
            return 'DeliveryFailed';
        case 'Delivered':
            return 'Delivered';
        case 'Exception':
            return 'Exception';
        // Stuck in transit far longer than expected — surface it for review
        // rather than silently dropping it.
        case 'Expired':
            return 'Exception';
        // Query succeeded but 17TRACK has nothing on this number yet — not an
        // event worth recording.
        case 'NotFound':
        default:
            return null;
    }
}
const SIMULATION_TIMELINE = [
    { status: 'PickedUp', description: 'Shipment picked up from seller', location: 'Seller Warehouse', delayMinutes: 1 },
    { status: 'InTransit', description: 'Arrived at origin sorting facility', location: 'Origin Hub', delayMinutes: 2 },
    { status: 'InTransit', description: 'Departed origin facility', location: 'Origin Hub', delayMinutes: 3 },
    { status: 'InTransit', description: 'In transit to destination city', location: 'En Route', delayMinutes: 4 },
    { status: 'InTransit', description: 'Arrived at destination hub', location: 'Destination Hub', delayMinutes: 6 },
    { status: 'InTransit', description: 'Shipment processed at destination facility', location: 'Destination Hub', delayMinutes: 7 },
    { status: 'OutForDelivery', description: 'Out for delivery', location: 'Local Delivery Center', delayMinutes: 9 },
    { status: 'Delivered', description: 'Delivered — signed by recipient', location: 'Delivery Address', delayMinutes: 11 },
];
function generateSimulationEvents(sinceTime) {
    return SIMULATION_TIMELINE.map((evt) => ({
        status: evt.status,
        description: evt.description,
        location: evt.location,
        eventTime: new Date(sinceTime.getTime() + evt.delayMinutes * 60 * 1000),
    }));
}
// ---------------------------------------------------------------------------
// 17TRACK API client (real mode)
//
// REST API, key facts this file relies on (confirmed against current 17TRACK
// docs at https://api.17track.net/en/doc at the time this was written —
// re-check there if requests start failing, since third-party API shapes do
// change):
//   - Auth: a single header `17token: <key>` on every request (no per-request
//     signature, unlike KeyDelivery's MD5 signature scheme). Get the key at
//     https://api.17track.net/admin/settings after signing up.
//   - POST /track/v2.4/register — registers one or more tracking numbers.
//     Body is an ARRAY of { number, carrier? }. Response has
//     data.accepted[] / data.rejected[]; a rejected entry with error.code
//     -18019901 means "already registered" (treat as success), -18019903
//     means the carrier couldn't be detected (treat as not-found). Carrier
//     codes are a FIXED public list (not account-specific like KeyDelivery's
//     carrier_id) — see TRACK17_CARRIER_CODES below — so there's no
//     per-account carrier-ID lookup step to do after signup.
//   - POST /track/v2.4/gettrackinfo — fetches the current timeline for
//     already-registered numbers, used by the polling cron as the "GET"
//     equivalent. ⚠️ This endpoint's exact request/response shape wasn't
//     confirmed against a live account when this was written (assumed to
//     follow the same array-of-{number,carrier} request shape as every
//     other v2.4 endpoint, and the same accepted[].track_info.tracking
//     .providers[].events[] response shape 17TRACK's own docs point to for
//     reading events — see "How to get delivery time" in their API doc).
//     Log the raw response once against a real registered number and adjust
//     mapTrack17ItemToEvents() below if the field names differ.
//   - Webhook: configured ONCE as a single URL in the 17TRACK dashboard
//     (Settings page) — NOT passed per-request like KeyDelivery's
//     webhook_url. 17TRACK doesn't sign its webhook payloads either, so we
//     keep the same shared-secret-token-in-query-string scheme this file
//     already used for KeyDelivery (see verifyTrack17WebhookToken below) —
//     register https://api.yourapp.com/api/v1/orders/webhooks/track17?token=<TRACKING_WEBHOOK_TOKEN>
//     as that one dashboard URL. Payload shape on a TRACKING_UPDATED push:
//     { "event": "TRACKING_UPDATED", "data": { "accepted": [ ...same shape
//     as a /gettrackinfo accepted item... ] } } — can contain MULTIPLE
//     tracking numbers per call, unlike KeyDelivery's one-per-call payload.
//   - Rate limit: 3 requests/second account-wide. The cron already awaits
//     each shipment sequentially, so this is only a concern with a very
//     large number of non-terminal shipments syncing in one cycle.
// ---------------------------------------------------------------------------
const TRACK17_BASE_URL = 'https://api.17track.net/track/v2.4';
/**
 * CarrierCode -> 17TRACK's numeric carrier code. This is 17TRACK's public,
 * fixed carrier list (https://res.17track.net/asset/carrier/info/apicarrier.all.json)
 * — unlike KeyDelivery's account-specific carrier_id, these values are the
 * same for every 17TRACK account, so there's nothing to look up after
 * signup. OTHER has no fixed code — 17TRACK auto-detects the carrier from
 * the AWB's format instead (see verifyAwbWithProvider).
 */
const TRACK17_CARRIER_CODES = {
    DELHIVERY: 100060,
    BLUEDART: 100055,
    DTDC: 100069,
    INDIA_POST: 9021,
    EKART: 100056,
    XPRESSBEES: 100101,
    SHADOWFAX: 100102,
    ECOM_EXPRESS: 100099,
    PROFESSIONAL: 100279,
};
function getTrack17CarrierCode(carrierCode) {
    return TRACK17_CARRIER_CODES[carrierCode] ?? null;
}
/** Reverse lookup — a 17TRACK numeric carrier code back to one of our CarrierCodes, for logging/mismatch messages. */
function findCarrierCodeByTrack17Code(track17Code) {
    const entry = Object.entries(TRACK17_CARRIER_CODES).find(([, v]) => v === track17Code);
    return entry?.[0] || null;
}
async function track17Request(path, body) {
    const token = env_1.env.tracking.apiKey;
    if (!token) {
        return { ok: false, status: 0, message: 'Tracking provider not configured (TRACK17_API_KEY unset)' };
    }
    try {
        const res = await fetch(`${TRACK17_BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', '17token': token },
            body: JSON.stringify(body),
        });
        const parsed = (await res.json().catch(() => null));
        if (!parsed)
            return { ok: false, status: res.status, message: `Non-JSON response (HTTP ${res.status})` };
        // 17TRACK's top-level `code` is 0 for a processed request even when some
        // individual numbers inside it were rejected (those live in
        // data.rejected[] instead) — a non-zero top-level code means the whole
        // request was malformed/unauthorized, not just one number.
        if (parsed.code === 0)
            return { ok: true, body: parsed };
        return { ok: false, status: parsed.code, message: `17TRACK error ${parsed.code}` };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, status: 0, message };
    }
}
function mapTrack17ItemToEvents(item) {
    const providers = item.track_info?.tracking?.providers ?? [];
    const events = providers.flatMap((p) => p.events ?? []);
    return events
        .map((e) => {
        const status = normalizeTrack17Status(e.stage, e.sub_status);
        const timeStr = e.time_iso || e.time_utc;
        if (!status || !timeStr)
            return null;
        const eventTime = new Date(timeStr);
        if (Number.isNaN(eventTime.getTime()))
            return null;
        return {
            status,
            description: e.description || e.sub_status || e.stage || 'Status update',
            location: e.location || e.address || null,
            eventTime,
            raw: e,
        };
    })
        .filter((e) => e !== null)
        .sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
}
/**
 * Registers (or, if already registered, confirms) one tracking number with
 * 17TRACK — this is our combined "detect + create" step, replacing
 * KeyDelivery's separate /carriers/detect + /tracking/create calls.
 * Pass `carrier17Code: undefined` to let 17TRACK auto-detect (used for our
 * OTHER carrierCode — a local/unlisted courier).
 */
async function track17Register(carrier17Code, trackingNumber) {
    const body = [{ number: trackingNumber, ...(carrier17Code ? { carrier: carrier17Code } : {}) }];
    const result = await track17Request('/register', body);
    if (!result.ok) {
        logger_1.default.warn(`17TRACK register failed for ${trackingNumber}: ${result.message}`);
        return { outcome: 'error', message: result.message };
    }
    const accepted = result.body.data?.accepted?.[0];
    if (accepted)
        return { outcome: 'found', carrier: accepted.carrier };
    const rejected = result.body.data?.rejected?.[0];
    if (rejected?.error?.code === -18019901) {
        // Already registered previously — not an error, gettrackinfo already has
        // what we need. 17TRACK's error message doesn't repeat the carrier code
        // on this particular error, so fall back to what we asked for.
        return { outcome: 'found', carrier: rejected.carrier || carrier17Code || 0 };
    }
    if (rejected?.error?.code === -18019903) {
        return { outcome: 'not_found' };
    }
    return { outcome: 'error', message: rejected?.error?.message || 'Unknown 17TRACK error' };
}
/** Fetches the current stored timeline for an already-registered number. Used by the cron; the webhook covers push updates. */
async function track17GetTrackInfo(carrier17Code, trackingNumber) {
    const result = await track17Request('/gettrackinfo', [
        { number: trackingNumber, carrier: carrier17Code },
    ]);
    if (!result.ok) {
        logger_1.default.warn(`17TRACK gettrackinfo failed for ${trackingNumber}: ${result.message}`);
        return null;
    }
    return result.body.data?.accepted?.[0] ?? null;
}
async function verifyAwbWithProvider(carrierCode, awb, _carrierName) {
    if (env_1.env.tracking.simulate) {
        // Development/testing only (TRACKING_SIMULATE=true) — never used when a
        // real provider key is configured.
        return { outcome: 'verified', verifiedCarrierCode: carrierCode };
    }
    if (!env_1.env.tracking.apiKey) {
        return { outcome: 'deferred', reason: 'Tracking provider not configured' };
    }
    const mapped17Code = getTrack17CarrierCode(carrierCode);
    if (carrierCode !== 'OTHER' && !mapped17Code) {
        return { outcome: 'deferred', reason: `No 17TRACK carrier code mapped for ${carrierCode}` };
    }
    // For OTHER (a local/unlisted courier) pass no carrier code at all and let
    // 17TRACK's auto-detection have a go at it.
    const result = await track17Register(mapped17Code ?? undefined, awb);
    if (result.outcome === 'not_found')
        return { outcome: 'not_found' };
    if (result.outcome === 'error')
        return { outcome: 'deferred', reason: result.message };
    // Found — but if we asked for a specific carrier and 17TRACK's own
    // detection/correction landed on a different one, that's the seller's
    // carrier selection looking wrong rather than a hard failure (mirrors
    // KeyDelivery's carrierMatchesDetected() mismatch check).
    if (carrierCode !== 'OTHER' && mapped17Code && result.carrier !== mapped17Code) {
        const detectedCode = findCarrierCodeByTrack17Code(result.carrier);
        const detectedName = detectedCode ? getCarrier(detectedCode)?.name || detectedCode : `17TRACK carrier ${result.carrier}`;
        return { outcome: 'mismatch', detectedCarrierNames: [detectedName] };
    }
    return { outcome: 'verified', verifiedCarrierCode: String(result.carrier) };
}
function mergeRiskFlags(existing, additions) {
    return Array.from(new Set([...existing, ...additions]));
}
const TIME_BASED_RISK_FLAGS = [shipment_constants_1.RISK_FLAGS.PICKUP_OVERDUE, shipment_constants_1.RISK_FLAGS.STALE_NO_MOVEMENT];
/**
 * Time-based risk checks that don't depend on new events arriving this
 * cycle. Anchored on createdAt/pickupConfirmedAt rather than updatedAt,
 * since updatedAt gets bumped on every sync — anchoring on it would keep
 * resetting the grace-period clock even when nothing relevant changed.
 * Unlike event-driven flags, these two can also clear (pickup arrives,
 * movement resumes) — callers recompute them fresh each cycle rather than
 * merging them in permanently.
 */
function checkTimeBasedRisk(shipment) {
    const flags = [];
    const now = Date.now();
    if (shipment_constants_1.TERMINAL_SHIPMENT_STATUSES.includes(shipment.status))
        return flags;
    if (!shipment.pickupConfirmedAt && shipment.verified) {
        const hoursSinceCreated = (now - shipment.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated > shipment_constants_1.PICKUP_GRACE_HOURS)
            flags.push(shipment_constants_1.RISK_FLAGS.PICKUP_OVERDUE);
    }
    const movementReference = shipment.pickupConfirmedAt ?? shipment.createdAt;
    const hoursSinceMovement = (now - movementReference.getTime()) / (1000 * 60 * 60);
    if (hoursSinceMovement > shipment_constants_1.STALE_SHIPMENT_HOURS)
        flags.push(shipment_constants_1.RISK_FLAGS.STALE_NO_MOVEMENT);
    return flags;
}
/**
 * Applies a batch of provider-reported events to a shipment: persists new
 * ShipmentEvents (deduped), advances Shipment.status and Order.status
 * (courier is the only source of truth for both — this is the one place in
 * the codebase allowed to set them), confirms pickup/delivery, raises risk
 * flags, writes the audit trail, and notifies the buyer. Used by both the
 * polling cron and the webhook handler so they can never drift apart.
 */
async function applyProviderEvents(params) {
    const { order, existingEventKeys, rawEvents, source } = params;
    const shipment = params.shipment;
    const newEvents = rawEvents.filter((e) => !existingEventKeys.has(`${e.status}|${e.eventTime.toISOString()}|${e.description}`));
    // Event-driven flags persist once raised (only an admin review clears
    // them); time-based ones are recomputed fresh below and can also clear.
    const stickyFlags = new Set(shipment.riskFlags.filter((f) => !TIME_BASED_RISK_FLAGS.includes(f)));
    let nextStatus = shipment.status;
    let pickupConfirmedAt = shipment.pickupConfirmedAt;
    let deliveredAt = shipment.deliveredAt;
    let deliverySource = shipment.deliverySource;
    let deliveryEvidence = shipment.deliveryEvidence;
    let priorMeaningfulEventCount = await prisma_1.default.shipmentEvent.count({
        where: { shipmentId: shipment.id, status: { not: 'InfoReceived' } },
    });
    const auditEntries = [];
    if (!shipment_constants_1.TERMINAL_SHIPMENT_STATUSES.includes(shipment.status)) {
        for (const evt of newEvents) {
            const mapped = TRACKING_STATUS_TO_SHIPMENT_STATUS[evt.status];
            const currentRank = shipment_constants_1.SHIPMENT_STATUS_RANK[nextStatus];
            const mappedRank = shipment_constants_1.SHIPMENT_STATUS_RANK[mapped];
            if (mappedRank < currentRank)
                continue; // never downgrade
            if (mapped === 'PICKUP_CONFIRMED' && !pickupConfirmedAt) {
                pickupConfirmedAt = evt.eventTime;
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.PICKUP_CONFIRMED, previousState: nextStatus, newState: mapped, metadata: { eventTime: evt.eventTime } });
            }
            if (mapped === 'DELIVERED' && !deliveredAt) {
                deliveredAt = evt.eventTime;
                deliverySource = source;
                // deliveryEvidence is later written back with `data: { deliveryEvidence }`
                // in a **read** (JsonValue) shaped variable, not Prisma's write-input
                // type — casting through InputJsonValue mismatches structurally
                // (InputJsonObject values may be `undefined`, which JsonObject
                // disallows), which is what TS2322 was complaining about.
                deliveryEvidence = evt.raw ?? null;
                if (priorMeaningfulEventCount < 2)
                    stickyFlags.add(shipment_constants_1.RISK_FLAGS.DELIVERED_WITHOUT_HISTORY);
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.DELIVERED, previousState: nextStatus, newState: mapped, metadata: { eventTime: evt.eventTime, source } });
            }
            else if (mapped === 'OUT_FOR_DELIVERY' && nextStatus !== 'OUT_FOR_DELIVERY') {
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.OUT_FOR_DELIVERY, previousState: nextStatus, newState: mapped });
            }
            else if (mapped === 'DELIVERY_FAILED') {
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.DELIVERY_FAILED, previousState: nextStatus, newState: mapped });
            }
            else if (mapped === 'RETURNED') {
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.RETURNED, previousState: nextStatus, newState: mapped });
            }
            else if (mapped !== nextStatus) {
                auditEntries.push({ action: shipment_constants_1.AUDIT_ACTIONS.TRACKING_UPDATED, previousState: nextStatus, newState: mapped });
            }
            nextStatus = mapped;
            if (evt.status !== 'InfoReceived')
                priorMeaningfulEventCount += 1;
        }
    }
    const timeBasedFlags = checkTimeBasedRisk({ status: nextStatus, createdAt: shipment.createdAt, pickupConfirmedAt, verified: shipment.verified });
    const finalRiskFlags = mergeRiskFlags(Array.from(stickyFlags), timeBasedFlags);
    const updatedShipmentData = {
        status: nextStatus,
        pickupConfirmedAt,
        deliveredAt,
        deliverySource,
        deliveryEvidence: (deliveryEvidence ?? undefined),
        lastSyncedAt: new Date(),
        lastSyncError: null,
        syncFailureCount: 0,
        riskFlags: finalRiskFlags,
        flaggedForReview: shipment.flaggedForReview || finalRiskFlags.length > 0,
    };
    const savedShipment = newEvents.length > 0
        ? await prisma_1.default.$transaction(async (tx) => {
            await tx.shipmentEvent.createMany({
                data: newEvents.map((e) => ({
                    id: crypto_1.default.randomUUID(),
                    orderId: order.id,
                    shipmentId: shipment.id,
                    status: e.status,
                    description: e.description,
                    location: e.location,
                    eventTime: e.eventTime,
                    source,
                    raw: e.raw,
                })),
            });
            return tx.shipment.update({ where: { id: shipment.id }, data: updatedShipmentData });
        })
        : await prisma_1.default.shipment.update({ where: { id: shipment.id }, data: updatedShipmentData });
    // --- Advance the coarser Order.status to match, never downgrading, and
    // never overriding a status that must go through its own dedicated flow
    // (CANCELLED, DISPUTED — except the one documented DISPUTED -> RETURNED
    // exception, since a courier-confirmed return is meaningful new evidence
    // even for a disputed order). ---
    const targetOrderStatus = shipment_constants_1.SHIPMENT_STATUS_TO_ORDER_STATUS[nextStatus];
    let orderStatusChanged = false;
    if (order.status === 'DISPUTED' && nextStatus === 'RETURNED') {
        await prisma_1.default.order.update({
            where: { id: order.id },
            data: {
                status: 'RETURNED',
                lastTrackingSync: new Date(),
                statusHistory: { create: { status: 'RETURNED', note: 'Courier confirmed return while order was under dispute review' } },
            },
        });
        orderStatusChanged = true;
    }
    else if (targetOrderStatus && order.status !== 'CANCELLED' && order.status !== 'DISPUTED') {
        const currentRank = shipment_constants_1.ORDER_STATUS_RANK[order.status];
        const targetRank = shipment_constants_1.ORDER_STATUS_RANK[targetOrderStatus];
        if (targetRank > currentRank) {
            await prisma_1.default.order.update({
                where: { id: order.id },
                data: {
                    status: targetOrderStatus,
                    trackingCarrier: savedShipment.carrierCode,
                    trackingNumber: savedShipment.awb,
                    lastTrackingSync: new Date(),
                    statusHistory: {
                        create: { status: targetOrderStatus, note: `Auto-updated from courier tracking (${source === 'SIMULATION' ? 'simulation' : '17TRACK'})` },
                    },
                },
            });
            orderStatusChanged = true;
        }
    }
    if (!orderStatusChanged) {
        await prisma_1.default.order.update({ where: { id: order.id }, data: { lastTrackingSync: new Date() } });
    }
    for (const entry of auditEntries) {
        // eslint-disable-next-line no-await-in-loop
        await (0, auditLog_service_1.recordAudit)({
            orderId: order.id,
            shipmentId: shipment.id,
            action: entry.action,
            source: 'COURIER',
            previousState: entry.previousState,
            newState: entry.newState,
            metadata: entry.metadata,
        });
    }
    if (newEvents.length > 0) {
        const latest = newEvents[newEvents.length - 1];
        (0, socket_1.emitOrderUpdate)({ ...order, status: orderStatusChanged ? (targetOrderStatus ?? order.status) : order.status });
        (0, notification_service_1.notifyUser)({
            userId: order.userId,
            type: 'ORDER_STATUS',
            title: `Order ${order.orderNumber} — ${latest.description}`,
            message: `Your shipment status: ${latest.description}${latest.location ? ` (${latest.location})` : ''}`,
            relatedEntityType: 'ORDER',
            relatedEntityId: order.id,
        }).catch(() => { });
    }
}
/**
 * Periodically polls (or, when a webhook already delivered the update,
 * re-confirms) tracking for one order's shipment. Called by the tracking
 * cron for every non-terminal shipment; safe to call more often since it's
 * fully idempotent (dedupes on status+time+description).
 */
async function syncTracking(orderId) {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            shipment: { include: { events: true } },
            items: { include: { product: { select: { sellerId: true } } } },
        },
    });
    if (!order || !order.shipment)
        return;
    const shipment = order.shipment;
    if (shipment_constants_1.TERMINAL_SHIPMENT_STATUSES.includes(shipment.status))
        return;
    if (order.status === 'CANCELLED')
        return;
    const existingEventKeys = new Set(shipment.events.map((e) => `${e.status}|${e.eventTime.toISOString()}|${e.description}`));
    // If the AWB never got verified at submission time (provider was down, no
    // carrier code was mapped yet, or this seller submitted before a key was
    // configured), retry verification here before attempting to fetch a
    // timeline — 17TRACK can't report status on a tracking it was never told
    // to register.
    if (!shipment.verified) {
        if (shipment.verificationAttempts >= shipment_constants_1.MAX_VERIFICATION_ATTEMPTS)
            return;
        const result = await verifyAwbWithProvider(shipment.carrierCode, shipment.awb, shipment.carrierName ?? undefined);
        if (result.outcome === 'verified') {
            await prisma_1.default.shipment.update({
                where: { id: shipment.id },
                data: {
                    verified: true,
                    verifiedCarrierCode: result.verifiedCarrierCode,
                    verificationAttempts: { increment: 1 },
                    lastVerificationError: null,
                    status: shipment.status === 'AWB_SUBMITTED' ? 'AWB_VERIFIED' : shipment.status,
                },
            });
            await (0, auditLog_service_1.recordAudit)({ orderId, shipmentId: shipment.id, action: shipment_constants_1.AUDIT_ACTIONS.AWB_VERIFIED, source: 'SYSTEM', newState: 'AWB_VERIFIED' });
            shipment.verified = true;
            shipment.status = shipment.status === 'AWB_SUBMITTED' ? 'AWB_VERIFIED' : shipment.status;
        }
        else {
            await prisma_1.default.shipment.update({
                where: { id: shipment.id },
                data: {
                    verificationAttempts: { increment: 1 },
                    lastVerificationError: result.outcome === 'deferred' ? result.reason : result.outcome,
                    flaggedForReview: result.outcome !== 'deferred' ? true : shipment.flaggedForReview,
                    riskFlags: result.outcome === 'not_found'
                        ? mergeRiskFlags(shipment.riskFlags, [shipment_constants_1.RISK_FLAGS.AWB_NOT_FOUND])
                        : result.outcome === 'mismatch'
                            ? mergeRiskFlags(shipment.riskFlags, [shipment_constants_1.RISK_FLAGS.CARRIER_MISMATCH])
                            : mergeRiskFlags(shipment.riskFlags, [shipment_constants_1.RISK_FLAGS.PROVIDER_UNAVAILABLE]),
                },
            });
            return; // nothing further to sync until it's verified
        }
    }
    let rawEvents;
    const source = env_1.env.tracking.simulate ? 'SIMULATION' : 'TRACKING_API';
    if (env_1.env.tracking.simulate) {
        const since = shipment.createdAt;
        rawEvents = generateSimulationEvents(since)
            .filter((e) => e.eventTime <= new Date())
            .map((e) => ({ ...e, raw: { description: e.description, time_iso: e.eventTime.toISOString(), location: e.location } }));
    }
    else {
        const carrier17Code = shipment.verifiedCarrierCode ? Number(shipment.verifiedCarrierCode) : getTrack17CarrierCode(shipment.carrierCode);
        if (!carrier17Code) {
            await prisma_1.default.shipment.update({
                where: { id: shipment.id },
                data: {
                    syncFailureCount: { increment: 1 },
                    lastSyncError: `No 17TRACK carrier code available for ${shipment.carrierCode}`,
                    lastSyncedAt: new Date(),
                },
            });
            return;
        }
        const item = await track17GetTrackInfo(carrier17Code, shipment.awb);
        if (!item) {
            const failures = shipment.syncFailureCount + 1;
            await prisma_1.default.shipment.update({
                where: { id: shipment.id },
                data: {
                    syncFailureCount: { increment: 1 },
                    lastSyncError: 'Tracking provider returned no data for this AWB',
                    lastSyncedAt: new Date(),
                    ...(failures >= shipment_constants_1.MAX_SYNC_FAILURES_BEFORE_FLAG
                        ? { flaggedForReview: true, riskFlags: mergeRiskFlags(shipment.riskFlags, [shipment_constants_1.RISK_FLAGS.TRACKING_API_INCONSISTENT]) }
                        : {}),
                },
            });
            if (failures >= shipment_constants_1.MAX_SYNC_FAILURES_BEFORE_FLAG) {
                await (0, auditLog_service_1.recordAudit)({ orderId, shipmentId: shipment.id, action: shipment_constants_1.AUDIT_ACTIONS.SYNC_FAILED, source: 'SYSTEM', metadata: { failures } });
            }
            return;
        }
        rawEvents = mapTrack17ItemToEvents(item);
    }
    if (rawEvents.length === 0) {
        // Nothing new, but still worth refreshing time-based risk flags (pickup
        // overdue / stale) and the sync timestamp.
        const timeBasedFlags = checkTimeBasedRisk(shipment);
        const stickyFlags = shipment.riskFlags.filter((f) => !TIME_BASED_RISK_FLAGS.includes(f));
        await prisma_1.default.shipment.update({
            where: { id: shipment.id },
            data: { lastSyncedAt: new Date(), riskFlags: mergeRiskFlags(stickyFlags, timeBasedFlags) },
        });
        return;
    }
    await applyProviderEvents({ order: order, shipment, existingEventKeys, rawEvents, source });
}
// ---------------------------------------------------------------------------
// 17TRACK webhook (requirement #7 — prefer webhooks when available, keep the
// cron as the fallback either way)
// ---------------------------------------------------------------------------
/**
 * 17TRACK's webhook payload carries no signature at all (same situation as
 * KeyDelivery), so we authenticate it ourselves: the ONE webhook URL
 * registered in the 17TRACK dashboard (see .env.example) includes a
 * shared-secret token as a query param (TRACKING_WEBHOOK_TOKEN), and the
 * route handler passes that query param in here for a constant-time
 * comparison.
 */
function verifyTrack17WebhookToken(token) {
    const expected = env_1.env.tracking.webhookToken;
    if (!expected || !token)
        return false;
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    }
    catch {
        return false; // length mismatch etc. — definitely not equal
    }
}
/**
 * Handles one 17TRACK webhook delivery. Unlike KeyDelivery's one-
 * tracking-number-per-call payload, 17TRACK's TRACKING_UPDATED event can
 * batch multiple numbers into a single call (data.accepted[]), so this
 * loops over each one and applies it through the exact same pipeline the
 * cron uses. Non-tracking events (e.g. quota notices) are acknowledged and
 * ignored.
 */
async function handleTrack17WebhookPayload(body) {
    const payload = body;
    if (payload.event !== 'TRACKING_UPDATED' || !payload.data?.accepted?.length) {
        return { handled: true, reason: 'Not a tracking update — acknowledged and ignored.' };
    }
    for (const item of payload.data.accepted) {
        // eslint-disable-next-line no-await-in-loop
        await (async () => {
            const normalizedAwb = normalizeAwb(item.number);
            const shipmentWithOrder = await prisma_1.default.shipment.findFirst({
                where: { normalizedAwb },
                orderBy: { createdAt: 'desc' },
                include: { events: true, order: { include: { items: { include: { product: { select: { sellerId: true } } } } } } },
            });
            if (!shipmentWithOrder) {
                logger_1.default.warn(`17TRACK webhook: no shipment found for AWB ${item.number}`);
                return;
            }
            if (shipment_constants_1.TERMINAL_SHIPMENT_STATUSES.includes(shipmentWithOrder.status) || shipmentWithOrder.order.status === 'CANCELLED') {
                return;
            }
            const existingEventKeys = new Set(shipmentWithOrder.events.map((e) => `${e.status}|${e.eventTime.toISOString()}|${e.description}`));
            const rawEvents = mapTrack17ItemToEvents(item);
            if (rawEvents.length === 0)
                return;
            let verified = shipmentWithOrder.verified;
            let verifiedCarrierCode = shipmentWithOrder.verifiedCarrierCode;
            let status = shipmentWithOrder.status;
            if (!verified) {
                // Webhook arrived before our own verification retry did — trust it
                // (the provider is explicitly telling us this AWB exists) and mark
                // verified using whatever carrier it reports.
                verified = true;
                verifiedCarrierCode = String(item.carrier);
                status = 'AWB_VERIFIED';
                await prisma_1.default.shipment.update({ where: { id: shipmentWithOrder.id }, data: { verified, verifiedCarrierCode, status } });
            }
            const { order, events: _events, ...shipmentFields } = shipmentWithOrder;
            void _events;
            await applyProviderEvents({
                order: order,
                shipment: { ...shipmentFields, verified, verifiedCarrierCode, status },
                existingEventKeys,
                rawEvents,
                source: 'TRACKING_API',
            });
        })();
    }
    return { handled: true };
}
// ---------------------------------------------------------------------------
// Public API: get timeline for an order (unchanged)
// ---------------------------------------------------------------------------
async function getTrackingTimeline(orderId) {
    const events = await prisma_1.default.shipmentEvent.findMany({
        where: { orderId },
        orderBy: { eventTime: 'asc' },
    });
    return events;
}
//# sourceMappingURL=tracking.service.js.map