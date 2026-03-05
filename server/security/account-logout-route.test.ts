import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOutCurrentSessionMock } = vi.hoisted(() => ({
  signOutCurrentSessionMock: vi.fn(),
}));

vi.mock("@/server/auth/auth-service", () => ({
  signOutCurrentSession: signOutCurrentSessionMock,
}));

import { POST as logoutPost } from "@/app/api/account/auth/logout/route";

describe("account logout route", () => {
  beforeEach(() => {
    signOutCurrentSessionMock.mockReset();
  });

  it("returns ok even if no explicit session context is provided", async () => {
    signOutCurrentSessionMock.mockResolvedValueOnce(undefined);

    const response = await logoutPost();
    const payload = await response.json();

    expect(signOutCurrentSessionMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
  });
});

