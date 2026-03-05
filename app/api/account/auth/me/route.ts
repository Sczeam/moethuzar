import { routeErrorResponse } from "@/lib/api/route-error";
import { getCustomerSessionUser } from "@/server/auth/customer";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "accountMe");
    if (limitedResponse) {
      return limitedResponse;
    }

    const user = await getCustomerSessionUser(request);

    return NextResponse.json(
      {
        ok: true,
        user: user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/account/auth/me#GET" });
  }
}

