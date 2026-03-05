import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      getUser: mocks.getUser,
    },
  })),
}));

import {
  getCurrentSessionUser,
  signInWithEmailPassword,
  signOutCurrentSession,
} from "@/server/auth/auth-service";

describe("auth-service", () => {
  beforeEach(() => {
    mocks.signInWithPassword.mockReset();
    mocks.signOut.mockReset();
    mocks.getUser.mockReset();
  });

  it("signInWithEmailPassword returns mapped auth user on success", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: "abc" },
        user: { id: "f0d8f1f8-06c9-4f93-96d4-d2f8f364ea4f", email: "admin@example.com" },
      },
      error: null,
    });

    await expect(
      signInWithEmailPassword({ email: "admin@example.com", password: "secret123" })
    ).resolves.toEqual({
      id: "f0d8f1f8-06c9-4f93-96d4-d2f8f364ea4f",
      email: "admin@example.com",
    });
  });

  it("signInWithEmailPassword throws unauthorized on invalid credentials", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: "invalid" },
    });

    await expect(
      signInWithEmailPassword({ email: "admin@example.com", password: "bad" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("getCurrentSessionUser returns null when getUser fails", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid" },
    });

    await expect(getCurrentSessionUser()).resolves.toBeNull();
  });

  it("signOutCurrentSession invokes supabase signOut", async () => {
    mocks.signOut.mockResolvedValueOnce({ error: null });

    await signOutCurrentSession();
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});

