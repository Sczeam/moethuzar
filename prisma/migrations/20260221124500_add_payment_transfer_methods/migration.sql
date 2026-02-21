-- CreateEnum
CREATE TYPE "TransferChannelType" AS ENUM ('BANK', 'WALLET');

-- CreateTable
CREATE TABLE "PaymentTransferMethod" (
    "id" UUID NOT NULL,
    "methodCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "channelType" "TransferChannelType" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "phoneNumber" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransferMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransferMethod_methodCode_key" ON "PaymentTransferMethod"("methodCode");

-- CreateIndex
CREATE INDEX "PaymentTransferMethod_isActive_sortOrder_idx" ON "PaymentTransferMethod"("isActive", "sortOrder");
