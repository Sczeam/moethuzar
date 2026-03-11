import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { attachWishlistGuestCookie } from "@/lib/wishlist/guest-token";
import { wishlistStatusQuerySchema } from "@/lib/validation/wishlist";
import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { getWishlistStatusForProducts } from "@/server/services/wishlist-read.service";

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

export async function GET(request: Request) {
  try {
    const requestId = getRequestId(request);
    const identity = await resolveWishlistIdentity(request, { requestId });
    const url = new URL(request.url);
    const query = wishlistStatusQuerySchema.parse({
      productIds: url.searchParams.get("productIds") ?? undefined,
    });

    const result = await getWishlistStatusForProducts({
      identity:
        identity.kind === "customer"
          ? { kind: "customer", customerId: identity.customerId }
          : { kind: "guest", guestTokenHash: identity.guestSession.tokenHash },
      productIds: query.productIds,
    });

    const response = NextResponse.json(result, {
      status: 200,
      headers: {
        "x-request-id": requestId,
        "Cache-Control": "no-store",
        Vary: "Cookie",
      },
    });

    if (identity.kind === "guest" && identity.guestSession.isNew) {
      attachWishlistGuestCookie(response, identity.guestSession.token);
    }

    return response;
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/wishlist/status#GET" });
  }
}
