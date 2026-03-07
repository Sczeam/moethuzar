import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  requireCustomerSessionUser: vi.fn(),
  listAccountOrders: vi.fn(),
}));

vi.mock("@/server/auth/customer", () => ({
  requireCustomerSessionUser: mocks.requireCustomerSessionUser,
}));

vi.mock("@/server/services/account-orders.service", () => ({
  listAccountOrders: mocks.listAccountOrders,
}));

import { GET as getAccountOrders } from "@/app/api/account/orders/route";

describe("account orders route", () => {
  beforeEach(() => {
    mocks.requireCustomerSessionUser.mockReset();
    mocks.listAccountOrders.mockReset();
  });

  it("returns unauthorized envelope when session is missing", async () => {
    mocks.requireCustomerSessionUser.mockRejectedValueOnce(
      new AppError("Invalid access token.", 401, "UNAUTHORIZED")
    );

    const response = await getAccountOrders(new Request("http://localhost:3000/api/account/orders"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns requestId + paginated payload for authenticated customer", async () => {
    mocks.requireCustomerSessionUser.mockResolvedValueOnce({
      customerId: "8af0f9de-f3f0-4320-8625-6eb046272f63",
      authUserId: "auth-user-1",
      email: "customer@example.com",
    });
    mocks.listAccountOrders.mockResolvedValueOnce({
      orders: [],
      nextCursor: null,
      hasMore: false,
      pageSize: 20,
    });

    const response = await getAccountOrders(
      new Request("http://localhost:3000/api/account/orders?pageSize=20")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.requestId).toBeTruthy();
    expect(payload.orders).toEqual([]);
    expect(payload.nextCursor).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
    expect(mocks.listAccountOrders).toHaveBeenCalledWith({
      customerId: "8af0f9de-f3f0-4320-8625-6eb046272f63",
      pageSize: 20,
      cursor: undefined,
    });
  });
});

