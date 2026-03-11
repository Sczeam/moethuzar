-- CreateEnum
CREATE TYPE "WishlistAvailabilityState" AS ENUM ('AVAILABLE', 'AVAILABLE_WITH_DISCOUNT', 'SOLD_OUT', 'ARCHIVED_PRODUCT');

-- CreateEnum
CREATE TYPE "WishlistPreferredVariantState" AS ENUM ('NOT_SET', 'AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "WishlistBadgeType" AS ENUM ('NONE', 'PRICE_DROP', 'LOW_STOCK', 'SOLD_OUT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" UUID NOT NULL,
    "customerId" UUID,
    "guestTokenHash" TEXT,
    "productId" UUID NOT NULL,
    "preferredVariantId" UUID,
    "preferredColorValue" TEXT,
    "preferredSizeValue" TEXT,
    "sourceSurface" TEXT,
    "savedPriceAmount" DECIMAL(12,2) NOT NULL,
    "savedCurrency" TEXT NOT NULL DEFAULT 'MMK',
    "lastInteractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItemView" (
    "wishlistItemId" UUID NOT NULL,
    "customerId" UUID,
    "guestTokenHash" TEXT,
    "productId" UUID NOT NULL,
    "preferredVariantId" UUID,
    "preferredColorValue" TEXT,
    "preferredSizeValue" TEXT,
    "productName" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "primaryImageUrl" TEXT,
    "currentPriceAmount" DECIMAL(12,2) NOT NULL,
    "savedPriceAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MMK',
    "availabilityState" "WishlistAvailabilityState" NOT NULL,
    "preferredVariantAvailabilityState" "WishlistPreferredVariantState" NOT NULL DEFAULT 'NOT_SET',
    "badgeType" "WishlistBadgeType" NOT NULL DEFAULT 'NONE',
    "lastInteractedAt" TIMESTAMP(3) NOT NULL,
    "projectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItemView_pkey" PRIMARY KEY ("wishlistItemId")
);

-- CreateTable
CREATE TABLE "EventOutbox" (
    "id" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_customerId_productId_key" ON "WishlistItem"("customerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_guestTokenHash_productId_key" ON "WishlistItem"("guestTokenHash", "productId");

-- CreateIndex
CREATE INDEX "WishlistItem_customerId_lastInteractedAt_id_idx" ON "WishlistItem"("customerId", "lastInteractedAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "WishlistItem_guestTokenHash_lastInteractedAt_id_idx" ON "WishlistItem"("guestTokenHash", "lastInteractedAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

-- CreateIndex
CREATE INDEX "WishlistItem_preferredVariantId_idx" ON "WishlistItem"("preferredVariantId");

-- CreateIndex
CREATE INDEX "WishlistItemView_customerId_lastInteractedAt_wishlistItemId_idx" ON "WishlistItemView"("customerId", "lastInteractedAt" DESC, "wishlistItemId" DESC);

-- CreateIndex
CREATE INDEX "WishlistItemView_guestTokenHash_lastInteractedAt_wishlistItemId_idx" ON "WishlistItemView"("guestTokenHash", "lastInteractedAt" DESC, "wishlistItemId" DESC);

-- CreateIndex
CREATE INDEX "WishlistItemView_productId_idx" ON "WishlistItemView"("productId");

-- CreateIndex
CREATE INDEX "WishlistItemView_preferredVariantId_idx" ON "WishlistItemView"("preferredVariantId");

-- CreateIndex
CREATE INDEX "EventOutbox_aggregateType_aggregateId_idx" ON "EventOutbox"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "EventOutbox_eventType_availableAt_idx" ON "EventOutbox"("eventType", "availableAt");

-- CreateIndex
CREATE INDEX "EventOutbox_availableAt_processedAt_idx" ON "EventOutbox"("availableAt", "processedAt");

-- CreateIndex
CREATE INDEX "EventOutbox_processedAt_availableAt_idx" ON "EventOutbox"("processedAt", "availableAt");

-- AddCheckConstraint
ALTER TABLE "WishlistItem"
ADD CONSTRAINT "WishlistItem_identity_xor_check"
CHECK (("customerId" IS NOT NULL AND "guestTokenHash" IS NULL) OR ("customerId" IS NULL AND "guestTokenHash" IS NOT NULL));

-- AddForeignKey
ALTER TABLE "WishlistItem"
ADD CONSTRAINT "WishlistItem_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem"
ADD CONSTRAINT "WishlistItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem"
ADD CONSTRAINT "WishlistItem_preferredVariantId_fkey"
FOREIGN KEY ("preferredVariantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemView"
ADD CONSTRAINT "WishlistItemView_wishlistItemId_fkey"
FOREIGN KEY ("wishlistItemId") REFERENCES "WishlistItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemView"
ADD CONSTRAINT "WishlistItemView_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemView"
ADD CONSTRAINT "WishlistItemView_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemView"
ADD CONSTRAINT "WishlistItemView_preferredVariantId_fkey"
FOREIGN KEY ("preferredVariantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
