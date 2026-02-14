import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login";
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

  if (user && isAdminLoginPath(pathname)) {
    return NextResponse.redirect(new URL("/admin/orders", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
