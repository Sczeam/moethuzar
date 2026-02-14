import { prisma } from "@/lib/prisma";
import { getSupabaseClient } from "@/lib/supabase";
import { AppError } from "@/server/errors";

function extractBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    throw new AppError("Missing authorization header.", 401, "UNAUTHORIZED");
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization header.", 401, "UNAUTHORIZED");
  }

  return token;
}

export async function requireAdminUserId(request: Request): Promise<string> {
  const token = extractBearerToken(request);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AppError("Invalid access token.", 401, "UNAUTHORIZED");
  }

  const authUserId = data.user.id;

  const adminUser = await prisma.adminUser.findUnique({
    where: { authUserId },
    select: { id: true, isActive: true },
  });

  if (!adminUser || !adminUser.isActive) {
    throw new AppError("Invalid admin identity.", 403, "FORBIDDEN");
  }

  return adminUser.id;
}
