export type WishlistIdentity =
  | {
      kind: "customer";
      customerId: string;
    }
  | {
      kind: "guest";
      guestTokenHash: string;
    };

export type WishlistCanonicalItem = {
  id: string;
  customerId: string | null;
  guestTokenHash: string | null;
  productId: string;
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  sourceSurface: string | null;
  savedPriceAmount: string;
  savedCurrency: string;
  lastInteractedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type WishlistProductVariantSnapshot = {
  id: string;
  productId: string;
  isActive: boolean;
  color: string | null;
  size: string | null;
  price: string | null;
};

export type WishlistProductSnapshot = {
  id: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  price: string;
  currency: string;
  preferredVariant: WishlistProductVariantSnapshot | null;
};

export type WishlistOutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  eventType:
    | "wishlist.item.saved"
    | "wishlist.item.removed"
    | "wishlist.item.preference.updated"
    | "wishlist.identity.merged";
  payload: Record<string, unknown>;
  availableAt?: Date;
};

export type WishlistSaveCommand = {
  identity: WishlistIdentity;
  productId: string;
  preferredVariantId?: string;
  preferredColorValue?: string;
  preferredSizeValue?: string;
  sourceSurface?: string;
  now?: Date;
};

export type WishlistUpdatePreferencesCommand = {
  identity: WishlistIdentity;
  wishlistItemId: string;
  preferredVariantId?: string | null;
  preferredColorValue?: string | null;
  preferredSizeValue?: string | null;
  sourceSurface?: string;
  now?: Date;
};

export type WishlistRemoveCommand = {
  identity: WishlistIdentity;
  productId: string;
};

export type WishlistMergeCommand = {
  customerId: string;
  guestTokenHash: string;
  now?: Date;
};

export type WishlistSaveResult = {
  item: WishlistCanonicalItem;
  created: boolean;
};

export type WishlistRemoveResult = {
  removed: boolean;
  removedItemId: string | null;
};

export type WishlistMergeResult = {
  mergedCount: number;
  transferredCount: number;
  deduplicatedCount: number;
};
