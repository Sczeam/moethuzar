import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: updateSessionMock,
}));

import { proxy } from "@/proxy";

function nextRequest(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

describe("proxy account guard behavior", () => {
  beforeEach(() => {
    updateSessionMock.mockReset();
  });

  it("redirects unauthenticated /account to /account/login", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(nextRequest("/account"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/account/login?next=%2Faccount");
  });

  it("does not redirect unauthenticated /account/login", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(nextRequest("/account/login"));
    expect(response.status).toBe(200);
  });

  it("redirects authenticated /account/login to /account", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: { id: "user-1" },
    });

    const response = await proxy(nextRequest("/account/login"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/account");
  });

  it("allows unauthenticated account auth API routes (no proxy redirect loop)", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(nextRequest("/api/account/auth/logout"));
    expect(response.status).toBe(200);
  });
});

