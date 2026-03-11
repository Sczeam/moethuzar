import { describe, expect, it, vi } from "vitest";
import { WishlistBadgeType } from "@prisma/client";
import type { WishlistProjectionSource } from "@/server/domain/wishlist-view";
import {
  processPendingWishlistOutboxEvents,
  rebuildWishlistItemViews,
  projectCatalogProductUpdated,
  projectCatalogVariantStockChanged,
  projectPromotionEffectivePriceChanged,
} from "@/server/services/wishlist-projector.service";
import type {
  WishlistProjectionOutboxEvent,
  WishlistViewRepository,
} from "@/server/repositories/wishlist-view.repository";

function buildSource(overrides: Partial<WishlistProjectionSource> = {}): WishlistProjectionSource {
  return {
    wishlistItemId: "wishlist-1",
    customerId: "customer-1",
    guestTokenHash: null,
    productId: "product-1",
    preferredVariantId: "variant-1",
    preferredColorValue: "Black",
    preferredSizeValue: "M",
    savedPriceAmount: "15000.00",
    savedCurrency: "MMK",
    lastInteractedAt: new Date("2026-03-11T09:00:00.000Z"),
    product: {
      id: "product-1",
      name: "Midnight Bloom Blazer Set",
      slug: "midnight-bloom-blazer-set",
      price: "15000.00",
      currency: "MMK",
      status: "ACTIVE",
      primaryImageUrl: "https://example.com/image.jpg",
      variants: [{ id: "variant-1", inventory: 6, isActive: true, price: "15000.00" }],
    },
    ...overrides,
  };
}

function buildEvent(overrides: Partial<WishlistProjectionOutboxEvent> = {}): WishlistProjectionOutboxEvent {
  return {
    id: "event-1",
    aggregateType: "wishlist.item",
    aggregateId: "wishlist-1",
    eventType: "wishlist.item.saved",
    payload: { wishlistItemId: "wishlist-1" },
    availableAt: new Date("2026-03-11T10:00:00.000Z"),
    attempts: 0,
    processedAt: null,
    lastError: null,
    createdAt: new Date("2026-03-11T10:00:00.000Z"),
    updatedAt: new Date("2026-03-11T10:00:00.000Z"),
    ...overrides,
  };
}

