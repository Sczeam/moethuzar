import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  upsert: vi.fn(),
  findUnique: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      upsert: mocks.upsert,
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/observability", () => ({
  logWarn: mocks.logWarn,
  logError: mocks.logError,
}));

import { resolveCustomerFromSession } from "@/server/auth/customer-identity";

describe("resolveCustomerFromSession", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.upsert.mockReset();
    mocks.findUnique.mockReset();
    mocks.logWarn.mockReset();
    mocks.logError.mockReset();
  });

  it("returns guest when session user is absent", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(resolveCustomerFromSession()).resolves.toEqual({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });
  });

  it("returns customer on successful upsert", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "99e6dd34-9543-48e2-bf18-1844fca41453", email: "Aye@Example.com" } },
      error: null,
    });
    mocks.upsert.mockResolvedValueOnce({
      id: "5f0f0cb7-965d-4fd9-ac55-4d3acdc5e6f4",
      authUserId: "99e6dd34-9543-48e2-bf18-1844fca41453",
      email: "aye@example.com",
    });

    await expect(resolveCustomerFromSession()).resolves.toEqual({
      kind: "customer",
      customerId: "5f0f0cb7-965d-4fd9-ac55-4d3acdc5e6f4",
      authUserId: "99e6dd34-9543-48e2-bf18-1844fca41453",
      email: "aye@example.com",
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("degrades to guest when auth user has no email", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "99e6dd34-9543-48e2-bf18-1844fca41453", email: null } },
      error: null,
    });

    await expect(resolveCustomerFromSession()).resolves.toEqual({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "MISSING_EMAIL",
    });
  });

  it("handles unique conflict by resolving existing customer by auth id", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "99e6dd34-9543-48e2-bf18-1844fca41453", email: "aye@example.com" } },
      error: null,
    });
    mocks.upsert.mockRejectedValueOnce({ code: "P2002" });
    mocks.findUnique.mockResolvedValueOnce({
      id: "5f0f0cb7-965d-4fd9-ac55-4d3acdc5e6f4",
      authUserId: "99e6dd34-9543-48e2-bf18-1844fca41453",
      email: "aye@example.com",
    });

    await expect(resolveCustomerFromSession()).resolves.toEqual({
      kind: "customer",
      customerId: "5f0f0cb7-965d-4fd9-ac55-4d3acdc5e6f4",
      authUserId: "99e6dd34-9543-48e2-bf18-1844fca41453",
      email: "aye@example.com",
    });
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });

  it("degrades to guest when customer lookup throws", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "99e6dd34-9543-48e2-bf18-1844fca41453", email: "aye@example.com" } },
      error: null,
    });
    mocks.upsert.mockRejectedValueOnce(new Error("db down"));

    await expect(resolveCustomerFromSession({ requestId: "req-1" })).resolves.toEqual({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "CUSTOMER_LOOKUP_FAILED",
    });
    expect(mocks.logError).toHaveBeenCalledTimes(1);
  });
});
