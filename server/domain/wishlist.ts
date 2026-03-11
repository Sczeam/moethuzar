import type {
  WishlistCanonicalItem,
  WishlistProductSnapshot,
} from "@/server/domain/wishlist-types";

function normalizePreference(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function resolveWishlistSavedPriceAmount(product: WishlistProductSnapshot): string {
  return product.preferredVariant?.price ?? product.price;
}

export function buildWishlistCreateInput(params: {
  existing: WishlistCanonicalItem | null;
  product: WishlistProductSnapshot;
  preferredVariantId?: string;
  preferredColorValue?: string;
  preferredSizeValue?: string;
  sourceSurface?: string;
  now: Date;
}): Pick<
  WishlistCanonicalItem,
  | "preferredVariantId"
  | "preferredColorValue"
  | "preferredSizeValue"
  | "sourceSurface"
  | "savedPriceAmount"
  | "savedCurrency"
  | "lastInteractedAt"
> {
  return {
    preferredVariantId: params.preferredVariantId ?? params.existing?.preferredVariantId ?? null,
    preferredColorValue:
      normalizePreference(params.preferredColorValue) ?? params.existing?.preferredColorValue ?? null,
    preferredSizeValue:
      normalizePreference(params.preferredSizeValue) ?? params.existing?.preferredSizeValue ?? null,
    sourceSurface: normalizePreference(params.sourceSurface) ?? params.existing?.sourceSurface ?? null,
    savedPriceAmount: params.existing?.savedPriceAmount ?? resolveWishlistSavedPriceAmount(params.product),
    savedCurrency: params.existing?.savedCurrency ?? params.product.currency,
    lastInteractedAt: params.now,
  };
}

export function buildWishlistPreferenceUpdate(params: {
  existing: WishlistCanonicalItem;
  preferredVariantId?: string | null;
  preferredColorValue?: string | null;
  preferredSizeValue?: string | null;
  sourceSurface?: string;
  now: Date;
}): Pick<
  WishlistCanonicalItem,
  | "preferredVariantId"
  | "preferredColorValue"
  | "preferredSizeValue"
  | "sourceSurface"
  | "lastInteractedAt"
> {
  return {
    preferredVariantId:
      params.preferredVariantId !== undefined
        ? params.preferredVariantId
        : params.existing.preferredVariantId,
    preferredColorValue:
      params.preferredColorValue !== undefined
        ? normalizePreference(params.preferredColorValue)
        : params.existing.preferredColorValue,
    preferredSizeValue:
      params.preferredSizeValue !== undefined
        ? normalizePreference(params.preferredSizeValue)
        : params.existing.preferredSizeValue,
    sourceSurface:
      params.sourceSurface !== undefined
        ? normalizePreference(params.sourceSurface)
        : params.existing.sourceSurface,
    lastInteractedAt: params.now,
  };
}

export function mergeWishlistItems(params: {
  customerItem: WishlistCanonicalItem;
  guestItem: WishlistCanonicalItem;
}): Pick<
  WishlistCanonicalItem,
  | "preferredVariantId"
  | "preferredColorValue"
  | "preferredSizeValue"
  | "sourceSurface"
  | "lastInteractedAt"
> {
  const latestLastInteractedAt =
    params.guestItem.lastInteractedAt > params.customerItem.lastInteractedAt
      ? params.guestItem.lastInteractedAt
      : params.customerItem.lastInteractedAt;

  return {
    preferredVariantId:
      params.customerItem.preferredVariantId ?? params.guestItem.preferredVariantId ?? null,
    preferredColorValue:
      params.customerItem.preferredColorValue ?? params.guestItem.preferredColorValue ?? null,
    preferredSizeValue:
      params.customerItem.preferredSizeValue ?? params.guestItem.preferredSizeValue ?? null,
    sourceSurface: params.customerItem.sourceSurface ?? params.guestItem.sourceSurface ?? null,
    lastInteractedAt: latestLastInteractedAt,
  };
}
