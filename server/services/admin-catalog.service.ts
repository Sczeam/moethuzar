import { prisma } from "@/lib/prisma";
import type {
  AdminCatalogCategoryCreateInput,
  AdminCatalogCreateInput,
  AdminCatalogDraftValidationInput,
  AdminCatalogUpdateInput,
  AdminInventoryAdjustmentInput,
  AdminVariantMatrixGenerateInput,
} from "@/lib/validation/admin-catalog";
import { generateVariantMatrix } from "@/server/domain/admin-variant-matrix";
import { AppError } from "@/server/errors";
import { InventoryChangeType, Prisma } from "@prisma/client";

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalUuid(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const productInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  variants: {
    orderBy: { sortOrder: "asc" as const },
  },
};

function serializeProduct(
  product: Prisma.ProductGetPayload<{
    include: typeof productInclude;
  }>
) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toPriceString(product.price),
    currency: product.currency,
    status: product.status,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      variantId: image.variantId,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      color: variant.color,
      size: variant.size,
      material: variant.material,
      price: variant.price ? toPriceString(variant.price) : null,
      compareAtPrice: variant.compareAtPrice ? toPriceString(variant.compareAtPrice) : null,
      inventory: variant.inventory,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
    })),
    totalInventory: product.variants.reduce((acc, variant) => acc + variant.inventory, 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function listAdminCatalog() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: productInclude,
    }),
  ]);

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    products: products.map(serializeProduct),
  };
}

export async function createAdminCategory(input: AdminCatalogCategoryCreateInput) {
  try {
    const created = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Category name or slug already exists.", 409, "UNIQUE_CONSTRAINT");
    }

    throw error;
  }
}

export async function getAdminProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });

  if (!product) {
    throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
  }

  return serializeProduct(product);
}

export async function createAdminProduct(input: AdminCatalogCreateInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
  }

  try {
    const created = await prisma.product.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: normalizeOptionalText(input.description),
        price: input.price.trim(),
        currency: input.currency.trim().toUpperCase(),
        status: input.status,
        categoryId: input.categoryId,
        images: {
          create: input.images.map((image) => ({
            url: image.url.trim(),
            alt: normalizeOptionalText(image.alt),
            // New products cannot safely map images to freshly-created variants in one request.
            variantId: null,
            sortOrder: image.sortOrder,
          })),
        },
        variants: {
          create: input.variants.map((variant) => ({
            sku: variant.sku.trim().toUpperCase(),
            name: variant.name.trim(),
            color: normalizeOptionalText(variant.color),
            size: normalizeOptionalText(variant.size),
            material: normalizeOptionalText(variant.material),
            price: normalizeOptionalText(variant.price),
            compareAtPrice: normalizeOptionalText(variant.compareAtPrice),
            inventory: variant.inventory,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
          })),
        },
      },
      include: productInclude,
    });

    return serializeProduct(created);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Slug or SKU already exists.", 409, "UNIQUE_CONSTRAINT");
    }

    throw error;
  }
}

export async function updateAdminProduct(
  productId: string,
  input: AdminCatalogUpdateInput,
  adminUserId: string
) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        select: { id: true, inventory: true },
      },
    },
  });

  if (!existing) {
    throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: normalizeOptionalText(input.description),
          price: input.price.trim(),
          currency: input.currency.trim().toUpperCase(),
          status: input.status,
          categoryId: input.categoryId,
        },
      });

      const existingVariantIds = new Set(existing.variants.map((variant) => variant.id));
      const existingVariantById = new Map(existing.variants.map((variant) => [variant.id, variant]));
      const touchedVariantIds = new Set<string>();

      for (const variant of input.variants) {
        if (variant.id && existingVariantIds.has(variant.id)) {
          const currentVariant = existingVariantById.get(variant.id);
          const nextInventory = variant.inventory ?? currentVariant?.inventory ?? 0;
          const quantityDelta = nextInventory - (currentVariant?.inventory ?? 0);

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              sku: variant.sku.trim().toUpperCase(),
              name: variant.name.trim(),
              color: normalizeOptionalText(variant.color),
              size: normalizeOptionalText(variant.size),
              material: normalizeOptionalText(variant.material),
              price: normalizeOptionalText(variant.price),
              compareAtPrice: normalizeOptionalText(variant.compareAtPrice),
              inventory: nextInventory,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder,
            },
          });

          if (quantityDelta !== 0) {
            await tx.inventoryLog.create({
              data: {
                productId,
                variantId: variant.id,
                changeType: InventoryChangeType.MANUAL_ADJUSTMENT,
                quantity: quantityDelta,
                note: `[admin:${adminUserId}] Catalog editor save`,
              },
            });
          }
          touchedVariantIds.add(variant.id);
          continue;
        }

        const initialInventory = variant.inventory ?? variant.initialInventory ?? 0;
        const createdVariant = await tx.productVariant.create({
          data: {
            productId,
            sku: variant.sku.trim().toUpperCase(),
            name: variant.name.trim(),
            color: normalizeOptionalText(variant.color),
            size: normalizeOptionalText(variant.size),
            material: normalizeOptionalText(variant.material),
            price: normalizeOptionalText(variant.price),
            compareAtPrice: normalizeOptionalText(variant.compareAtPrice),
            inventory: initialInventory,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
          },
          select: { id: true },
        });

        if (initialInventory !== 0) {
          await tx.inventoryLog.create({
            data: {
              productId,
              variantId: createdVariant.id,
              changeType: InventoryChangeType.MANUAL_ADJUSTMENT,
              quantity: initialInventory,
              note: `[admin:${adminUserId}] New variant initial stock from catalog editor`,
            },
          });
        }

        touchedVariantIds.add(createdVariant.id);
      }

      const variantsToDeactivate = existing.variants
        .filter((variant) => !touchedVariantIds.has(variant.id))
        .map((variant) => variant.id);

      if (variantsToDeactivate.length > 0) {
        await tx.productVariant.updateMany({
          where: {
            id: { in: variantsToDeactivate },
          },
          data: {
            isActive: false,
          },
        });
      }

      const validVariantIds = new Set(touchedVariantIds);
      await tx.productImage.deleteMany({
        where: { productId },
      });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((image) => ({
            productId,
            url: image.url.trim(),
            alt: normalizeOptionalText(image.alt),
            sortOrder: image.sortOrder,
            variantId: (() => {
              const variantId = normalizeOptionalUuid(image.variantId);
              if (!variantId) {
                return null;
              }
              return validVariantIds.has(variantId) ? variantId : null;
            })(),
          })),
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: productInclude,
      });
    });

    return serializeProduct(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Slug or SKU already exists.", 409, "UNIQUE_CONSTRAINT");
    }

    throw error;
  }
}

