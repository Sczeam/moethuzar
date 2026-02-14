import { NextResponse } from "next/server";

export const CART_COOKIE_NAME = "cart_token";

type CartSession = {
  token: string;
  isNew: boolean;
};

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const pairs = cookieHeader.split(";");
  const result: Record<string, string> = {};

  for (const pair of pairs) {
    const [rawKey, ...rawValueParts] = pair.trim().split("=");
    if (!rawKey || rawValueParts.length === 0) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    try {
      result[rawKey] = decodeURIComponent(rawValue);
    } catch {
      // Keep raw value if decoding fails so one malformed cookie doesn't break cart/session flow.
      result[rawKey] = rawValue;
    }
  }

  return result;
}

export function resolveCartSession(request: Request): CartSession {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const existingToken = cookies[CART_COOKIE_NAME];

  if (existingToken) {
    return { token: existingToken, isNew: false };
  }

  return { token: crypto.randomUUID(), isNew: true };
}

export function attachCartCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CART_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
