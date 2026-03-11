import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  redirect: vi.fn(),
  isNextRedirectError: vi.fn(),
  signInWithEmailPassword: vi.fn(),
  mergeWishlistAfterCustomerAuth: vi.fn(),
  rateLimitOrResponse: vi.fn(),
  logAuthFailureEvent: vi.fn(),
  mapAuthActionError: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/action-errors", () => ({
  isNextRedirectError: mocks.isNextRedirectError,
}));

vi.mock("@/server/auth/auth-service", () => ({
  signInWithEmailPassword: mocks.signInWithEmailPassword,
}));

vi.mock("@/server/services/wishlist-auth-merge.service", () => ({
  mergeWishlistAfterCustomerAuth: mocks.mergeWishlistAfterCustomerAuth,
}));

vi.mock("@/server/security/rate-limit", () => ({
  rateLimitOrResponse: mocks.rateLimitOrResponse,
}));

vi.mock("@/server/observability/auth-events", () => ({
  logAuthFailureEvent: mocks.logAuthFailureEvent,
}));

vi.mock("@/server/auth/auth-action-error", () => ({
  mapAuthActionError: mocks.mapAuthActionError,
}));

import { accountLoginAction } from "@/app/account/login/actions";

describe("accountLoginAction", () => {
  beforeEach(() => {
    mocks.headers.mockReset();
    mocks.redirect.mockReset();
    mocks.isNextRedirectError.mockReset();
    mocks.signInWithEmailPassword.mockReset();
    mocks.mergeWishlistAfterCustomerAuth.mockReset();
    mocks.rateLimitOrResponse.mockReset();
    mocks.logAuthFailureEvent.mockReset();
    mocks.mapAuthActionError.mockReset();

    mocks.headers.mockResolvedValue(new Headers([["x-request-id", "req-1"]]));
    mocks.rateLimitOrResponse.mockReturnValue(null);
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mocks.isNextRedirectError.mockReturnValue(true);
  });

  it("preserves login success and redirect behavior when merge succeeds", async () => {
    mocks.signInWithEmailPassword.mockResolvedValueOnce({
      id: "auth-1",
      email: "customer@example.com",
    });
    mocks.mergeWishlistAfterCustomerAuth.mockResolvedValueOnce({
      status: "merged",
      reasonCode: "MERGED",
      customerId: "customer-1",
      mergedCount: 1,
    });

    const formData = new FormData();
    formData.set("email", "customer@example.com");
    formData.set("password", "secret123");
    formData.set("nextPath", "/account/orders");

    await expect(
      accountLoginAction({ ok: false, code: "OK", error: "", requestId: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.mergeWishlistAfterCustomerAuth).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/account/orders");
  });

  it("preserves login success and redirect behavior when merge fails", async () => {
    mocks.signInWithEmailPassword.mockResolvedValueOnce({
      id: "auth-1",
      email: "customer@example.com",
    });
    mocks.mergeWishlistAfterCustomerAuth.mockResolvedValueOnce({
      status: "failed",
      reasonCode: "MERGE_FAILED",
      customerId: "customer-1",
      mergedCount: 0,
    });

    const formData = new FormData();
    formData.set("email", "customer@example.com");
    formData.set("password", "secret123");
    formData.set("nextPath", "/account");

    await expect(
      accountLoginAction({ ok: false, code: "OK", error: "", requestId: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.mergeWishlistAfterCustomerAuth).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/account");
  });
});
