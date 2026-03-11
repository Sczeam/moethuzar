import { WishlistBadgeType } from "@prisma/client";

export type WishlistProjectionVariantSnapshot = {
  id: string;
  inventory: number;
  isActive: boolean;
  price: string | null;
};

export type WishlistProjectionProductSnapshot = {
  id: string;
  name: string;
  slug: string;
  price: string;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  primaryImageUrl: string | null;
  variants: WishlistProjectionVariantSnapshot[];
};

export type WishlistProjectionSource = {
  wishlistItemId: string;
  customerId: string | null;
  guestTokenHash: string | null;
  productId: string;
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  savedPriceAmount: string;
  savedCurrency: string;
  lastInteractedAt: Date;
  product: WishlistProjectionProductSnapshot;
};

export type WishlistProjectionRecord = {
  wishlistItemId: string;
  customerId: string | null;
  guestTokenHash: string | null;
  productId: string;
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  productName: string;
  productSlug: string;
  primaryImageUrl: string | null;
  currentPriceAmount: string;
  savedPriceAmount: string;
  currency: string;
  availabilityState: "AVAILABLE" | "AVAILABLE_WITH_DISCOUNT" | "SOLD_OUT" | "ARCHIVED_PRODUCT";
  preferredVariantAvailabilityState: "NOT_SET" | "AVAILABLE" | "UNAVAILABLE";
  badgeType: WishlistBadgeType;
  lastInteractedAt: Date;
  projectedAt: Date;
};

const LOW_STOCK_THRESHOLD = 3;

function selectPreferredVariant(source: WishlistProjectionSource): WishlistProjectionVariantSnapshot | null {
  if (!source.preferredVariantId) {
    return null;
  }

  return source.product.variants.find((variant) => variant.id === source.preferredVariantId) ?? null;
}

function isVariantPurchasable(variant: WishlistProjectionVariantSnapshot): boolean {
  return variant.isActive && variant.inventory > 0;
}

export function deriveWishlistProjection(source: WishlistProjectionSource, projectedAt = new Date()): WishlistProjectionRecord {
  const preferredVariant = selectPreferredVariant(source);
  const anyPurchasableVariant = source.product.variants.some(isVariantPurchasable);
  const preferredVariantAvailable = preferredVariant ? isVariantPurchasable(preferredVariant) : null;
  const currentPriceAmount = preferredVariant?.price ?? source.product.price;

  let availabilityState: WishlistProjectionRecord["availabilityState"] = "AVAILABLE";
  if (source.product.status !== "ACTIVE") {
    availabilityState = "ARCHIVED_PRODUCT";
  } else if (!anyPurchasableVariant) {
    availabilityState = "SOLD_OUT";
  } else if (Number(currentPriceAmount) < Number(source.savedPriceAmount)) {
    availabilityState = "AVAILABLE_WITH_DISCOUNT";
  }

  const preferredVariantAvailabilityState: WishlistProjectionRecord["preferredVariantAvailabilityState"] =
    preferredVariant === null ? "NOT_SET" : preferredVariantAvailable ? "AVAILABLE" : "UNAVAILABLE";

  let badgeType: WishlistProjectionRecord["badgeType"] = WishlistBadgeType.NONE;
  if (availabilityState === "ARCHIVED_PRODUCT") {
    badgeType = WishlistBadgeType.ARCHIVED;
  } else if (availabilityState === "SOLD_OUT") {
    badgeType = WishlistBadgeType.SOLD_OUT;
  } else if (Number(currentPriceAmount) < Number(source.savedPriceAmount)) {
    badgeType = WishlistBadgeType.PRICE_DROP;
  } else if (preferredVariant && preferredVariantAvailable && preferredVariant.inventory <= LOW_STOCK_THRESHOLD) {
    badgeType = WishlistBadgeType.LOW_STOCK;
  }

  return {
    wishlistItemId: source.wishlistItemId,
    customerId: source.customerId,
    guestTokenHash: source.guestTokenHash,
    productId: source.productId,
    preferredVariantId: source.preferredVariantId,
    preferredColorValue: source.preferredColorValue,
    preferredSizeValue: source.preferredSizeValue,
    productName: source.product.name,
    productSlug: source.product.slug,
    primaryImageUrl: source.product.primaryImageUrl,
    currentPriceAmount,
    savedPriceAmount: source.savedPriceAmount,
    currency: source.savedCurrency,
    availabilityState,
    preferredVariantAvailabilityState,
    badgeType,
    lastInteractedAt: source.lastInteractedAt,
    projectedAt,
  };
}
