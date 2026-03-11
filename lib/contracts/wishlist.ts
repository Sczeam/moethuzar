import { z } from "zod";
import {
  DEFAULT_WISHLIST_PAGE_SIZE,
  MAX_WISHLIST_PAGE_SIZE,
  WISHLIST_CURSOR_VERSION,
} from "@/lib/constants/wishlist";
const uuid = z.string().uuid();
const moneyStringSchema = z.string().min(1);

export const WishlistCursorPayloadSchema = z.object({
  v: z.literal(WISHLIST_CURSOR_VERSION),
  lastInteractedAt: z.string().datetime({ offset: true }),
  id: uuid,
});

export type WishlistCursorPayload = z.infer<typeof WishlistCursorPayloadSchema>;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeWishlistCursor(payload: WishlistCursorPayload): string {
  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeWishlistCursor(cursor: string): WishlistCursorPayload | null {
  try {
    return WishlistCursorPayloadSchema.parse(JSON.parse(decodeBase64Url(cursor)));
  } catch {
    return null;
  }
}

export const WishlistStatusItemSchema = z.object({
  productId: uuid,
  saved: z.boolean(),
  wishlistItemId: uuid.nullable(),
  preferredVariantId: uuid.nullable(),
  preferredColorValue: z.string().nullable(),
  preferredSizeValue: z.string().nullable(),
  lastInteractedAt: z.string().datetime({ offset: true }).nullable(),
});

export type WishlistStatusItem = z.infer<typeof WishlistStatusItemSchema>;

export const WishlistStatusResponseSchema = z.object({
  items: z.array(WishlistStatusItemSchema),
});

export type WishlistStatusResponse = z.infer<typeof WishlistStatusResponseSchema>;

export const WishlistListItemSchema = z.object({
  wishlistItemId: uuid,
  productId: uuid,
  productName: z.string().min(1),
  slug: z.string().min(1),
  primaryImageUrl: z.string().url().nullable(),
  currentPriceAmount: moneyStringSchema,
  savedPriceAmount: moneyStringSchema,
  currency: z.string().min(1),
  availabilityState: z.enum([
    "AVAILABLE",
    "AVAILABLE_WITH_DISCOUNT",
    "SOLD_OUT",
    "ARCHIVED_PRODUCT",
  ]),
  preferredVariantAvailabilityState: z.enum(["NOT_SET", "AVAILABLE", "UNAVAILABLE"]),
  badgeType: z.enum(["NONE", "PRICE_DROP", "LOW_STOCK", "SOLD_OUT", "ARCHIVED"]),
  preferredVariantId: uuid.nullable(),
  preferredColorValue: z.string().nullable(),
  preferredSizeValue: z.string().nullable(),
  lastInteractedAt: z.string().datetime({ offset: true }),
});

export type WishlistListItem = z.infer<typeof WishlistListItemSchema>;

export const WishlistListResponseSchema = z.object({
  items: z.array(WishlistListItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  pageSize: z.number().int().min(1).max(MAX_WISHLIST_PAGE_SIZE),
});

export type WishlistListResponse = z.infer<typeof WishlistListResponseSchema>;

export const WishlistWriteResponseSchema = z.object({
  ok: z.literal(true),
  item: WishlistStatusItemSchema,
});

export type WishlistWriteResponse = z.infer<typeof WishlistWriteResponseSchema>;

export const WishlistMergeResponseSchema = z.object({
  ok: z.literal(true),
  mergedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
});

export type WishlistMergeResponse = z.infer<typeof WishlistMergeResponseSchema>;

export const WISHLIST_STATUS_RESPONSE_EXAMPLE: WishlistStatusResponse = {
  items: [
    {
      productId: "48aa1782-0fc3-4493-b46d-764126cb8c8c",
      saved: true,
      wishlistItemId: "af2f428d-ae1b-4658-aa44-3998f9224bc0",
      preferredVariantId: "be6334c6-8417-4348-b30d-c6070c8c8ed0",
      preferredColorValue: "Black",
      preferredSizeValue: "M",
      lastInteractedAt: "2026-03-11T09:45:00.000Z",
    },
  ],
};

export const WISHLIST_LIST_RESPONSE_EXAMPLE: WishlistListResponse = {
  items: [
    {
      wishlistItemId: "af2f428d-ae1b-4658-aa44-3998f9224bc0",
      productId: "48aa1782-0fc3-4493-b46d-764126cb8c8c",
      productName: "Midnight Bloom Blazer Set",
      slug: "midnight-bloom-blazer-set",
      primaryImageUrl: "https://example.com/images/midnight-bloom.jpg",
      currentPriceAmount: "15000.00",
      savedPriceAmount: "15000.00",
      currency: "MMK",
      availabilityState: "AVAILABLE",
      preferredVariantAvailabilityState: "AVAILABLE",
      badgeType: "NONE",
      preferredVariantId: "be6334c6-8417-4348-b30d-c6070c8c8ed0",
      preferredColorValue: "Black",
      preferredSizeValue: "M",
      lastInteractedAt: "2026-03-11T09:45:00.000Z",
    },
  ],
  nextCursor: encodeWishlistCursor({
    v: WISHLIST_CURSOR_VERSION,
    lastInteractedAt: "2026-03-11T09:45:00.000Z",
    id: "af2f428d-ae1b-4658-aa44-3998f9224bc0",
  }),
  hasMore: true,
  pageSize: DEFAULT_WISHLIST_PAGE_SIZE,
};
