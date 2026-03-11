import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";
import type {
  WishlistCanonicalItem,
  WishlistIdentity,
  WishlistProductSnapshot,
} from "@/server/domain/wishlist-types";
import type { WishlistRepository } from "@/server/repositories/wishlist.repository";
import {
  mergeGuestWishlistIntoCustomer,
  removeWishlistItem,
  saveWishlistItem,
  updateWishlistPreferences,
} from "@/server/services/wishlist-write.service";

function makeIdentity(kind: "customer" | "guest"): WishlistIdentity {
  return kind === "customer"
    ? { kind: "customer", customerId: "customer-1" }
    : { kind: "guest", guestTokenHash: "guest-hash-1" };
}

function makeItem(overrides: Partial<WishlistCanonicalItem> = {}): WishlistCanonicalItem {
  return {
    id: "wishlist-item-1",
    customerId: "customer-1",
    guestTokenHash: null,
    productId: "product-1",
    preferredVariantId: "variant-1",
    preferredColorValue: "Black",
    preferredSizeValue: "M",
    sourceSurface: "PDP",
    savedPriceAmount: "15000.00",
    savedCurrency: "MMK",
    lastInteractedAt: new Date("2026-03-11T10:00:00.000Z"),
    createdAt: new Date("2026-03-10T10:00:00.000Z"),
    updatedAt: new Date("2026-03-11T10:00:00.000Z"),
    ...overrides,
  };
}

function makeProduct(overrides: Partial<WishlistProductSnapshot> = {}): WishlistProductSnapshot {
  return {
    id: "product-1",
    status: "ACTIVE",
    price: "18000.00",
    currency: "MMK",
    preferredVariant: {
      id: "variant-1",
      productId: "product-1",
      isActive: true,
      color: "Black",
      size: "M",
      price: "15000.00",
    },
    ...overrides,
  };
}

function createRepositoryDouble() {
  const tx = { kind: "tx" } as never;
  return {
    transaction: vi.fn(async <T>(callback: (tx: never) => Promise<T>): Promise<T> => callback(tx)),
    findItemByIdentityAndProduct: vi.fn(),
    findItemByIdForIdentity: vi.fn(),
    getProductSnapshotForSave: vi.fn(),
    createWishlistItem: vi.fn(),
    updateWishlistItem: vi.fn(),
    deleteWishlistItem: vi.fn(),
    listGuestItems: vi.fn(),
    listCustomerItemsByProductIds: vi.fn(),
    insertOutboxEvent: vi.fn(),
  };
}

