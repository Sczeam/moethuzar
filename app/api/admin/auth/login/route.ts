import { routeErrorResponse } from "@/lib/api/route-error";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { signInWithEmailPassword } from "@/server/auth/auth-service";
import { requireActiveAdminByAuthUserId } from "@/server/auth/admin";
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
    const sessionUser = await signInWithEmailPassword({
      email: payload.email,
      password: payload.password,
    });

    const adminUser = await requireActiveAdminByAuthUserId(sessionUser.id);

    return NextResponse.json(
      {
        ok: true,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          role: adminUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/auth/login#POST" });
  }
}
