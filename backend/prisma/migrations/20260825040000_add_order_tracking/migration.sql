ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "trackingCarrier" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "lastTrackingSync" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "orders_trackingNumber_idx" ON "orders"("trackingNumber");

CREATE TABLE IF NOT EXISTS "shipment_events" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "eventTime" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'TRACKING_API',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shipment_events_orderId_idx" ON "shipment_events"("orderId");

ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
