ALTER TABLE "ProductImage"
ADD COLUMN "variantId" UUID;

CREATE INDEX "ProductImage_variantId_idx" ON "ProductImage"("variantId");

ALTER TABLE "ProductImage"
ADD CONSTRAINT "ProductImage_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
