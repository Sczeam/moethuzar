import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomerSessionUserMock } = vi.hoisted(() => ({
  getCustomerSessionUserMock: vi.fn(),
}));

vi.mock("@/server/auth/customer", () => ({
  getCustomerSessionUser: getCustomerSessionUserMock,
}));

import { GET as getAccountMe } from "@/app/api/account/auth/me/route";

describe("account me route", () => {
  beforeEach(() => {
    getCustomerSessionUserMock.mockReset();
  });

  it("returns minimal user payload with no-store caching", async () => {
    getCustomerSessionUserMock.mockResolvedValueOnce({
      id: "ee2f6077-d4cf-4b8b-8866-e657fcf35921",
      email: "customer@example.com",
    });

    const response = await getAccountMe(new Request("http://localhost:3000/api/account/auth/me"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      ok: true,
      user: {
        id: "ee2f6077-d4cf-4b8b-8866-e657fcf35921",
        email: "customer@example.com",
      },
    });
  });

  it("returns null user when no session", async () => {
    getCustomerSessionUserMock.mockResolvedValueOnce(null);

    const response = await getAccountMe(new Request("http://localhost:3000/api/account/auth/me"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, user: null });
  });
});

