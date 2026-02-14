import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const { requireAdminUserMock } = vi.hoisted(() => ({
  requireAdminUserMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUser: requireAdminUserMock,
}));

import { GET as getAdminMe } from "@/app/api/admin/auth/me/route";

describe("admin auth me route errors", () => {
  beforeEach(() => {
    requireAdminUserMock.mockReset();
  });

  it("returns consistent unauthorized response shape", async () => {
    requireAdminUserMock.mockRejectedValueOnce(
      new AppError("Invalid access token.", 401, "UNAUTHORIZED")
    );

    const response = await getAdminMe(new Request("http://localhost:3000/api/admin/auth/me"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns consistent forbidden response shape", async () => {
    requireAdminUserMock.mockRejectedValueOnce(
      new AppError("Invalid admin identity.", 403, "FORBIDDEN")
    );

    const response = await getAdminMe(new Request("http://localhost:3000/api/admin/auth/me"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("FORBIDDEN");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
