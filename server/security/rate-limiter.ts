export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export interface RateLimiter {
  check(key: string, options: RateLimitOptions): RateLimitResult;
}

type MemoryEntry = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimiter implements RateLimiter {
  private readonly store = new Map<string, MemoryEntry>();

  check(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const existing = this.store.get(key);
    const shouldReset = !existing || now >= existing.resetAt;

    const entry = shouldReset
      ? {
          count: 1,
          resetAt: now + options.windowMs,
        }
      : {
          count: existing.count + 1,
          resetAt: existing.resetAt,
        };

    this.store.set(key, entry);

    const allowed = entry.count <= options.max;
    const remaining = Math.max(options.max - entry.count, 0);
    const retryAfterSec = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);

    return {
      allowed,
      limit: options.max,
      remaining,
      resetAt: entry.resetAt,
      retryAfterSec,
    };
  }

  reset() {
    this.store.clear();
  }
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __moethuzarRateLimiter?: MemoryRateLimiter;
};

const sharedRateLimiter =
  globalForRateLimit.__moethuzarRateLimiter ?? new MemoryRateLimiter();

if (!globalForRateLimit.__moethuzarRateLimiter) {
  globalForRateLimit.__moethuzarRateLimiter = sharedRateLimiter;
}

export const rateLimiter: RateLimiter = sharedRateLimiter;

export function resetRateLimiterForTests() {
  sharedRateLimiter.reset();
}
