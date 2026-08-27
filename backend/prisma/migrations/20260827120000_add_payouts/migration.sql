DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('PAID', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "payouts" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PayoutMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
  "status" "PayoutStatus" NOT NULL DEFAULT 'PAID',
  "reference" TEXT,
  "note" TEXT,
  "paidById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payouts_sellerId_idx" ON "payouts"("sellerId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paidById_fkey"
  FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
