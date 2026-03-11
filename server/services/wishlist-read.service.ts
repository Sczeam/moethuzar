import {
  decodeWishlistCursor,
  encodeWishlistCursor,
  type WishlistListResponse,
  type WishlistStatusResponse,
} from "@/lib/contracts/wishlist";
import type { WishlistIdentity } from "@/server/domain/wishlist-types";
import { AppError } from "@/server/errors";
import {
  prismaWishlistRepository,
  type WishlistRepository,
} from "@/server/repositories/wishlist.repository";
import {
  prismaWishlistViewRepository,
  type WishlistViewRepository,
} from "@/server/repositories/wishlist-view.repository";

export type WishlistReadServiceDependencies = {
  repository: WishlistRepository;
  viewRepository: WishlistViewRepository;
};

const defaultDependencies: WishlistReadServiceDependencies = {
  repository: prismaWishlistRepository,
  viewRepository: prismaWishlistViewRepository,
};

export async function listWishlistItems(
  input: {
    identity: WishlistIdentity;
    pageSize: number;
    cursor?: string;
  },
  dependencies: WishlistReadServiceDependencies = defaultDependencies
): Promise<WishlistListResponse> {
  const decodedCursor = input.cursor ? decodeWishlistCursor(input.cursor) : null;
  if (input.cursor && !decodedCursor) {
    throw new AppError("Invalid wishlist cursor.", 400, "INVALID_CURSOR");
  }

  const rows = await dependencies.viewRepository.listWishlistViewsByIdentity({
    identity: input.identity,
    cursor: decodedCursor
      ? {
          lastInteractedAt: new Date(decodedCursor.lastInteractedAt),
          wishlistItemId: decodedCursor.id,
        }
      : null,
    take: input.pageSize + 1,
  });

  const hasMore = rows.length > input.pageSize;
  const pageRows = hasMore ? rows.slice(0, input.pageSize) : rows;
  const lastRow = pageRows[pageRows.length - 1];

  return {
    items: pageRows.map((row) => ({
      wishlistItemId: row.wishlistItemId,
      productId: row.productId,
      productName: row.productName,
      slug: row.productSlug,
      primaryImageUrl: row.primaryImageUrl,
      currentPriceAmount: row.currentPriceAmount,
      savedPriceAmount: row.savedPriceAmount,
      currency: row.currency,
      availabilityState: row.availabilityState,
      preferredVariantAvailabilityState: row.preferredVariantAvailabilityState,
      badgeType: row.badgeType,
      preferredVariantId: row.preferredVariantId,
      preferredColorValue: row.preferredColorValue,
      preferredSizeValue: row.preferredSizeValue,
      lastInteractedAt: row.lastInteractedAt.toISOString(),
    })),
    nextCursor:
      hasMore && lastRow
        ? encodeWishlistCursor({
            v: 1,
            lastInteractedAt: lastRow.lastInteractedAt.toISOString(),
            id: lastRow.wishlistItemId,
          })
        : null,
    hasMore,
    pageSize: input.pageSize,
  };
}

export async function getWishlistStatusForProducts(
  input: {
    identity: WishlistIdentity;
    productIds: string[];
  },
  dependencies: WishlistReadServiceDependencies = defaultDependencies
): Promise<WishlistStatusResponse> {
  const items = await dependencies.repository.listItemsByIdentityAndProductIds(input.identity, input.productIds);
  const byProductId = new Map(items.map((item) => [item.productId, item]));

  return {
    items: input.productIds.map((productId) => {
      const item = byProductId.get(productId);
      return {
        productId,
        saved: Boolean(item),
        wishlistItemId: item?.id ?? null,
        preferredVariantId: item?.preferredVariantId ?? null,
        preferredColorValue: item?.preferredColorValue ?? null,
        preferredSizeValue: item?.preferredSizeValue ?? null,
        lastInteractedAt: item?.lastInteractedAt.toISOString() ?? null,
      };
    }),
  };
}
