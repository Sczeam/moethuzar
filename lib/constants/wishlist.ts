export const WISHLIST_COOKIE_NAME = "wishlist_token";
export const WISHLIST_CURSOR_VERSION = 1 as const;
export const DEFAULT_WISHLIST_PAGE_SIZE = 24;
export const MAX_WISHLIST_PAGE_SIZE = 50;
export const WISHLIST_GUEST_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export const WISHLIST_SOURCE_SURFACES = [
  "PLP",
  "PDP",
  "SEARCH",
  "COLLECTION",
  "ACCOUNT",
] as const;

export type WishlistSourceSurface = (typeof WISHLIST_SOURCE_SURFACES)[number];

export const WISHLIST_BADGE_LABELS = {
  NONE: null,
  PRICE_DROP: "Price dropped",
  LOW_STOCK: "Low stock",
  SOLD_OUT: "Sold out",
  ARCHIVED: "No longer available",
} as const;
