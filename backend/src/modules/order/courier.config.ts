// Centralized delivery-platform (courier) configuration — requirement #4/#31.
// Every AWB validation rule and tracking-URL template lives HERE and only
// here. The seller shipment form, buyer order details, admin order
// details, and the backend validator (submitShipmentSchema in
// order.validation.ts) all read from this single list — nothing else in
// the app should hardcode a carrier name, a validation regex, or a
// tracking URL.
//
// There is no third-party tracking API integration anymore (17TRACK has
// been fully removed). This module only validates AWB *shape* (catching
// obvious seller mistakes — empty, too short/long, wrong characters) and
// builds the official courier tracking link so a human (buyer or admin)
// can go verify the shipment themselves. It never claims to know whether a
// package has actually been picked up, is in transit, or was delivered.

export interface CourierConfig {
  code: string;
  name: string;
  /** Minimum AWB length, after trimming/normalizing. */
  minLength: number;
  /** Maximum AWB length, after trimming/normalizing. */
  maxLength: number;
  /** Full validation pattern (applied to the normalized AWB). */
  pattern: RegExp;
  /** Human-readable description of the expected format, shown on validation errors. */
  formatHint: string;
  /** Official courier tracking page. */
  trackingBaseUrl: string;
  /** Whether `trackingBaseUrl` can be built into a direct, AWB-populated tracking link. */
  supportsDirectLink: boolean;
  /** Builds the direct tracking link for a given AWB — only meaningful when supportsDirectLink is true. */
  buildTrackingUrl: (awb: string) => string;
}

// Format rules below reflect each courier's real, publicly documented AWB
// conventions as of 2026 (Delhivery/Ekart/XpressBees/Shadowfax/Ecom
// Express: numeric waybills of a fixed length; Blue Dart: numeric airway
// bill; DTDC: alphanumeric consignment note; India Post: the universal
// 13-character international tracking format, 2 letters + 9 digits + 2
// letters, e.g. EE123456789IN; Professional Couriers: numeric docket
// number). These are deliberately loose (a length + character-class check,
// not a strict per-field checksum) — the goal is catching obvious seller
// mistakes, not re-implementing each courier's internal numbering scheme.
const NUMERIC = /^[0-9]+$/;
const ALPHANUMERIC = /^[A-Z0-9]+$/;
const INDIA_POST_FORMAT = /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/;

export const SUPPORTED_COURIERS: CourierConfig[] = [
  {
    code: 'DELHIVERY',
    name: 'Delhivery',
    minLength: 10,
    maxLength: 15,
    pattern: NUMERIC,
    formatHint: '10–15 digit numeric waybill number',
    trackingBaseUrl: 'https://www.delhivery.com/tracking',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.delhivery.com/tracking?uniqueIdentifier=${encodeURIComponent(awb)}`,
  },
  {
    code: 'BLUEDART',
    name: 'Blue Dart',
    minLength: 8,
    maxLength: 12,
    pattern: NUMERIC,
    formatHint: '8–12 digit numeric airway bill number',
    trackingBaseUrl: 'https://www.bluedart.com/tracking',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.bluedart.com/tracking/${encodeURIComponent(awb)}`,
  },
  {
    code: 'DTDC',
    name: 'DTDC',
    minLength: 8,
    maxLength: 15,
    pattern: ALPHANUMERIC,
    formatHint: '8–15 character alphanumeric consignment number',
    trackingBaseUrl: 'https://www.dtdc.in/tracking.asp',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}`,
  },
  {
    code: 'INDIA_POST',
    name: 'India Post (Speed Post)',
    minLength: 13,
    maxLength: 13,
    pattern: INDIA_POST_FORMAT,
    formatHint: '13-character format: 2 letters + 9 digits + 2 letters (e.g. EE123456789IN)',
    trackingBaseUrl: 'https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) =>
      `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?TrackConsignmentID=${encodeURIComponent(awb)}`,
  },
  {
    code: 'XPRESSBEES',
    name: 'XpressBees',
    minLength: 8,
    maxLength: 15,
    pattern: NUMERIC,
    formatHint: '8–15 digit numeric AWB number',
    trackingBaseUrl: 'https://www.xpressbees.com/shipment/tracking',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.xpressbees.com/shipment/tracking?awb=${encodeURIComponent(awb)}`,
  },
  {
    code: 'ECOM_EXPRESS',
    name: 'Ecom Express',
    minLength: 8,
    maxLength: 15,
    pattern: NUMERIC,
    formatHint: '8–15 digit numeric AWB number',
    trackingBaseUrl: 'https://www.ecomexpress.in/tracking/',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`,
  },
  {
    code: 'EKART',
    name: 'Ekart Logistics',
    minLength: 10,
    maxLength: 16,
    pattern: ALPHANUMERIC,
    formatHint: '10–16 character alphanumeric tracking ID',
    trackingBaseUrl: 'https://ekartlogistics.com/track',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://ekartlogistics.com/track/${encodeURIComponent(awb)}`,
  },
  {
    code: 'SHADOWFAX',
    name: 'Shadowfax',
    minLength: 6,
    maxLength: 20,
    pattern: ALPHANUMERIC,
    formatHint: '6–20 character alphanumeric tracking ID',
    trackingBaseUrl: 'https://tracker.shadowfax.in/',
    // Shadowfax's tracking page is a client-rendered SPA (hash route) that
    // doesn't reliably accept a deep-linked AWB — send the buyer/admin to
    // the tracking home page and show the AWB for them to paste in.
    supportsDirectLink: false,
    buildTrackingUrl: () => 'https://tracker.shadowfax.in/',
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional Couriers',
    minLength: 8,
    maxLength: 15,
    pattern: NUMERIC,
    formatHint: '8–15 digit numeric docket number',
    trackingBaseUrl: 'https://www.tpcindia.com/track.aspx',
    supportsDirectLink: true,
    buildTrackingUrl: (awb) => `https://www.tpcindia.com/track.aspx?id=${encodeURIComponent(awb)}`,
  },
  {
    code: 'OTHER',
    name: 'Other',
    minLength: 4,
    maxLength: 40,
    pattern: /^[A-Z0-9-]+$/,
    formatHint: '4–40 characters, letters/numbers/hyphens only',
    trackingBaseUrl: '',
    supportsDirectLink: false,
    buildTrackingUrl: () => '',
  },
];

