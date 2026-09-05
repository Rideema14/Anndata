-- ============================================================================
-- Remove the 17TRACK-era automatic tracking schema and replace it with the
-- manual shipment + financial settlement system.
--
-- This is a breaking schema change to `shipments` (courier verification /
-- sync / risk-flag columns removed) and drops `shipment_events` entirely
-- (no more courier-pushed tracking events). Any existing shipment/event
-- rows are dropped along with those columns — there is no automatic
-- tracking provider left to have produced trustworthy data for them, and
-- this project has no production traffic yet.
-- ============================================================================

-- --- orders: drop the legacy flat tracking columns, add settlementStatus --

ALTER TABLE "orders" DROP COLUMN IF EXISTS "trackingCarrier";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "trackingNumber";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "lastTrackingSync";

DO $$ BEGIN
  CREATE TYPE "SettlementStatus" AS ENUM (
    'NOT_ELIGIBLE',
    'PENDING_REVIEW',
    'SELLER_PAYOUT_PENDING',
    'SELLER_PAID',
    'BUYER_REFUND_PENDING',
    'BUYER_REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SettlementDecision" AS ENUM ('REFUND_BUYER', 'PAY_SELLER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE';

-- New order-status outcome: a shipment that was submitted but never
-- successfully delivered.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERY_FAILED';

DROP INDEX IF EXISTS "orders_trackingNumber_idx";
CREATE INDEX IF NOT EXISTS "orders_settlementStatus_idx" ON "orders"("settlementStatus");

-- --- shipment_events: dropped entirely — no more courier-pushed events ----

DROP TABLE IF EXISTS "shipment_events" CASCADE;

-- --- shipments: drop and recreate with the simplified, seller-only shape --

DROP TABLE IF EXISTS "shipments" CASCADE;
DROP TYPE IF EXISTS "ShipmentStatus";

CREATE TABLE "shipments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "carrierCode" TEXT NOT NULL,
  "carrierName" TEXT,
  "awb" TEXT NOT NULL,
  "normalizedAwb" TEXT NOT NULL,
  "shipmentDate" TIMESTAMP(3),
  "note" TEXT,
  "submittedById" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX "shipments_normalizedAwb_idx" ON "shipments"("normalizedAwb");
CREATE INDEX "shipments_carrierCode_idx" ON "shipments"("carrierCode");
CREATE INDEX "shipments_sellerId_idx" ON "shipments"("sellerId");

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- settlements: new append-only financial-resolution table --------------

CREATE TABLE "settlements" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "SettlementStatus" NOT NULL,
  "decision" "SettlementDecision",
  "sellerId" TEXT,
  "buyerPaidTotal" DECIMAL(12,2) NOT NULL,
  "productAmount" DECIMAL(12,2) NOT NULL,
  "platformAmount" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT,
  "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "paymentReference" TEXT,
  "resolvedById" TEXT,
  "resolvedByRole" TEXT,
  "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "settlements_orderId_idx" ON "settlements"("orderId");
CREATE INDEX "settlements_status_idx" ON "settlements"("status");
CREATE INDEX "settlements_sellerId_idx" ON "settlements"("sellerId");
CREATE INDEX "settlements_isCurrent_idx" ON "settlements"("isCurrent");

ALTER TABLE "settlements" ADD CONSTRAINT "settlements_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
