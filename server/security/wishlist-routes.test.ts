import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  resolveWishlistIdentity: vi.fn(),
  requireCustomerSessionUser: vi.fn(),
  saveWishlistItem: vi.fn(),
  removeWishlistItem: vi.fn(),
  updateWishlistPreferences: vi.fn(),
  listWishlistItems: vi.fn(),
  getWishlistStatusForProducts: vi.fn(),
  mergeGuestWishlistIntoCustomer: vi.fn(),
  attachWishlistGuestCookie: vi.fn(),
  readWishlistGuestSession: vi.fn(),
  hashWishlistGuestToken: vi.fn((value: string) => `hashed:${value}`),
}));

vi.mock("@/server/auth/wishlist-identity", () => ({
  resolveWishlistIdentity: mocks.resolveWishlistIdentity,
}));

vi.mock("@/server/auth/customer", () => ({
  requireCustomerSessionUser: mocks.requireCustomerSessionUser,
}));

vi.mock("@/server/services/wishlist-write.service", () => ({
  saveWishlistItem: mocks.saveWishlistItem,
  removeWishlistItem: mocks.removeWishlistItem,
  updateWishlistPreferences: mocks.updateWishlistPreferences,
  mergeGuestWishlistIntoCustomer: mocks.mergeGuestWishlistIntoCustomer,
}));

vi.mock("@/server/services/wishlist-read.service", () => ({
  listWishlistItems: mocks.listWishlistItems,
  getWishlistStatusForProducts: mocks.getWishlistStatusForProducts,
}));

vi.mock("@/lib/wishlist/guest-token", () => ({
  attachWishlistGuestCookie: mocks.attachWishlistGuestCookie,
  readWishlistGuestSession: mocks.readWishlistGuestSession,
  hashWishlistGuestToken: mocks.hashWishlistGuestToken,
}));

import { POST as postWishlistItem } from "@/app/api/wishlist/items/route";
import { DELETE as deleteWishlistItem } from "@/app/api/wishlist/items/[productId]/route";
import { PATCH as patchWishlistPreferences } from "@/app/api/wishlist/preferences/[wishlistItemId]/route";
import { GET as getWishlist } from "@/app/api/wishlist/route";
import { GET as getWishlistStatus } from "@/app/api/wishlist/status/route";
import { POST as postWishlistMerge } from "@/app/api/wishlist/merge/route";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const WISHLIST_ITEM_ID = "22222222-2222-4222-8222-222222222222";
const PREFERRED_VARIANT_ID = "33333333-3333-4333-8333-333333333333";

