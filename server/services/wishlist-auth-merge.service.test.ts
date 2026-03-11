import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readWishlistGuestSession: vi.fn(),
  resolveCustomerFromAuthUser: vi.fn(),
  mergeGuestWishlistIntoCustomer: vi.fn(),
  logWishlistAuthMergeFailure: vi.fn(),
}));

vi.mock("@/lib/wishlist/guest-token", () => ({
  readWishlistGuestSession: mocks.readWishlistGuestSession,
}));

vi.mock("@/server/auth/customer-identity", () => ({
  resolveCustomerFromAuthUser: mocks.resolveCustomerFromAuthUser,
}));

vi.mock("@/server/services/wishlist-write.service", () => ({
  mergeGuestWishlistIntoCustomer: mocks.mergeGuestWishlistIntoCustomer,
}));

vi.mock("@/server/observability/wishlist-events", () => ({
  logWishlistAuthMergeFailure: mocks.logWishlistAuthMergeFailure,
}));

import { mergeWishlistAfterCustomerAuth } from "@/server/services/wishlist-auth-merge.service";

describe("mergeWishlistAfterCustomerAuth", () => {
  beforeEach(() => {
    mocks.readWishlistGuestSession.mockReset();
    mocks.resolveCustomerFromAuthUser.mockReset();
    mocks.mergeGuestWishlistIntoCustomer.mockReset();
    mocks.logWishlistAuthMergeFailure.mockReset();
  });

  it("skips cleanly when no guest token exists", async () => {
    mocks.readWishlistGuestSession.mockReturnValueOnce(null);

    await expect(
      mergeWishlistAfterCustomerAuth({
        requestHeaders: new Headers(),
        requestId: "req-1",
        authUserId: "auth-1",
        email: "customer@example.com",
      })
    ).resolves.toEqual({
      status: "skipped",
      reasonCode: "NO_GUEST_TOKEN",
      customerId: null,
      mergedCount: 0,
    });
  });

  it("merges when a guest token and customer identity are available", async () => {
    mocks.readWishlistGuestSession.mockReturnValueOnce({
      token: "raw-token",
      tokenHash: "hashed-token",
      isNew: false,
    });
    mocks.resolveCustomerFromAuthUser.mockResolvedValueOnce({
      kind: "customer",
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
    });
    mocks.mergeGuestWishlistIntoCustomer.mockResolvedValueOnce({
      mergedCount: 2,
      transferredCount: 1,
      deduplicatedCount: 1,
    });

    await expect(
      mergeWishlistAfterCustomerAuth({
        requestHeaders: new Headers([["cookie", "wishlistGuestToken=raw-token"]]),
        requestId: "req-1",
        authUserId: "auth-1",
        email: "customer@example.com",
      })
    ).resolves.toEqual({
      status: "merged",
      reasonCode: "MERGED",
      customerId: "customer-1",
      mergedCount: 2,
    });
  });

  it("logs and skips when customer resolution cannot produce a customer row", async () => {
    mocks.readWishlistGuestSession.mockReturnValueOnce({
      token: "raw-token",
      tokenHash: "hashed-token",
      isNew: false,
    });
    mocks.resolveCustomerFromAuthUser.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "CUSTOMER_LOOKUP_FAILED",
    });

    await expect(
      mergeWishlistAfterCustomerAuth({
        requestHeaders: new Headers([["cookie", "wishlistGuestToken=raw-token"]]),
        requestId: "req-1",
        authUserId: "auth-1",
        email: "customer@example.com",
      })
    ).resolves.toEqual({
      status: "skipped",
      reasonCode: "CUSTOMER_LOOKUP_FAILED",
      customerId: null,
      mergedCount: 0,
    });

    expect(mocks.logWishlistAuthMergeFailure).toHaveBeenCalledWith({
      event: "wishlist.auth_merge.failed",
      requestId: "req-1",
      customerId: null,
      reasonCode: "CUSTOMER_LOOKUP_FAILED",
    });
  });

  it("logs and returns failed when merge throws", async () => {
    mocks.readWishlistGuestSession.mockReturnValueOnce({
      token: "raw-token",
      tokenHash: "hashed-token",
      isNew: false,
    });
    mocks.resolveCustomerFromAuthUser.mockResolvedValueOnce({
      kind: "customer",
      customerId: "customer-1",
      authUserId: "auth-1",
      email: "customer@example.com",
    });
    mocks.mergeGuestWishlistIntoCustomer.mockRejectedValueOnce(new Error("db down"));

    await expect(
      mergeWishlistAfterCustomerAuth({
        requestHeaders: new Headers([["cookie", "wishlistGuestToken=raw-token"]]),
        requestId: "req-1",
        authUserId: "auth-1",
        email: "customer@example.com",
      })
    ).resolves.toEqual({
      status: "failed",
      reasonCode: "MERGE_FAILED",
      customerId: "customer-1",
      mergedCount: 0,
    });

    expect(mocks.logWishlistAuthMergeFailure).toHaveBeenCalledWith({
      event: "wishlist.auth_merge.failed",
      requestId: "req-1",
      customerId: "customer-1",
      reasonCode: "MERGE_FAILED",
    });
  });
});
