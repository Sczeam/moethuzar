import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/server/errors";
import type { AdminUser } from "@prisma/client";

async function findActiveAdminByAuthId(authUserId: string): Promise<AdminUser | null> {
  return prisma.adminUser.findUnique({
    where: { authUserId },
  });
}

export async function requireAdminUser(request: Request): Promise<AdminUser> {
  const supabase = await createClient();
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const { data, error } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

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
