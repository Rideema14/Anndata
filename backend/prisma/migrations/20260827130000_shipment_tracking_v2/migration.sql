-- Shipment tracking v2: dedicated Shipment/Dispute/ShipmentAuditLog entities,
-- courier-verified AWB flow, and delivery disputes.
--
-- The three legacy columns on "orders" (trackingCarrier, trackingNumber,
-- lastTrackingSync) are left in place and are kept in sync by the app from
-- "shipments" going forward, purely so existing reads of the Order object
-- don't change shape. "shipments" is the new source of truth.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

DO $$ BEGIN
  CREATE TYPE "ShipmentStatus" AS ENUM (
    'AWB_SUBMITTED',
    'AWB_VERIFIED',
    'PICKUP_CONFIRMED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_FAILED',
    'RETURNED',
    'EXCEPTION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "shipments" (
  "id"                     TEXT NOT NULL,
  "orderId"                TEXT NOT NULL,
  "sellerId"               TEXT,
  "carrierCode"            TEXT NOT NULL,
  "carrierName"            TEXT,
  "awb"                    TEXT NOT NULL,
  "normalizedAwb"          TEXT NOT NULL,
  "status"                 "ShipmentStatus" NOT NULL DEFAULT 'AWB_SUBMITTED',
  "verified"               BOOLEAN NOT NULL DEFAULT false,
  "verifiedCarrierCode"    TEXT,
  "verificationAttempts"   INTEGER NOT NULL DEFAULT 0,
  "lastVerificationError"  TEXT,
  "pickupConfirmedAt"      TIMESTAMP(3),
  "deliveredAt"            TIMESTAMP(3),
  "deliverySource"         TEXT,
  "deliveryEvidence"       JSONB,
  "lastSyncedAt"           TIMESTAMP(3),
  "lastSyncError"          TEXT,
  "syncFailureCount"       INTEGER NOT NULL DEFAULT 0,
  "flaggedForReview"       BOOLEAN NOT NULL DEFAULT false,
  "riskFlags"              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "riskNote"               TEXT,
  "metadata"               JSONB,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,

  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX IF NOT EXISTS "shipments_normalizedAwb_idx" ON "shipments"("normalizedAwb");
CREATE INDEX IF NOT EXISTS "shipments_carrierCode_idx" ON "shipments"("carrierCode");
CREATE INDEX IF NOT EXISTS "shipments_status_idx" ON "shipments"("status");
CREATE INDEX IF NOT EXISTS "shipments_sellerId_idx" ON "shipments"("sellerId");

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- disputes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "disputes" (
  "id"           TEXT NOT NULL,
  "orderId"      TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "reason"       TEXT NOT NULL,
  "details"      TEXT,
  "status"       "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedById" TEXT,
  "resolvedAt"   TIMESTAMP(3),
  "adminNote"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "disputes_orderId_idx" ON "disputes"("orderId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- shipment_audit_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "shipment_audit_logs" (
  "id"            TEXT NOT NULL,
  "orderId"       TEXT NOT NULL,
  "shipmentId"    TEXT,
  "action"        TEXT NOT NULL,
  "actorId"       TEXT,
  "actorRole"     TEXT,
  "source"        TEXT NOT NULL,
  "previousState" TEXT,
  "newState"      TEXT,
  "metadata"      JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shipment_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shipment_audit_logs_orderId_idx" ON "shipment_audit_logs"("orderId");
CREATE INDEX IF NOT EXISTS "shipment_audit_logs_shipmentId_idx" ON "shipment_audit_logs"("shipmentId");
CREATE INDEX IF NOT EXISTS "shipment_audit_logs_action_idx" ON "shipment_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "shipment_audit_logs_createdAt_idx" ON "shipment_audit_logs"("createdAt");

-- No FKs to orders/shipments here on purpose — this is an audit trail and
-- must remain queryable even if a related row is later removed (shipments
-- cascade-delete with their order; the log shouldn't).

-- ---------------------------------------------------------------------------
-- shipment_events: link to the new shipments table
-- ---------------------------------------------------------------------------

ALTER TABLE "shipment_events"
  ADD COLUMN IF NOT EXISTS "shipmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "raw" JSONB;

CREATE INDEX IF NOT EXISTS "shipment_events_shipmentId_idx" ON "shipment_events"("shipmentId");

DO $$ BEGIN
  ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey"
    FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Backfill: create a Shipment row for every existing order that already has
-- a trackingCarrier + trackingNumber, from the legacy flat columns. This is
-- real historical data carried forward, not synthetic/fake tracking data.
--
-- Best-effort choices, clearly marked so admins know to treat them as such:
--   * sellerId is guessed from the order's first line item (this app's
--     Order isn't split per-seller, so the true submitter can't be
--     reconstructed with certainty from the old schema).
--   * verification/pickup/delivery timestamps aren't available historically,
--     so pickupConfirmedAt/deliveredAt fall back to the order's updatedAt,
--     and every backfilled row is tagged with a 'LEGACY_BACKFILL' risk flag
--     (flagged for review only when it claims DELIVERED, so admins can spot
--     -check the ones that matter without flooding the queue with routine
--     in-flight orders).
-- ---------------------------------------------------------------------------

INSERT INTO "shipments" (
  "id", "orderId", "sellerId", "carrierCode", "carrierName", "awb", "normalizedAwb",
  "status", "verified", "pickupConfirmedAt", "deliveredAt", "deliverySource",
  "lastSyncedAt", "flaggedForReview", "riskFlags", "riskNote", "metadata",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  o."id",
  (
    SELECT p."sellerId" FROM "order_items" oi
    JOIN "products" p ON p."id" = oi."productId"
    WHERE oi."orderId" = o."id"
    ORDER BY oi."id" ASC
    LIMIT 1
  ),
  UPPER(REGEXP_REPLACE(TRIM(o."trackingCarrier"), '\s+', '_', 'g')),
  o."trackingCarrier",
  o."trackingNumber",
  UPPER(TRIM(o."trackingNumber")),
  CASE o."status"::text
    WHEN 'PROCESSING' THEN 'PICKUP_CONFIRMED'
    WHEN 'SHIPPED' THEN 'PICKUP_CONFIRMED'
    WHEN 'OUT_FOR_DELIVERY' THEN 'OUT_FOR_DELIVERY'
    WHEN 'DELIVERED' THEN 'DELIVERED'
    WHEN 'RETURNED' THEN 'RETURNED'
    ELSE 'AWB_SUBMITTED'
  END::"ShipmentStatus",
  o."status"::text IN ('PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'),
  CASE WHEN o."status"::text IN ('PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED')
    THEN o."updatedAt" ELSE NULL END,
  CASE WHEN o."status"::text = 'DELIVERED' THEN o."updatedAt" ELSE NULL END,
  CASE WHEN o."status"::text = 'DELIVERED' THEN 'LEGACY_BACKFILL' ELSE NULL END,
  o."lastTrackingSync",
  (o."status"::text = 'DELIVERED'),
  ARRAY['LEGACY_BACKFILL']::TEXT[],
  'Backfilled from orders.trackingCarrier/trackingNumber during the shipment-tracking-v2 migration — verify against courier records before treating pickup/delivery timestamps as authoritative.',
  jsonb_build_object('backfilledFrom', 'orders.trackingCarrier/trackingNumber', 'originalOrderStatus', o."status"::text),
  o."createdAt",
  o."updatedAt"
FROM "orders" o
WHERE o."trackingNumber" IS NOT NULL
  AND o."trackingCarrier" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "shipments" s WHERE s."orderId" = o."id");

-- Link pre-existing shipment_events rows to the shipment we just backfilled
-- for their order.
UPDATE "shipment_events" se
SET "shipmentId" = s."id"
FROM "shipments" s
WHERE se."orderId" = s."orderId"
  AND se."shipmentId" IS NULL;