export async function adjustVariantInventory(
  productId: string,
  adminUserId: string,
  input: AdminInventoryAdjustmentInput
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: {
        id: input.variantId,
        productId,
      },
      select: {
        id: true,
        sku: true,
        inventory: true,
      },
    });

    if (!variant) {
      throw new AppError("Variant not found for this product.", 404, "VARIANT_NOT_FOUND");
    }

    const nextInventory = variant.inventory + input.quantityDelta;
    if (nextInventory < 0) {
      throw new AppError("Inventory cannot go below zero.", 409, "NEGATIVE_INVENTORY");
    }

    const updatedVariant = await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        inventory: nextInventory,
      },
      select: {
        id: true,
        sku: true,
        inventory: true,
      },
    });

    await tx.inventoryLog.create({
      data: {
        productId,
        variantId: variant.id,
        changeType: InventoryChangeType.MANUAL_ADJUSTMENT,
        quantity: input.quantityDelta,
        note: `[admin:${adminUserId}] ${input.note.trim()}`,
      },
    });

    return updatedVariant;
  });
}

export function generateAdminVariantMatrixPreview(input: AdminVariantMatrixGenerateInput) {
  const rows = generateVariantMatrix({
    namePrefix: input.namePrefix,
    skuPrefix: input.skuPrefix,
    colors: input.colors,
    sizes: input.sizes,
    material: input.material,
    basePrice: input.basePrice,
    compareAtPrice: input.compareAtPrice,
    initialInventory: input.initialInventory,
    isActive: input.isActive,
    existing: input.existing,
  });

  return {
    rows,
    summary: {
      generated: rows.length,
      existing: rows.filter((row) => row.exists).length,
      newRows: rows.filter((row) => !row.exists).length,
    },
  };
}

export type AdminCatalogDraftIssue = {
  code: "DUPLICATE_SKU_IN_DRAFT" | "DUPLICATE_OPTION_COMBINATION_IN_DRAFT" | "SKU_ALREADY_EXISTS";
  message: string;
  path: string;
};

export async function validateAdminCatalogDraft(input: AdminCatalogDraftValidationInput) {
  const issues: AdminCatalogDraftIssue[] = [];

  const skuCounter = new Map<string, number>();
  const optionCounter = new Map<string, number>();
  const skuToPath = new Map<string, string>();

  input.variants.forEach((variant, index) => {
    const sku = variant.sku.trim().toUpperCase();
    const skuPath = `variants.${index}.sku`;
    const optionKey = `${(variant.color ?? "").trim().toLowerCase()}__${(variant.size ?? "")
      .trim()
      .toLowerCase()}`;

    skuCounter.set(sku, (skuCounter.get(sku) ?? 0) + 1);
    optionCounter.set(optionKey, (optionCounter.get(optionKey) ?? 0) + 1);
    if (!skuToPath.has(sku)) {
      skuToPath.set(sku, skuPath);
    }
  });

  for (const [sku, count] of skuCounter.entries()) {
    if (count > 1) {
      issues.push({
        code: "DUPLICATE_SKU_IN_DRAFT",
        message: `Duplicate SKU in draft: ${sku}.`,
        path: skuToPath.get(sku) ?? "variants",
      });
    }
  }

  for (const [optionKey, count] of optionCounter.entries()) {
    if (count > 1) {
      const [color, size] = optionKey.split("__");
      issues.push({
        code: "DUPLICATE_OPTION_COMBINATION_IN_DRAFT",
        message: `Duplicate color/size combination in draft: ${color || "(no color)"} / ${
          size || "(no size)"
        }.`,
        path: "variants",
      });
    }
  }

  const uniqueSkus = [...new Set(input.variants.map((variant) => variant.sku.trim().toUpperCase()))];
  if (uniqueSkus.length > 0) {
    const variantIds = input.variants.map((variant) => variant.id).filter(Boolean) as string[];
    const existingSkus = await prisma.productVariant.findMany({
      where: {
        sku: { in: uniqueSkus },
        ...(variantIds.length > 0 ? { id: { notIn: variantIds } } : {}),
        ...(input.productId ? { productId: { not: input.productId } } : {}),
      },
      select: { sku: true },
    });

    for (const row of existingSkus) {
      issues.push({
        code: "SKU_ALREADY_EXISTS",
        message: `SKU already exists: ${row.sku}.`,
        path: skuToPath.get(row.sku) ?? "variants",
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