describe("wishlist routes", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset?.();
    }
    mocks.hashWishlistGuestToken.mockImplementation((value: string) => `hashed:${value}`);
  });

  it("creates a wishlist item for a new guest and attaches the guest cookie", async () => {
    mocks.resolveWishlistIdentity.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      guestSession: {
        token: "guest-token",
        tokenHash: "hashed:guest-token",
        isNew: true,
      },
      reason: "NO_SESSION",
    });
    mocks.saveWishlistItem.mockResolvedValueOnce({
      created: true,
      item: {
        id: "wishlist-1",
        customerId: null,
        guestTokenHash: "hashed:guest-token",
        productId: PRODUCT_ID,
        preferredVariantId: null,
        preferredColorValue: null,
        preferredSizeValue: null,
        sourceSurface: "PDP",
        savedPriceAmount: "15000.00",
        savedCurrency: "MMK",
        lastInteractedAt: new Date("2026-03-11T12:00:00.000Z"),
        createdAt: new Date("2026-03-11T12:00:00.000Z"),
        updatedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
    });

    const response = await postWishlistItem(
      new Request("http://localhost:3000/api/wishlist/items", {
        method: "POST",
        body: JSON.stringify({
          productId: PRODUCT_ID,
          sourceSurface: "PDP",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.item.saved).toBe(true);
    expect(mocks.saveWishlistItem).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: { kind: "guest", guestTokenHash: "hashed:guest-token" },
      })
    );
    expect(mocks.attachWishlistGuestCookie).toHaveBeenCalledTimes(1);
  });

  it("deletes a wishlist item for the resolved identity", async () => {
    mocks.resolveWishlistIdentity.mockResolvedValueOnce({
      kind: "customer",
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
      guestSession: null,
    });
    mocks.removeWishlistItem.mockResolvedValueOnce({ removed: true, removedItemId: "wishlist-1" });

    const response = await deleteWishlistItem(
      new Request(`http://localhost:3000/api/wishlist/items/${PRODUCT_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ productId: PRODUCT_ID }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.removed).toBe(true);
    expect(mocks.removeWishlistItem).toHaveBeenCalledWith({
      identity: { kind: "customer", customerId: "customer-1" },
      productId: PRODUCT_ID,
    });
  });

  it("updates preferences only for the resolved identity", async () => {
    mocks.resolveWishlistIdentity.mockResolvedValueOnce({
      kind: "customer",
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
      guestSession: null,
    });
    mocks.updateWishlistPreferences.mockResolvedValueOnce({
      id: "wishlist-1",
      customerId: "customer-1",
      guestTokenHash: null,
      productId: PRODUCT_ID,
      preferredVariantId: PREFERRED_VARIANT_ID,
      preferredColorValue: "Black",
      preferredSizeValue: "M",
      sourceSurface: "PDP",
      savedPriceAmount: "15000.00",
      savedCurrency: "MMK",
      lastInteractedAt: new Date("2026-03-11T12:00:00.000Z"),
      createdAt: new Date("2026-03-11T12:00:00.000Z"),
      updatedAt: new Date("2026-03-11T12:00:00.000Z"),
    });

    const response = await patchWishlistPreferences(
      new Request(`http://localhost:3000/api/wishlist/preferences/${WISHLIST_ITEM_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ preferredColorValue: "Black", preferredSizeValue: "M" }),
      }),
      { params: Promise.resolve({ wishlistItemId: WISHLIST_ITEM_ID }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.item.preferredColorValue).toBe("Black");
  });

  it("lists wishlist items with request id and no-store headers", async () => {
    mocks.resolveWishlistIdentity.mockResolvedValueOnce({
      kind: "customer",
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
      guestSession: null,
    });
    mocks.listWishlistItems.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasMore: false,
      pageSize: 24,
    });

    const response = await getWishlist(new Request("http://localhost:3000/api/wishlist?pageSize=24"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toEqual([]);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  it("returns canonical batch status and attaches guest cookie when a guest token is minted", async () => {
    mocks.resolveWishlistIdentity.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      guestSession: {
        token: "guest-token",
        tokenHash: "hashed:guest-token",
        isNew: true,
      },
      reason: "NO_SESSION",
    });
    mocks.getWishlistStatusForProducts.mockResolvedValueOnce({
      items: [
        {
          productId: PRODUCT_ID,
          saved: false,
          wishlistItemId: null,
          preferredVariantId: null,
          preferredColorValue: null,
          preferredSizeValue: null,
          lastInteractedAt: null,
        },
      ],
    });

    const response = await getWishlistStatus(
      new Request(`http://localhost:3000/api/wishlist/status?productIds=${PRODUCT_ID}`)
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items[0]?.saved).toBe(false);
    expect(mocks.attachWishlistGuestCookie).toHaveBeenCalledTimes(1);
  });

  it("requires customer auth for merge", async () => {
    mocks.requireCustomerSessionUser.mockRejectedValueOnce(
      new AppError("Invalid access token.", 401, "UNAUTHORIZED")
    );

    const response = await postWishlistMerge(
      new Request("http://localhost:3000/api/wishlist/merge", { method: "POST", body: JSON.stringify({ guestToken: "raw-guest" }) })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
  });

  it("merges a guest wishlist into the authenticated customer using the hashed guest token", async () => {
    mocks.requireCustomerSessionUser.mockResolvedValueOnce({
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
    });
    mocks.mergeGuestWishlistIntoCustomer.mockResolvedValueOnce({
      mergedCount: 2,
      transferredCount: 1,
      deduplicatedCount: 1,
    });

    const response = await postWishlistMerge(
      new Request("http://localhost:3000/api/wishlist/merge", {
        method: "POST",
        body: JSON.stringify({ guestToken: "raw-guest" }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, mergedCount: 2, skippedCount: 0 });
    expect(mocks.hashWishlistGuestToken).toHaveBeenCalledWith("raw-guest");
    expect(mocks.mergeGuestWishlistIntoCustomer).toHaveBeenCalledWith({
      customerId: "customer-1",
      guestTokenHash: "hashed:raw-guest",
    });
  });
});
