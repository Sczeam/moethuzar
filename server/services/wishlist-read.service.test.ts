import { describe, expect, it, vi } from "vitest";
import type { WishlistIdentity } from "@/server/domain/wishlist-types";
import { getWishlistStatusForProducts, listWishlistItems } from "@/server/services/wishlist-read.service";
import type { WishlistRepository } from "@/server/repositories/wishlist.repository";
import type { WishlistViewRepository } from "@/server/repositories/wishlist-view.repository";

const CUSTOMER_IDENTITY: WishlistIdentity = {
  kind: "customer",
  customerId: "customer-1",
};

function createDependencies() {
  const repository: WishlistRepository = {
    transaction: vi.fn(),
    findItemByIdentityAndProduct: vi.fn(),
    findItemByIdForIdentity: vi.fn(),
    getProductSnapshotForSave: vi.fn(),
    createWishlistItem: vi.fn(),
    updateWishlistItem: vi.fn(),
    deleteWishlistItem: vi.fn(),
    listGuestItems: vi.fn(),
    listCustomerItemsByProductIds: vi.fn(),
    listItemsByIdentityAndProductIds: vi.fn(async () => []),
    insertOutboxEvent: vi.fn(),
  };

  const viewRepository: WishlistViewRepository = {
    findWishlistProjectionSourceByItemId: vi.fn(),
    listWishlistProjectionSourcesByItemIds: vi.fn(),
    listWishlistViewsByIdentity: vi.fn(async () => []),
    listWishlistProjectionSourcesByProductId: vi.fn(),
    listWishlistProjectionSourcesByPreferredVariantId: vi.fn(),
    findProductIdByVariantId: vi.fn(),
    listWishlistProjectionSourcesForRebuild: vi.fn(),
    upsertWishlistItemView: vi.fn(),
    deleteWishlistItemView: vi.fn(),
    deleteWishlistItemViewsNotInCanonical: vi.fn(),
    listPendingWishlistOutboxEvents: vi.fn(),
    markOutboxEventProcessed: vi.fn(),
    markOutboxEventFailed: vi.fn(),
  };

  return { repository, viewRepository };
}

describe("listWishlistItems", () => {
  it("returns paginated projected rows with encoded cursor", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.viewRepository.listWishlistViewsByIdentity).mockResolvedValueOnce([
      {
        wishlistItemId: "b1111111-1111-1111-1111-111111111111",
        productId: "a1111111-1111-1111-1111-111111111111",
        productName: "Midnight Bloom Blazer Set",
        productSlug: "midnight-bloom-blazer-set",
        primaryImageUrl: "https://example.com/a.jpg",
        currentPriceAmount: "15000.00",
        savedPriceAmount: "17000.00",
        currency: "MMK",
        availabilityState: "AVAILABLE_WITH_DISCOUNT",
        preferredVariantAvailabilityState: "AVAILABLE",
        badgeType: "PRICE_DROP",
        preferredVariantId: null,
        preferredColorValue: null,
        preferredSizeValue: null,
        lastInteractedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
      {
        wishlistItemId: "b2222222-2222-2222-2222-222222222222",
        productId: "a2222222-2222-2222-2222-222222222222",
        productName: "Second Item",
        productSlug: "second-item",
        primaryImageUrl: null,
        currentPriceAmount: "12000.00",
        savedPriceAmount: "12000.00",
        currency: "MMK",
        availabilityState: "AVAILABLE",
        preferredVariantAvailabilityState: "NOT_SET",
        badgeType: "NONE",
        preferredVariantId: null,
        preferredColorValue: null,
        preferredSizeValue: null,
        lastInteractedAt: new Date("2026-03-10T12:00:00.000Z"),
      },
    ]);

    const result = await listWishlistItems(
      { identity: CUSTOMER_IDENTITY, pageSize: 1 },
      dependencies
    );

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(result.items[0]?.badgeType).toBe("PRICE_DROP");
  });

  it("rejects invalid cursors", async () => {
    const dependencies = createDependencies();

    await expect(
      listWishlistItems({ identity: CUSTOMER_IDENTITY, pageSize: 20, cursor: "bad-cursor" }, dependencies)
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
  });
});

describe("getWishlistStatusForProducts", () => {
  it("returns canonical saved state per requested product", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.repository.listItemsByIdentityAndProductIds).mockResolvedValueOnce([
      {
        id: "wishlist-1",
        customerId: "customer-1",
        guestTokenHash: null,
        productId: "product-1",
        preferredVariantId: "variant-1",
        preferredColorValue: "Black",
        preferredSizeValue: "M",
        sourceSurface: "PDP",
        savedPriceAmount: "15000.00",
        savedCurrency: "MMK",
        lastInteractedAt: new Date("2026-03-11T12:00:00.000Z"),
        createdAt: new Date("2026-03-11T12:00:00.000Z"),
        updatedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
    ]);

    const result = await getWishlistStatusForProducts(
      { identity: CUSTOMER_IDENTITY, productIds: ["product-1", "product-2"] },
      dependencies
    );

    expect(result.items).toEqual([
      {
        productId: "product-1",
        saved: true,
        wishlistItemId: "wishlist-1",
        preferredVariantId: "variant-1",
        preferredColorValue: "Black",
        preferredSizeValue: "M",
        lastInteractedAt: "2026-03-11T12:00:00.000Z",
      },
      {
        productId: "product-2",
        saved: false,
        wishlistItemId: null,
        preferredVariantId: null,
        preferredColorValue: null,
        preferredSizeValue: null,
        lastInteractedAt: null,
      },
    ]);
  });
});
