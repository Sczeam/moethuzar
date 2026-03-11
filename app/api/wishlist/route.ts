import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { attachWishlistGuestCookie } from "@/lib/wishlist/guest-token";
import { wishlistListQuerySchema } from "@/lib/validation/wishlist";
import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { listWishlistItems } from "@/server/services/wishlist-read.service";

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

export async function GET(request: Request) {
  try {
    const requestId = getRequestId(request);
    const identity = await resolveWishlistIdentity(request, { requestId });
    const url = new URL(request.url);
    const query = wishlistListQuerySchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listWishlistItems({
      identity:
        identity.kind === "customer"
          ? { kind: "customer", customerId: identity.customerId }
          : { kind: "guest", guestTokenHash: identity.guestSession.tokenHash },
      pageSize: query.pageSize,
      cursor: query.cursor,
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
    return routeErrorResponse(error, { request, route: "api/wishlist#GET" });
  }
}
