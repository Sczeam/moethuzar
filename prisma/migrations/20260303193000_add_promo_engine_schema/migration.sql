-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('FLAT', 'PERCENT');

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "discountType" "PromoDiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrderAmount" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "promoCode" TEXT,
ADD COLUMN "promoDiscountType" "PromoDiscountType",
ADD COLUMN "promoDiscountValue" INTEGER,
ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "subtotalBeforeDiscount" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN "subtotalAfterDiscount" DECIMAL(12,2) DEFAULT 0;

-- Backfill existing orders for non-null snapshots.
UPDATE "Order"
SET
  "subtotalBeforeDiscount" = "subtotalAmount",
  "subtotalAfterDiscount" = "subtotalAmount";

-- Enforce non-null snapshots after backfill.
ALTER TABLE "Order"
ALTER COLUMN "subtotalBeforeDiscount" SET NOT NULL,
ALTER COLUMN "subtotalAfterDiscount" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_code_idx" ON "PromoCode"("isActive", "code");

-- CreateIndex
CREATE INDEX "PromoCode_startsAt_endsAt_idx" ON "PromoCode"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Order_promoCode_createdAt_idx" ON "Order"("promoCode", "createdAt");
