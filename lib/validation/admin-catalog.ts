import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const priceStringSchema = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format.");

const productImageInputSchema = z.object({
  url: z.string().trim().url(),
  alt: z.string().trim().max(255).optional().or(z.literal("")),
  variantId: z.string().uuid().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000),
});

const createVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(120),
  color: z.string().trim().max(64).optional().or(z.literal("")),
  size: z.string().trim().max(64).optional().or(z.literal("")),
  material: z.string().trim().max(64).optional().or(z.literal("")),
  price: priceStringSchema.optional().or(z.literal("")),
  compareAtPrice: priceStringSchema.optional().or(z.literal("")),
  inventory: z.number().int().min(0).max(100000),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000),
});

const updateVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(120),
  color: z.string().trim().max(64).optional().or(z.literal("")),
  size: z.string().trim().max(64).optional().or(z.literal("")),
  material: z.string().trim().max(64).optional().or(z.literal("")),
  price: priceStringSchema.optional().or(z.literal("")),
  compareAtPrice: priceStringSchema.optional().or(z.literal("")),
  inventory: z.number().int().min(0).max(100000).optional(),
  initialInventory: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000),
});

const baseProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: priceStringSchema,
  currency: z.string().trim().min(3).max(3),
  status: z.nativeEnum(ProductStatus),
  categoryId: z.string().uuid(),
  images: z.array(productImageInputSchema).max(8),
});

export const adminCatalogCreateSchema = baseProductSchema.extend({
  variants: z.array(createVariantInputSchema).min(1).max(30),
});

export const adminCatalogUpdateSchema = baseProductSchema.extend({
  variants: z.array(updateVariantInputSchema).min(1).max(30),
});

export const adminCatalogProductIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export const adminCatalogCategoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const adminInventoryAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  quantityDelta: z.number().int().min(-100000).max(100000).refine((value) => value !== 0),
  note: z.string().trim().min(4).max(500),
});

const matrixOptionValueSchema = z.string().trim().min(1).max(64);

export const adminVariantMatrixGenerateSchema = z
  .object({
    namePrefix: z.string().trim().min(2).max(120),
    skuPrefix: z.string().trim().min(2).max(64),
    colors: z.array(matrixOptionValueSchema).min(1).max(30),
    sizes: z.array(matrixOptionValueSchema).min(1).max(30),
    material: z.string().trim().max(64).optional().or(z.literal("")),
    basePrice: priceStringSchema.optional().or(z.literal("")),
    compareAtPrice: priceStringSchema.optional().or(z.literal("")),
    initialInventory: z.number().int().min(0).max(100000).default(0),
    isActive: z.boolean().default(true),
    existing: z
      .array(
        z.object({
          color: z.string().trim().max(64),
          size: z.string().trim().max(64),
        })
      )
      .max(500)
      .optional()
      .default([]),
  })
  .superRefine((value, ctx) => {
    if (value.colors.length * value.sizes.length > 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variant matrix is too large. Keep combinations to 200 or fewer.",
        path: ["colors"],
      });
    }
  });

export type AdminCatalogCreateInput = z.infer<typeof adminCatalogCreateSchema>;
export type AdminCatalogUpdateInput = z.infer<typeof adminCatalogUpdateSchema>;
export type AdminCatalogCategoryCreateInput = z.infer<typeof adminCatalogCategoryCreateSchema>;
export type AdminInventoryAdjustmentInput = z.infer<typeof adminInventoryAdjustmentSchema>;
export type AdminVariantMatrixGenerateInput = z.infer<typeof adminVariantMatrixGenerateSchema>;

const draftVariantValidationSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(64),
  color: z.string().trim().max(64).optional().or(z.literal("")),
  size: z.string().trim().max(64).optional().or(z.literal("")),
});

export const adminCatalogDraftValidationSchema = z.object({
  productId: z.string().uuid().optional(),
  variants: z.array(draftVariantValidationSchema).min(1).max(300),
});

export type AdminCatalogDraftValidationInput = z.infer<typeof adminCatalogDraftValidationSchema>;
