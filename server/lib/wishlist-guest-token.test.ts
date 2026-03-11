import { describe, expect, it } from "vitest";
import {
  WISHLIST_COOKIE_NAME,
} from "@/lib/constants/wishlist";
import {
  hashWishlistGuestToken,
  resolveWishlistGuestSession,
} from "@/lib/wishlist/guest-token";

describe("wishlist guest token", () => {
  it("uses existing wishlist token when cookie is present", () => {
    const request = new Request("http://localhost:3000/api/wishlist", {
      headers: {
        cookie: `${WISHLIST_COOKIE_NAME}=existing-wishlist-token`,
      },
    });

    const session = resolveWishlistGuestSession(request);

    expect(session.token).toBe("existing-wishlist-token");
    expect(session.tokenHash).toBe(hashWishlistGuestToken("existing-wishlist-token"));
    expect(session.isNew).toBe(false);
  });

  it("generates a new token when cookie is missing", () => {
    const request = new Request("http://localhost:3000/api/wishlist");

    const session = resolveWishlistGuestSession(request);

    expect(session.token).toMatch(/[0-9a-f-]{36}/i);
    expect(session.tokenHash).toBe(hashWishlistGuestToken(session.token));
    expect(session.isNew).toBe(true);
  });

  it("does not throw for malformed percent-encoded cookies", () => {
    const request = new Request("http://localhost:3000/api/wishlist", {
      headers: {
        cookie: `theme=%E0%A4%A; ${WISHLIST_COOKIE_NAME}=stable-wishlist-token`,
      },
    });

    const session = resolveWishlistGuestSession(request);

    expect(session.token).toBe("stable-wishlist-token");
    expect(session.isNew).toBe(false);
  });
});
