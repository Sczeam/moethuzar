-- Ensure PaymentMethod supports prepaid transfer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentMethod'
      AND e.enumlabel = 'PREPAID_TRANSFER'
  ) THEN
    ALTER TYPE "PaymentMethod" ADD VALUE 'PREPAID_TRANSFER';
  END IF;
END $$;

-- Ensure PaymentStatus enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'PaymentStatus'
  ) THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');
  END IF;
END $$;

-- Add missing payment-tracking columns to Order table
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMP(3);

-- Index for admin payment review queue
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_createdAt_idx"
  ON "Order"("paymentStatus", "createdAt");
