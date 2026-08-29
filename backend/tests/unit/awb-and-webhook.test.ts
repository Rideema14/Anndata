import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAwb, isPlausibleAwbFormat, getCarrier, getTrackingUrl, CARRIER_CODES } from '../../src/modules/order/tracking.service';

describe('normalizeAwb', () => {
  it('trims, uppercases, and strips internal whitespace', () => {
    assert.equal(normalizeAwb('  abc 123 def  '), 'ABC123DEF');
  });

  it('is idempotent', () => {
    const once = normalizeAwb('dtdc-9988776655');
    assert.equal(normalizeAwb(once), once);
  });
});

describe('isPlausibleAwbFormat', () => {
  it('rejects empty input', () => {
    assert.equal(isPlausibleAwbFormat(''), false);
  });

  it('rejects too-short input (under 6 chars)', () => {
    assert.equal(isPlausibleAwbFormat('AB12'), false);
  });

  it('rejects too-long input (over 40 chars)', () => {
    assert.equal(isPlausibleAwbFormat('A'.repeat(41)), false);
  });

  it('rejects malformed characters (spaces, punctuation other than hyphen)', () => {
    assert.equal(isPlausibleAwbFormat('ABC 123'), false);
    assert.equal(isPlausibleAwbFormat('ABC@123'), false);
    assert.equal(isPlausibleAwbFormat('ABC#123!'), false);
  });

  it('accepts a plausible alphanumeric AWB', () => {
    assert.equal(isPlausibleAwbFormat('DTDC1234567890'), true);
  });

  it('accepts hyphens (some carriers use dashed docket numbers)', () => {
    assert.equal(isPlausibleAwbFormat('DL-2026-998877'), true);
  });
});

describe('carrier lookup', () => {
  it('every entry in CARRIER_CODES resolves via getCarrier', () => {
    for (const code of CARRIER_CODES) {
      const carrier = getCarrier(code);
      assert.ok(carrier, `expected a carrier entry for ${code}`);
      assert.equal(carrier?.code, code);
    }
  });

  it('returns undefined for an unknown carrier code', () => {
    assert.equal(getCarrier('NOT_A_REAL_CARRIER'), undefined);
  });

  it('builds a tracking URL for a known carrier', () => {
    const url = getTrackingUrl('DTDC', 'ABC123456');
    assert.ok(url.includes('ABC123456'));
    assert.ok(url.startsWith('https://'));
  });

  it('returns an empty string for OTHER (no official tracking page)', () => {
    assert.equal(getTrackingUrl('OTHER', 'ANYTHING'), '');
  });

  it('returns an empty string for an unknown carrier code', () => {
    assert.equal(getTrackingUrl('NOT_A_REAL_CARRIER', 'ANYTHING'), '');
  });
});

// TRACKINGMORE_WEBHOOK_SECRET must be set before tracking.service.ts is
// first imported (env.ts reads it once at module-load time) — set it here,
// at the very top of the file's execution, before the static imports above
// are evaluated... which is too late for a fixed value set inline like
// this. Configure it in the test *environment* instead (see tests/README.md
// — e.g. `TRACKINGMORE_WEBHOOK_SECRET=test-secret@example.com npm test`),
// and these tests confirm the signing math against whatever secret that is.
describe('verifyTrackingMoreWebhookSignature', () => {
  const secret = process.env.TRACKINGMORE_WEBHOOK_SECRET;

  it('is only meaningfully testable with TRACKINGMORE_WEBHOOK_SECRET set in the test environment', () => {
    if (!secret) {
      console.log('  (skipping signature assertions — TRACKINGMORE_WEBHOOK_SECRET not set for this test run)');
    }
    assert.ok(true);
  });

  it('rejects a payload missing timeStr/signature', { skip: !secret }, async () => {
    const { verifyTrackingMoreWebhookSignature } = await import('../../src/modules/order/tracking.service');
    assert.equal(verifyTrackingMoreWebhookSignature({}), false);
  });

  it('accepts a correctly-signed payload: HMAC-SHA256(timeStr, secret)', { skip: !secret }, async () => {
    const crypto = await import('node:crypto');
    const { verifyTrackingMoreWebhookSignature } = await import('../../src/modules/order/tracking.service');
    const timeStr = String(Math.floor(Date.now() / 1000));
    const signature = crypto.createHmac('sha256', secret as string).update(timeStr).digest('hex');
    assert.equal(verifyTrackingMoreWebhookSignature({ timeStr, signature }), true);
  });

  it('rejects a tampered signature', { skip: !secret }, async () => {
    const { verifyTrackingMoreWebhookSignature } = await import('../../src/modules/order/tracking.service');
    assert.equal(verifyTrackingMoreWebhookSignature({ timeStr: String(Date.now()), signature: 'deadbeef' }), false);
  });
});
