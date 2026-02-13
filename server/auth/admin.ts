import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";

const ADMIN_HEADER = "x-admin-user-id";

export async function requireAdminUserId(request: Request): Promise<string> {
  const adminUserId = request.headers.get(ADMIN_HEADER);

  if (!adminUserId) {
    throw new AppError("Missing admin identity header.", 401, "UNAUTHORIZED");
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { id: true, isActive: true },
  });

  if (!adminUser || !adminUser.isActive) {
    throw new AppError("Invalid admin identity.", 403, "FORBIDDEN");
  }

  return adminUser.id;
}