function createRepository(overrides: Partial<WishlistViewRepository> = {}): WishlistViewRepository {
  return {
    findWishlistProjectionSourceByItemId: vi.fn(async () => buildSource()),
    listWishlistProjectionSourcesByItemIds: vi.fn(async () => [buildSource()]),
    listWishlistProjectionSourcesByProductId: vi.fn(async () => [buildSource()]),
    listWishlistProjectionSourcesByPreferredVariantId: vi.fn(async () => [buildSource()]),
    listWishlistProjectionSourcesForRebuild: vi.fn(async () => ({ items: [buildSource()], nextCursor: null })),
    upsertWishlistItemView: vi.fn(async () => undefined),
    deleteWishlistItemView: vi.fn(async () => undefined),
    deleteWishlistItemViewsNotInCanonical: vi.fn(async () => 0),
    listPendingWishlistOutboxEvents: vi.fn(async () => [buildEvent()]),
    markOutboxEventProcessed: vi.fn(async () => undefined),
    markOutboxEventFailed: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("processPendingWishlistOutboxEvents", () => {
  it("projects save events and marks them processed", async () => {
    const repository = createRepository();
    const result = await processPendingWishlistOutboxEvents({ now: new Date("2026-03-11T12:00:00.000Z") }, { repository });

    expect(result).toEqual({
      processedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      failureEventIds: [],
    });
    expect(repository.upsertWishlistItemView).toHaveBeenCalledTimes(1);
    expect(repository.markOutboxEventProcessed).toHaveBeenCalledWith(
      "event-1",
      new Date("2026-03-11T12:00:00.000Z")
    );
  });

  it("replays duplicate save events safely via upsert", async () => {
    const repository = createRepository({
      listPendingWishlistOutboxEvents: vi.fn(async () => [buildEvent(), buildEvent({ id: "event-2" })]),
    });

    const result = await processPendingWishlistOutboxEvents(undefined, { repository });

    expect(result.processedCount).toBe(2);
    expect(repository.upsertWishlistItemView).toHaveBeenCalledTimes(2);
    expect(repository.markOutboxEventProcessed).toHaveBeenCalledTimes(2);
  });

  it("deletes projection rows for remove events", async () => {
    const repository = createRepository({
      listPendingWishlistOutboxEvents: vi.fn(async () => [
        buildEvent({ eventType: "wishlist.item.removed", payload: { wishlistItemId: "wishlist-1" } }),
      ]),
    });

    await processPendingWishlistOutboxEvents(undefined, { repository });

    expect(repository.deleteWishlistItemView).toHaveBeenCalledWith("wishlist-1");
    expect(repository.upsertWishlistItemView).not.toHaveBeenCalled();
  });

  it("projects merged items and deletes removed guest rows", async () => {
    const repository = createRepository({
      listPendingWishlistOutboxEvents: vi.fn(async () => [
        buildEvent({
          aggregateType: "wishlist.identity",
          aggregateId: "customer-1",
          eventType: "wishlist.identity.merged",
          payload: {
            mergedItemIds: ["wishlist-1", "wishlist-2"],
            removedGuestItemIds: ["guest-1"],
          },
        }),
      ]),
      findWishlistProjectionSourceByItemId: vi.fn(async (wishlistItemId: string) =>
        buildSource({ wishlistItemId, productId: wishlistItemId === "wishlist-2" ? "product-2" : "product-1" })
      ),
    });

    await processPendingWishlistOutboxEvents(undefined, { repository });

    expect(repository.upsertWishlistItemView).toHaveBeenCalledTimes(2);
    expect(repository.deleteWishlistItemView).toHaveBeenCalledWith("guest-1");
  });

  it("marks failures and continues processing", async () => {
    const repository = createRepository({
      listPendingWishlistOutboxEvents: vi.fn(async () => [buildEvent(), buildEvent({ id: "event-2" })]),
      findWishlistProjectionSourceByItemId: vi
        .fn()
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce(buildSource({ wishlistItemId: "wishlist-1" })),
    });

    const now = new Date("2026-03-11T12:00:00.000Z");
    const result = await processPendingWishlistOutboxEvents({ now }, { repository });

    expect(result).toEqual({
      processedCount: 2,
      succeededCount: 1,
      failedCount: 1,
      failureEventIds: ["event-1"],
    });
    expect(repository.markOutboxEventFailed).toHaveBeenCalledWith(
      "event-1",
      "boom",
      new Date(now.getTime() + 60_000)
    );
  });
});

describe("rebuildWishlistItemViews", () => {
  it("rebuilds all canonical rows and deletes orphans", async () => {
    const repository = createRepository({
      listWishlistProjectionSourcesForRebuild: vi
        .fn()
        .mockResolvedValueOnce({ items: [buildSource()], nextCursor: "cursor-1" })
        .mockResolvedValueOnce({ items: [buildSource({ wishlistItemId: "wishlist-2", productId: "product-2" })], nextCursor: null }),
      deleteWishlistItemViewsNotInCanonical: vi.fn(async () => 3),
    });

    const result = await rebuildWishlistItemViews(undefined, { repository });

    expect(result).toEqual({ rebuiltCount: 2, deletedOrphanCount: 3 });
    expect(repository.upsertWishlistItemView).toHaveBeenCalledTimes(2);
  });
});

describe("upstream projector entry points", () => {
  it("projects all rows affected by a product update", async () => {
    const repository = createRepository({
      listWishlistProjectionSourcesByProductId: vi.fn(async () => [buildSource(), buildSource({ wishlistItemId: "wishlist-2" })]),
    });

    const count = await projectCatalogProductUpdated("product-1", { repository });

    expect(count).toBe(2);
    expect(repository.upsertWishlistItemView).toHaveBeenCalledTimes(2);
  });

  it("projects all rows affected by a preferred variant stock change", async () => {
    const repository = createRepository();

    const count = await projectCatalogVariantStockChanged("variant-1", { repository });

    expect(count).toBe(1);
    expect(repository.listWishlistProjectionSourcesByPreferredVariantId).toHaveBeenCalledWith("variant-1");
  });

  it("projects all rows affected by a promotion effective price change", async () => {
    const repository = createRepository({
      listWishlistProjectionSourcesByProductId: vi.fn(async () => [
        buildSource({ savedPriceAmount: "18000.00", product: { ...buildSource().product, variants: [{ id: "variant-1", inventory: 4, isActive: true, price: "15000.00" }] } }),
      ]),
    });

    const count = await projectPromotionEffectivePriceChanged("product-1", { repository });

    expect(count).toBe(1);
    const upsertedRecord = vi.mocked(repository.upsertWishlistItemView).mock.calls[0]?.[0];
    expect(upsertedRecord?.badgeType).toBe(WishlistBadgeType.PRICE_DROP);
  });
});
