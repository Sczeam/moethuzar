import { routeErrorResponse } from "@/lib/api/route-error";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { signInWithEmailPassword } from "@/server/auth/auth-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
});

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "customerLogin");
    if (limitedResponse) {
      return limitedResponse;
    }

    const payload = loginSchema.parse(await request.json());
    const sessionUser = await signInWithEmailPassword({
      email: payload.email,
      password: payload.password,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/account/auth/login#POST" });
  }
}

