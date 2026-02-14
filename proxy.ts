import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login";
}

function isAdminUnauthorizedPath(pathname: string): boolean {
  return pathname === "/admin/unauthorized";
}

function hasAdminRole(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) {
    return false;
  }

  const role = user.app_metadata?.role;
  if (typeof role === "string" && role.toLowerCase() === "admin") {
    return true;
  }

  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles)) {
    return roles.some((entry) => typeof entry === "string" && entry.toLowerCase() === "admin");
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (!isAdminPath(pathname)) {
    return response;
  }

  if (!user && !isAdminLoginPath(pathname)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userIsAdmin = hasAdminRole(user);

  if (user && !userIsAdmin && !isAdminLoginPath(pathname) && !isAdminUnauthorizedPath(pathname)) {
    return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
  }

  if (user && userIsAdmin && isAdminUnauthorizedPath(pathname)) {
    return NextResponse.redirect(new URL("/admin/catalog", request.url));
  }

  if (user && isAdminLoginPath(pathname)) {
    return NextResponse.redirect(new URL("/admin/catalog", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
