import { describe, expect, it } from "vitest";
import { WishlistBadgeType } from "@prisma/client";
import { deriveWishlistProjection, type WishlistProjectionSource } from "@/server/domain/wishlist-view";

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
    lastInteractedAt: new Date("2026-03-11T10:00:00.000Z"),
    product: {
      id: "product-1",
      name: "Midnight Bloom Blazer Set",
      slug: "midnight-bloom-blazer-set",
      price: "15000.00",
      currency: "MMK",
      status: "ACTIVE",
      primaryImageUrl: "https://example.com/a.jpg",
      variants: [
        {
          id: "variant-1",
          inventory: 8,
          isActive: true,
          price: "15000.00",
        },
      ],
    },
    ...overrides,
  };
}

describe("deriveWishlistProjection", () => {
  it("derives available projection with no badge", () => {
    const projection = deriveWishlistProjection(buildSource(), new Date("2026-03-11T12:00:00.000Z"));

    expect(projection.availabilityState).toBe("AVAILABLE");
    expect(projection.preferredVariantAvailabilityState).toBe("AVAILABLE");
    expect(projection.badgeType).toBe(WishlistBadgeType.NONE);
    expect(projection.currentPriceAmount).toBe("15000.00");
  });

  it("marks archived products as archived", () => {
    const projection = deriveWishlistProjection(
      buildSource({
        product: {
          ...buildSource().product,
          status: "ARCHIVED",
        },
      })
    );

    expect(projection.availabilityState).toBe("ARCHIVED_PRODUCT");
    expect(projection.badgeType).toBe(WishlistBadgeType.ARCHIVED);
  });

  it("marks sold out when no active variant is purchasable", () => {
    const projection = deriveWishlistProjection(
      buildSource({
        product: {
          ...buildSource().product,
          variants: [{ id: "variant-1", inventory: 0, isActive: true, price: "15000.00" }],
        },
      })
    );

    expect(projection.availabilityState).toBe("SOLD_OUT");
    expect(projection.badgeType).toBe(WishlistBadgeType.SOLD_OUT);
    expect(projection.preferredVariantAvailabilityState).toBe("UNAVAILABLE");
  });

  it("marks price drop when current price is below saved price", () => {
    const projection = deriveWishlistProjection(
      buildSource({
        product: {
          ...buildSource().product,
          variants: [{ id: "variant-1", inventory: 6, isActive: true, price: "12000.00" }],
        },
      })
    );

    expect(projection.availabilityState).toBe("AVAILABLE_WITH_DISCOUNT");
    expect(projection.badgeType).toBe(WishlistBadgeType.PRICE_DROP);
    expect(projection.currentPriceAmount).toBe("12000.00");
  });

  it("marks low stock when preferred variant inventory is low", () => {
    const projection = deriveWishlistProjection(
      buildSource({
        product: {
          ...buildSource().product,
          variants: [{ id: "variant-1", inventory: 2, isActive: true, price: "15000.00" }],
        },
      })
    );

    expect(projection.badgeType).toBe(WishlistBadgeType.LOW_STOCK);
  });

  it("uses not set when there is no preferred variant", () => {
    const projection = deriveWishlistProjection(
      buildSource({ preferredVariantId: null, product: { ...buildSource().product, variants: [] } })
    );

    expect(projection.preferredVariantAvailabilityState).toBe("NOT_SET");
  });
});
