import { createClient } from "@/lib/supabase/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { AppError } from "@/server/errors";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
});

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "adminLogin");
    if (limitedResponse) {
      return limitedResponse;
    }

    const payload = loginSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session || !data.user) {
      throw new AppError("Invalid email or password.", 401, "UNAUTHORIZED");
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { authUserId: data.user.id },
      select: { id: true, email: true, fullName: true, isActive: true, role: true },
    });

    if (!adminUser || !adminUser.isActive) {
      throw new AppError("Admin account is not allowed.", 403, "FORBIDDEN");
    }

    return NextResponse.json(
      {
        ok: true,
        adminUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/auth/login#POST" });
  }
}
