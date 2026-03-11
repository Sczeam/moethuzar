import type {
  WishlistListResponse,
  WishlistSourceSurface,
  WishlistStatusItem,
} from "@/features/storefront/wishlist/types";

type WishlistStatusResponse = {
  items: WishlistStatusItem[];
};

type WishlistWriteResponse = {
  ok: true;
  item: WishlistStatusItem;
};

type WishlistRemoveResponse = {
  ok: true;
  removed: boolean;
  removedItemId: string | null;
};

function buildError(message: string) {
  return new Error(message);
}

export async function fetchWishlistStatus(productIds: string[]): Promise<WishlistStatusResponse> {
  const query = new URLSearchParams({
    productIds: productIds.join(","),
  });

  const response = await fetch(`/api/wishlist/status?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as WishlistStatusResponse | { error?: string };
  if (!response.ok || !("items" in payload)) {
    throw buildError("Unable to load wishlist status.");
  }

  return payload;
}

export async function saveWishlistItem(input: {
  productId: string;
  preferredVariantId?: string | null;
  preferredColorValue?: string | null;
  preferredSizeValue?: string | null;
  sourceSurface: WishlistSourceSurface;
}): Promise<WishlistStatusItem> {
  const response = await fetch("/api/wishlist/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: input.productId,
      preferredVariantId: input.preferredVariantId ?? undefined,
      preferredColorValue: input.preferredColorValue ?? undefined,
      preferredSizeValue: input.preferredSizeValue ?? undefined,
      sourceSurface: input.sourceSurface,
    }),
  });

  const payload = (await response.json()) as WishlistWriteResponse | { error?: string };
  if (!response.ok || !("item" in payload)) {
    throw buildError("Unable to save wishlist item.");
  }

  return payload.item;
}

export async function removeWishlistItem(productId: string): Promise<WishlistRemoveResponse> {
  const response = await fetch(`/api/wishlist/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });

  const payload = (await response.json()) as WishlistRemoveResponse | { error?: string };
  if (!response.ok || !("ok" in payload)) {
    throw buildError("Unable to remove wishlist item.");
  }

  return payload;
}

export async function fetchWishlistPage(cursor?: string | null): Promise<WishlistListResponse> {
  const query = new URLSearchParams();
  if (cursor) {
    query.set("cursor", cursor);
  }

  const response = await fetch(`/api/wishlist?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as WishlistListResponse | { error?: string };
  if (!response.ok || !("items" in payload)) {
    throw buildError("Unable to load wishlist items.");
  }

  return payload;
}
