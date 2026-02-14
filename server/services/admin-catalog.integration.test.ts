import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true"
    ? process.env.RUN_INTEGRATION_TESTS === "1"
    : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("admin catalog integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const categorySlug = `it-catalog-category-${suffix}`;
  const productSlug = `it-catalog-product-${suffix}`;
  const variantSku = `IT-CATALOG-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let createAdminProduct: (typeof import("@/server/services/admin-catalog.service"))["createAdminProduct"];
  let updateAdminProduct: (typeof import("@/server/services/admin-catalog.service"))["updateAdminProduct"];
  let adjustVariantInventory: (typeof import("@/server/services/admin-catalog.service"))["adjustVariantInventory"];
  let enums: typeof import("@prisma/client");

  let categoryId = "";
  let productId = "";
  let variantId = "";

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({ createAdminProduct, updateAdminProduct, adjustVariantInventory } = await import(
      "@/server/services/admin-catalog.service"
    ));
    enums = await import("@prisma/client");

    const category = await prisma.category.create({
      data: {
        name: `Catalog Category ${suffix}`,
        slug: categorySlug,
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (productId) {
      await prisma.inventoryLog.deleteMany({ where: { productId } });
      await prisma.productImage.deleteMany({ where: { productId } });
      await prisma.productVariant.deleteMany({ where: { productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    }

    if (categoryId) {
      await prisma.category.deleteMany({ where: { id: categoryId } });
    }
  });

  it("creates product and variant through admin catalog service", async () => {
    const product = await createAdminProduct({
      name: "Catalog Integration Tee",
      slug: productSlug,
      description: "Catalog integration test product",
      price: "59.00",
      currency: "MMK",
      status: enums.ProductStatus.DRAFT,
      categoryId,
      images: [
        {
          url: "https://example.com/catalog-test.jpg",
          alt: "Catalog test image",
          sortOrder: 0,
        },
      ],
      variants: [
        {
          sku: variantSku,
          name: "Black / M",
          color: "Black",
          size: "M",
          material: "Cotton",
          price: "59.00",
          compareAtPrice: "",
          inventory: 6,
          isActive: true,
          sortOrder: 0,
        },
      ],
    });

    productId = product.id;
    variantId = product.variants[0].id;

    expect(product.slug).toBe(productSlug);
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].sku).toBe(variantSku);
    expect(product.totalInventory).toBe(6);
  });

  it("updates product status and adjusts variant inventory with logs", async () => {
    const updated = await updateAdminProduct(productId, {
      name: "Catalog Integration Tee Updated",
      slug: productSlug,
      description: "Updated description",
      price: "62.00",
      currency: "MMK",
      status: enums.ProductStatus.ACTIVE,
      categoryId,
      images: [
        {
          url: "https://example.com/catalog-test-updated.jpg",
          alt: "Updated image",
          sortOrder: 0,
        },
      ],
      variants: [
        {
          id: variantId,
          sku: variantSku,
          name: "Black / M",
          color: "Black",
          size: "M",
          material: "Cotton",
          price: "62.00",
          compareAtPrice: "",
          initialInventory: 0,
          isActive: true,
          sortOrder: 0,
        },
      ],
    });

    expect(updated.status).toBe(enums.ProductStatus.ACTIVE);
    expect(updated.price).toBe("62");

    const variant = await adjustVariantInventory(productId, "integration-admin", {
      variantId,
      quantityDelta: 4,
      note: "Manual stock increase",
    });

    expect(variant.inventory).toBe(10);

    const logs = await prisma.inventoryLog.findMany({
      where: {
        productId,
        variantId,
        changeType: enums.InventoryChangeType.MANUAL_ADJUSTMENT,
      },
    });

    expect(logs.length).toBe(1);
    expect(logs[0].quantity).toBe(4);
    expect(logs[0].note?.includes("integration-admin")).toBe(true);
  });
});
