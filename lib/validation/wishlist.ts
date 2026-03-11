import { z } from "zod";
import {
  DEFAULT_WISHLIST_PAGE_SIZE,
  MAX_WISHLIST_PAGE_SIZE,
  WISHLIST_SOURCE_SURFACES,
} from "@/lib/constants/wishlist";

const uuid = z.string().uuid();
const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .optional();
const nullablePreferenceString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().max(100).nullable().optional());

export const wishlistSourceSurfaceSchema = z.enum(WISHLIST_SOURCE_SURFACES);

export const createWishlistItemSchema = z.object({
  productId: uuid,
  preferredVariantId: uuid.optional(),
  preferredColorValue: optionalTrimmedString,
  preferredSizeValue: optionalTrimmedString,
  sourceSurface: wishlistSourceSurfaceSchema.optional(),
});

export const updateWishlistPreferencesSchema = z.object({
  preferredVariantId: uuid.nullable().optional(),
  preferredColorValue: nullablePreferenceString,
  preferredSizeValue: nullablePreferenceString,
  sourceSurface: wishlistSourceSurfaceSchema.optional(),
});

export const wishlistListQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(512).optional(),
  pageSize: z.coerce.number().int().min(1).max(MAX_WISHLIST_PAGE_SIZE).default(DEFAULT_WISHLIST_PAGE_SIZE),
});

export const wishlistStatusQuerySchema = z.object({
  productIds: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.split(",").map((part) => part.trim()).filter(Boolean))
    .pipe(z.array(uuid).min(1).max(50)),
});

export const wishlistMergeSchema = z.object({
  guestToken: z.string().trim().min(1).max(256).optional(),
});

export type CreateWishlistItemInput = z.infer<typeof createWishlistItemSchema>;
export type UpdateWishlistPreferencesInput = z.infer<typeof updateWishlistPreferencesSchema>;
export type WishlistListQuery = z.infer<typeof wishlistListQuerySchema>;
export type WishlistStatusQuery = z.infer<typeof wishlistStatusQuerySchema>;
export type WishlistMergeInput = z.infer<typeof wishlistMergeSchema>;
