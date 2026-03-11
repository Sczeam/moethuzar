import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  WISHLIST_COOKIE_NAME,
  WISHLIST_GUEST_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/constants/wishlist";

export type WishlistGuestSession = {
  token: string;
  tokenHash: string;
  isNew: boolean;
};

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const pair of cookieHeader.split(";")) {
    const [rawKey, ...rawValueParts] = pair.trim().split("=");
    if (!rawKey || rawValueParts.length === 0) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    try {
      result[rawKey] = decodeURIComponent(rawValue);
    } catch {
      result[rawKey] = rawValue;
    }
  }

  return result;
}

export function hashWishlistGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function readWishlistGuestSession(request: Request): WishlistGuestSession | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const existingToken = cookies[WISHLIST_COOKIE_NAME];

  if (existingToken) {
    return {
      token: existingToken,
      tokenHash: hashWishlistGuestToken(existingToken),
      isNew: false,
    };
  }

  return null;
}

export function resolveWishlistGuestSession(request: Request): WishlistGuestSession {
  const existingSession = readWishlistGuestSession(request);
  if (existingSession) {
    return existingSession;
  }

  const token = crypto.randomUUID();
  return {
    token,
    tokenHash: hashWishlistGuestToken(token),
    isNew: true,
  };
}

export function attachWishlistGuestCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: WISHLIST_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WISHLIST_GUEST_TOKEN_MAX_AGE_SECONDS,
  });
}
