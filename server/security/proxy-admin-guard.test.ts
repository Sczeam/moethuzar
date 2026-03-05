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

describe("proxy admin guard behavior", () => {
  beforeEach(() => {
    updateSessionMock.mockReset();
  });

  it("redirects unauthenticated admin page access to login with next path", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(nextRequest("/admin/catalog"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login?next=%2Fadmin%2Fcatalog");
  });

  it("does not redirect unauthenticated access on admin login page", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(nextRequest("/admin/login"));
    expect(response.status).toBe(200);
  });

  it("redirects authenticated admin away from admin login to catalog", async () => {
    updateSessionMock.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: { app_metadata: { role: "admin" } },
    });

    const response = await proxy(nextRequest("/admin/login"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/catalog");
  });
});

