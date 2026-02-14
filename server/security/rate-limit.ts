import { NextResponse } from "next/server";
import { rateLimiter, type RateLimitResult } from "@/server/security/rate-limiter";

type PolicyName = "checkout" | "publicOrderLookup" | "adminLogin";

type RateLimitPolicy = {
  windowMs: number;
  max: number;
};

const POLICIES: Record<PolicyName, RateLimitPolicy> = {
  checkout: { windowMs: 60_000, max: 8 },
  publicOrderLookup: { windowMs: 60_000, max: 30 },
  adminLogin: { windowMs: 60_000, max: 6 },
};

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp && cloudflareIp.trim().length > 0) {
    return cloudflareIp.trim();
  }

  return "unknown";
}

function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitOrResponse(
  request: Request,
  policyName: PolicyName,
  keySuffix?: string
): NextResponse | null {
  const policy = POLICIES[policyName];
  const ip = getClientIp(request);
  const key = keySuffix
    ? `${policyName}:${ip}:${keySuffix}`
    : `${policyName}:${ip}`;
  const result = rateLimiter.check(key, policy);

  if (result.allowed) {
    return null;
  }

  const requestId = getRequestId(request);

  return NextResponse.json(
    {
      ok: false,
      code: "RATE_LIMITED",
      error: "Too many requests. Please try again shortly.",
      requestId,
    },
    {
      status: 429,
      headers: {
        ...buildRateLimitHeaders(result),
        "x-request-id": requestId,
      },
    }
  );
}
