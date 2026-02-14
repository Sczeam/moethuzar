import { describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter } from "@/server/security/rate-limiter";

describe("MemoryRateLimiter", () => {
  it("blocks when the request count is above max within the same window", () => {
    const limiter = new MemoryRateLimiter();
    const options = { windowMs: 60_000, max: 2 };

    const first = limiter.check("checkout:127.0.0.1", options);
    const second = limiter.check("checkout:127.0.0.1", options);
    const third = limiter.check("checkout:127.0.0.1", options);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets usage after window expiration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T00:00:00.000Z"));

    const limiter = new MemoryRateLimiter();
    const options = { windowMs: 1_000, max: 1 };

    const first = limiter.check("adminLogin:127.0.0.1", options);
    const second = limiter.check("adminLogin:127.0.0.1", options);
    vi.advanceTimersByTime(1_100);
    const third = limiter.check("adminLogin:127.0.0.1", options);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(third.allowed).toBe(true);

    vi.useRealTimers();
  });
});
