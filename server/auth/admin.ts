import { prisma } from "@/lib/prisma";
import { getSupabaseClient } from "@/lib/supabase";
import { AppError } from "@/server/errors";
import type { AdminUser } from "@prisma/client";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/constants/auth";

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

    result[rawKey] = decodeURIComponent(rawValueParts.join("="));
  }

  return result;
}

function extractAccessToken(request: Request): string {
  const authorization = request.headers.get("authorization");

  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError("Invalid authorization header.", 401, "UNAUTHORIZED");
    }

    return token;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const cookieToken = cookies[ADMIN_ACCESS_TOKEN_COOKIE];

  if (!cookieToken) {
    throw new AppError("Missing authorization.", 401, "UNAUTHORIZED");
  }

  return cookieToken;
}

async function findActiveAdminByAuthId(authUserId: string): Promise<AdminUser | null> {
  return prisma.adminUser.findUnique({
    where: { authUserId },
  });
}

export async function requireAdminUser(request: Request): Promise<AdminUser> {
  const token = extractAccessToken(request);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AppError("Invalid access token.", 401, "UNAUTHORIZED");
  }

  const authUserId = data.user.id;
  const adminUser = await findActiveAdminByAuthId(authUserId);

  if (!adminUser || !adminUser.isActive) {
    throw new AppError("Invalid admin identity.", 403, "FORBIDDEN");
  }

  return adminUser;
}

export async function requireAdminUserId(request: Request): Promise<string> {
  const adminUser = await requireAdminUser(request);
  return adminUser.id;
}
