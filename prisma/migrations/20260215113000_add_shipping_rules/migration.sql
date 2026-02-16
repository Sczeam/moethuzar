-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "shippingZoneKey" TEXT,
ADD COLUMN "shippingZoneLabel" TEXT,
ADD COLUMN "shippingEtaLabel" TEXT;

-- CreateTable
CREATE TABLE "ShippingRule" (
    "id" UUID NOT NULL,
    "zoneKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Myanmar',
    "stateRegion" TEXT,
    "townshipCity" TEXT,
    "feeAmount" INTEGER NOT NULL,
    "freeShippingThreshold" INTEGER,
    "etaLabel" TEXT NOT NULL,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRule_zoneKey_key" ON "ShippingRule"("zoneKey");

-- CreateIndex
CREATE INDEX "ShippingRule_country_isActive_sortOrder_idx" ON "ShippingRule"("country", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ShippingRule_townshipCity_isActive_idx" ON "ShippingRule"("townshipCity", "isActive");

-- CreateIndex
CREATE INDEX "ShippingRule_stateRegion_isActive_idx" ON "ShippingRule"("stateRegion", "isActive");
