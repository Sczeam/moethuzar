import { describe, expect, it } from "vitest";
import {
  buildWishlistCreateInput,
  buildWishlistPreferenceUpdate,
  mergeWishlistItems,
  resolveWishlistSavedPriceAmount,
} from "@/server/domain/wishlist";
import type { WishlistCanonicalItem, WishlistProductSnapshot } from "@/server/domain/wishlist-types";

function makeItem(overrides: Partial<WishlistCanonicalItem> = {}): WishlistCanonicalItem {
  return {
    id: "item-1",
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

describe("wishlist domain rules", () => {
  it("uses variant price for initial saved price when available", () => {
    expect(resolveWishlistSavedPriceAmount(makeProduct())).toBe("15000.00");
    expect(
      resolveWishlistSavedPriceAmount(makeProduct({ preferredVariant: { ...makeProduct().preferredVariant!, price: null } }))
    ).toBe("18000.00");
  });

  it("preserves existing saved price and preferences when re-saving without new metadata", () => {
    const now = new Date("2026-03-11T12:00:00.000Z");
    const input = buildWishlistCreateInput({
      existing: makeItem(),
      product: makeProduct({ price: "22000.00" }),
      now,
    });

    expect(input.savedPriceAmount).toBe("15000.00");
    expect(input.preferredVariantId).toBe("variant-1");
    expect(input.preferredColorValue).toBe("Black");
    expect(input.preferredSizeValue).toBe("M");
    expect(input.lastInteractedAt).toEqual(now);
  });

  it("applies explicit preference updates and preserves omitted fields", () => {
    const now = new Date("2026-03-11T13:00:00.000Z");
    const input = buildWishlistPreferenceUpdate({
      existing: makeItem(),
      preferredColorValue: null,
      preferredSizeValue: "L",
      now,
    });

    expect(input.preferredVariantId).toBe("variant-1");
    expect(input.preferredColorValue).toBeNull();
    expect(input.preferredSizeValue).toBe("L");
    expect(input.sourceSurface).toBe("PDP");
    expect(input.lastInteractedAt).toEqual(now);
  });

  it("merges guest metadata into customer rows without downgrading customer preferences", () => {
    const merged = mergeWishlistItems({
      customerItem: makeItem({
        preferredVariantId: null,
        preferredColorValue: "Black",
        preferredSizeValue: null,
        sourceSurface: null,
        lastInteractedAt: new Date("2026-03-11T10:00:00.000Z"),
      }),
      guestItem: makeItem({
        id: "guest-item",
        customerId: null,
        guestTokenHash: "guest-hash",
        preferredVariantId: "variant-2",
        preferredColorValue: "White",
        preferredSizeValue: "S",
        sourceSurface: "PLP",
        lastInteractedAt: new Date("2026-03-11T11:30:00.000Z"),
      }),
    });

    expect(merged.preferredVariantId).toBe("variant-2");
    expect(merged.preferredColorValue).toBe("Black");
    expect(merged.preferredSizeValue).toBe("S");
    expect(merged.sourceSurface).toBe("PLP");
    expect(merged.lastInteractedAt).toEqual(new Date("2026-03-11T11:30:00.000Z"));
  });
});
