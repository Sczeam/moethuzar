import { describe, expect, it } from "vitest";
import { CART_COOKIE_NAME, resolveCartSession } from "@/lib/cart-session";

describe("cart session", () => {
  it("uses existing cart token when cookie value is valid", () => {
    const request = new Request("http://localhost:3000/api/cart", {
      headers: {
        cookie: `${CART_COOKIE_NAME}=existing-token-123`,
      },
    });

    const session = resolveCartSession(request);

    expect(session.token).toBe("existing-token-123");
    expect(session.isNew).toBe(false);
  });

  it("does not throw for malformed percent-encoded cookies", () => {
    const request = new Request("http://localhost:3000/api/cart", {
      headers: {
        cookie: `theme=%E0%A4%A; ${CART_COOKIE_NAME}=stable-token`,
      },
    });

    const session = resolveCartSession(request);

    expect(session.token).toBe("stable-token");
    expect(session.isNew).toBe(false);
  });
});