// A real `as const` tuple (not derived via .map()) — z.enum() in
// order.validation.ts needs a literal tuple type, not a plain string[].
export const COURIER_CODES = [
  'DELHIVERY',
  'BLUEDART',
  'DTDC',
  'INDIA_POST',
  'XPRESSBEES',
  'ECOM_EXPRESS',
  'EKART',
  'SHADOWFAX',
  'PROFESSIONAL',
  'OTHER',
] as const;

export type CourierCode = (typeof COURIER_CODES)[number];

export function getCourier(code: string): CourierConfig | undefined {
  return SUPPORTED_COURIERS.find((c) => c.code === code);
}

/** Trims/uppercases/strips internal whitespace — the canonical form used for storage + duplicate-AWB comparison. */
export function normalizeAwb(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export interface AwbValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a normalized AWB against its courier's configured rules
 * (requirement #4): empty, too short/long, or the wrong character set are
 * all rejected here before anything ever touches the database. "OTHER"
 * gets a loose generic check since there's no real courier to validate
 * against.
 */
export function validateAwbFormat(courierCode: string, normalizedAwb: string): AwbValidationResult {
  const courier = getCourier(courierCode);
  if (!courier) return { valid: false, reason: 'Unknown courier selected.' };
  if (!normalizedAwb) return { valid: false, reason: 'AWB / tracking number cannot be empty.' };
  if (normalizedAwb.length < courier.minLength || normalizedAwb.length > courier.maxLength) {
    return { valid: false, reason: `${courier.name} AWB numbers must be ${courier.formatHint}.` };
  }
  if (!courier.pattern.test(normalizedAwb)) {
    return { valid: false, reason: `That doesn't look like a valid ${courier.name} AWB — expected ${courier.formatHint}.` };
  }
  return { valid: true };
}

/**
 * Builds the buyer/admin-facing tracking destination for a shipment
 * (requirement #9/#13/#31): a direct, AWB-populated link where the courier
 * supports one, otherwise the official tracking page with instructions to
 * paste the AWB in manually.
 */
export function getCourierTrackingLink(courierCode: string, awb: string): { url: string; isDirect: boolean } {
  const courier = getCourier(courierCode);
  if (!courier || !courier.trackingBaseUrl) return { url: '', isDirect: false };
  if (courier.supportsDirectLink) {
    return { url: courier.buildTrackingUrl(awb), isDirect: true };
  }
  return { url: courier.trackingBaseUrl, isDirect: false };
}

export const PUBLIC_COURIER_LIST = SUPPORTED_COURIERS.map((c) => ({ code: c.code, name: c.name }));
