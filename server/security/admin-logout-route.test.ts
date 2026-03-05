import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOutCurrentSessionMock } = vi.hoisted(() => ({
  signOutCurrentSessionMock: vi.fn(),
}));

vi.mock("@/server/auth/auth-service", () => ({
  signOutCurrentSession: signOutCurrentSessionMock,
}));

import { POST as logoutPost } from "@/app/api/admin/auth/logout/route";

describe("admin logout route", () => {
  beforeEach(() => {
    signOutCurrentSessionMock.mockReset();
  });

  it("signs out current session and returns ok response", async () => {
    signOutCurrentSessionMock.mockResolvedValueOnce(undefined);

    const response = await logoutPost();
    const payload = await response.json();

    expect(signOutCurrentSessionMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
  });
});

