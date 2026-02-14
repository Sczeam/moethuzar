import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const priceStringSchema = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format.");

const productImageInputSchema = z.object({
  url: z.string().trim().url(),
  alt: z.string().trim().max(255).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000),
});

const createVariantInputSchema = z.object({
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

export const adminInventoryAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  quantityDelta: z.number().int().min(-100000).max(100000).refine((value) => value !== 0),
  note: z.string().trim().min(4).max(500),
});

export type AdminCatalogCreateInput = z.infer<typeof adminCatalogCreateSchema>;
export type AdminCatalogUpdateInput = z.infer<typeof adminCatalogUpdateSchema>;
export type AdminInventoryAdjustmentInput = z.infer<typeof adminInventoryAdjustmentSchema>;