describe("wishlist-write.service", () => {
  const now = new Date("2026-03-11T12:00:00.000Z");
  let repository: ReturnType<typeof createRepositoryDouble>;

  beforeEach(() => {
    repository = createRepositoryDouble();
  });

  it("creates a new wishlist item and emits a saved outbox event", async () => {
    repository.getProductSnapshotForSave.mockResolvedValue(makeProduct());
    repository.findItemByIdentityAndProduct.mockResolvedValue(null);
    repository.createWishlistItem.mockResolvedValue(
      makeItem({
        customerId: null,
        guestTokenHash: "guest-hash-1",
        preferredVariantId: "variant-1",
        preferredColorValue: "Black",
        preferredSizeValue: "M",
        sourceSurface: "PDP",
        lastInteractedAt: now,
      })
    );

    const result = await saveWishlistItem(
      {
        identity: makeIdentity("guest"),
        productId: "product-1",
        preferredVariantId: "variant-1",
        preferredColorValue: "Black",
        preferredSizeValue: "M",
        sourceSurface: "PDP",
        now,
      },
      { repository: repository as unknown as WishlistRepository }
    );

    expect(result.created).toBe(true);
    expect(repository.createWishlistItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        guestTokenHash: "guest-hash-1",
        productId: "product-1",
        savedPriceAmount: "15000.00",
        savedCurrency: "MMK",
      })
    );
    expect(repository.insertOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventType: "wishlist.item.saved",
        aggregateId: "wishlist-item-1",
      })
    );
  });

  it("re-saves an existing item without overwriting the initial saved price", async () => {
    repository.getProductSnapshotForSave.mockResolvedValue(makeProduct({ price: "22000.00" }));
    repository.findItemByIdentityAndProduct.mockResolvedValue(makeItem());
    repository.updateWishlistItem.mockResolvedValue(makeItem({ lastInteractedAt: now }));

    const result = await saveWishlistItem(
      {
        identity: makeIdentity("customer"),
        productId: "product-1",
        now,
      },
      { repository: repository as unknown as WishlistRepository }
    );

    expect(result.created).toBe(false);
    expect(repository.updateWishlistItem).toHaveBeenCalledWith(
      expect.anything(),
      "wishlist-item-1",
      expect.objectContaining({
        savedPriceAmount: "15000.00",
        preferredVariantId: "variant-1",
      })
    );
  });

  it("returns removed false when removing a product that is not saved", async () => {
    repository.findItemByIdentityAndProduct.mockResolvedValue(null);

    await expect(
      removeWishlistItem(
        { identity: makeIdentity("customer"), productId: "product-1" },
        { repository: repository as unknown as WishlistRepository }
      )
    ).resolves.toEqual({ removed: false, removedItemId: null });
    expect(repository.deleteWishlistItem).not.toHaveBeenCalled();
  });

  it("updates preferences and emits a preference outbox event", async () => {
    repository.findItemByIdForIdentity.mockResolvedValue(makeItem());
    repository.getProductSnapshotForSave.mockResolvedValue(
      makeProduct({
        preferredVariant: {
          id: "variant-2",
          productId: "product-1",
          isActive: true,
          color: "White",
          size: "L",
          price: "17000.00",
        },
      })
    );
    repository.updateWishlistItem.mockResolvedValue(
      makeItem({
        preferredVariantId: "variant-2",
        preferredColorValue: null,
        preferredSizeValue: "L",
        lastInteractedAt: now,
      })
    );

    const updated = await updateWishlistPreferences(
      {
        identity: makeIdentity("customer"),
        wishlistItemId: "wishlist-item-1",
        preferredVariantId: "variant-2",
        preferredColorValue: null,
        preferredSizeValue: "L",
        now,
      },
      { repository: repository as unknown as WishlistRepository }
    );

    expect(updated.preferredVariantId).toBe("variant-2");
    expect(updated.preferredColorValue).toBeNull();
    expect(repository.insertOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "wishlist.item.preference.updated" })
    );
  });

  it("merges guest items into the customer wishlist without duplicating products", async () => {
    repository.listGuestItems.mockResolvedValue([
      makeItem({
        id: "guest-a",
        customerId: null,
        guestTokenHash: "guest-hash-1",
        productId: "product-a",
        preferredVariantId: "variant-a",
        preferredColorValue: "White",
        preferredSizeValue: null,
        sourceSurface: "PLP",
        lastInteractedAt: new Date("2026-03-11T11:00:00.000Z"),
      }),
      makeItem({
        id: "guest-b",
        customerId: null,
        guestTokenHash: "guest-hash-1",
        productId: "product-b",
        preferredVariantId: null,
        preferredColorValue: null,
        preferredSizeValue: "S",
        sourceSurface: "PDP",
        lastInteractedAt: new Date("2026-03-11T11:15:00.000Z"),
      }),
    ]);
    repository.listCustomerItemsByProductIds.mockResolvedValue([
      makeItem({
        id: "customer-a",
        productId: "product-a",
        preferredVariantId: null,
        preferredColorValue: "Black",
        preferredSizeValue: null,
        sourceSurface: null,
        lastInteractedAt: new Date("2026-03-11T10:00:00.000Z"),
      }),
    ]);
    repository.updateWishlistItem
      .mockResolvedValueOnce(
        makeItem({
          id: "customer-a",
          productId: "product-a",
          preferredVariantId: "variant-a",
          preferredColorValue: "Black",
          preferredSizeValue: null,
          sourceSurface: "PLP",
          lastInteractedAt: new Date("2026-03-11T11:00:00.000Z"),
        })
      )
      .mockResolvedValueOnce(
        makeItem({
          id: "guest-b",
          customerId: "customer-1",
          guestTokenHash: null,
          productId: "product-b",
          preferredVariantId: null,
          preferredColorValue: null,
          preferredSizeValue: "S",
          sourceSurface: "PDP",
          lastInteractedAt: now,
        })
      );

    const result = await mergeGuestWishlistIntoCustomer(
      {
        customerId: "customer-1",
        guestTokenHash: "guest-hash-1",
        now,
      },
      { repository: repository as unknown as WishlistRepository }
    );

    expect(result).toEqual({ mergedCount: 2, transferredCount: 1, deduplicatedCount: 1 });
    expect(repository.deleteWishlistItem).toHaveBeenCalledWith(expect.anything(), "guest-a");
    expect(repository.insertOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "wishlist.identity.merged" })
    );
  });

  it("rejects inactive products and missing variants", async () => {
    repository.getProductSnapshotForSave.mockResolvedValue(makeProduct({ status: "ARCHIVED" }));

    await expect(
      saveWishlistItem(
        { identity: makeIdentity("customer"), productId: "product-1", now },
        { repository: repository as unknown as WishlistRepository }
      )
    ).rejects.toMatchObject({ code: "WISHLIST_PRODUCT_NOT_AVAILABLE" } satisfies Partial<AppError>);

    repository.getProductSnapshotForSave.mockResolvedValue(makeProduct({ preferredVariant: null }));

    await expect(
      saveWishlistItem(
        {
          identity: makeIdentity("customer"),
          productId: "product-1",
          preferredVariantId: "missing-variant",
          now,
        },
        { repository: repository as unknown as WishlistRepository }
      )
    ).rejects.toMatchObject({ code: "WISHLIST_VARIANT_NOT_FOUND" } satisfies Partial<AppError>);
  });
});
