import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/server/auth/auth-service";
import { AppError } from "@/server/errors";
import type { AdminUser } from "@prisma/client";

async function findActiveAdminByAuthId(authUserId: string): Promise<AdminUser | null> {
  return prisma.adminUser.findUnique({
    where: { authUserId },
  });
}

export async function requireActiveAdminByAuthUserId(authUserId: string): Promise<AdminUser> {
  const adminUser = await findActiveAdminByAuthId(authUserId);
  if (!adminUser || !adminUser.isActive) {
    throw new AppError("Admin account is not allowed.", 403, "FORBIDDEN");
  }
  return adminUser;
}

export async function requireAdminUser(request: Request): Promise<AdminUser> {
  const sessionUser = await getCurrentSessionUser(request);
  if (!sessionUser) {
    throw new AppError("Invalid access token.", 401, "UNAUTHORIZED");
  }

  return requireActiveAdminByAuthUserId(sessionUser.id);
}

export async function requireAdminUserId(request: Request): Promise<string> {
  const adminUser = await requireAdminUser(request);
  return adminUser.id;
}
