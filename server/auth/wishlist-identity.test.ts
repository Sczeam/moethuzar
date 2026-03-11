import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveCustomerFromSession: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("@/server/auth/customer-identity", () => ({
  resolveCustomerFromSession: mocks.resolveCustomerFromSession,
}));

vi.mock("@/lib/observability", () => ({
  logWarn: mocks.logWarn,
}));

import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { hashWishlistGuestToken } from "@/lib/wishlist/guest-token";
import { WISHLIST_COOKIE_NAME } from "@/lib/constants/wishlist";

describe("resolveWishlistIdentity", () => {
  beforeEach(() => {
    mocks.resolveCustomerFromSession.mockReset();
    mocks.logWarn.mockReset();
  });

  it("returns customer identity when session resolves to a customer", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "customer",
      customerId: "23d6344c-9d37-4f11-9377-5fb6cfe305f0",
      authUserId: "6d491f3c-c006-46bb-a433-32309d31d7df",
      email: "moe@example.com",
    });

    const request = new Request("http://localhost:3000/api/wishlist", {
      headers: {
        cookie: `${WISHLIST_COOKIE_NAME}=guest-wishlist-token`,
      },
    });

    await expect(resolveWishlistIdentity(request)).resolves.toEqual({
      kind: "customer",
      customerId: "23d6344c-9d37-4f11-9377-5fb6cfe305f0",
      authUserId: "6d491f3c-c006-46bb-a433-32309d31d7df",
      email: "moe@example.com",
      guestSession: {
        token: "guest-wishlist-token",
        tokenHash: hashWishlistGuestToken("guest-wishlist-token"),
        isNew: false,
      },
    });
  });

  it("does not mint a guest token for signed-in customers without an existing wishlist cookie", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "customer",
      customerId: "23d6344c-9d37-4f11-9377-5fb6cfe305f0",
      authUserId: "6d491f3c-c006-46bb-a433-32309d31d7df",
      email: "moe@example.com",
    });

    const request = new Request("http://localhost:3000/api/wishlist");

    await expect(resolveWishlistIdentity(request)).resolves.toEqual({
      kind: "customer",
      customerId: "23d6344c-9d37-4f11-9377-5fb6cfe305f0",
      authUserId: "6d491f3c-c006-46bb-a433-32309d31d7df",
      email: "moe@example.com",
      guestSession: null,
    });
  });

  it("returns guest identity with hashed guest token when no session exists", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });

    const request = new Request("http://localhost:3000/api/wishlist", {
      headers: {
        cookie: `${WISHLIST_COOKIE_NAME}=guest-wishlist-token`,
      },
    });

    await expect(resolveWishlistIdentity(request)).resolves.toEqual({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      guestSession: {
        token: "guest-wishlist-token",
        tokenHash: hashWishlistGuestToken("guest-wishlist-token"),
        isNew: false,
      },
      reason: "NO_SESSION",
    });
  });

  it("issues a new guest token and logs when guest identity is created", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "AUTH_LOOKUP_FAILED",
    });

    const request = new Request("http://localhost:3000/api/wishlist", {
      headers: {
        "x-request-id": "req-wishlist-1",
      },
    });

    const identity = await resolveWishlistIdentity(request);

    expect(identity.kind).toBe("guest");
    if (identity.kind !== "guest") {
      throw new Error("Expected guest identity");
    }
    expect(identity.guestSession.isNew).toBe(true);
    expect(identity.guestSession.tokenHash).toBe(hashWishlistGuestToken(identity.guestSession.token));
    expect(mocks.logWarn).toHaveBeenCalledWith({
      event: "wishlist_identity.guest_token_issued",
      requestId: "req-wishlist-1",
      reason: "AUTH_LOOKUP_FAILED",
    });
  });
});
