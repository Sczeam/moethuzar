import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { attachWishlistGuestCookie } from "@/lib/wishlist/guest-token";
import { createWishlistItemSchema } from "@/lib/validation/wishlist";
import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { saveWishlistItem } from "@/server/services/wishlist-write.service";

export async function POST(request: Request) {
  try {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const identity = await resolveWishlistIdentity(request, { requestId });
    const payload = createWishlistItemSchema.parse(await request.json());
    const result = await saveWishlistItem({
      identity:
        identity.kind === "customer"
          ? { kind: "customer", customerId: identity.customerId }
          : { kind: "guest", guestTokenHash: identity.guestSession.tokenHash },
      productId: payload.productId,
      preferredVariantId: payload.preferredVariantId,
      preferredColorValue: payload.preferredColorValue,
      preferredSizeValue: payload.preferredSizeValue,
      sourceSurface: payload.sourceSurface,
    });

    const response = NextResponse.json(
      {
        ok: true,
        item: {
          productId: result.item.productId,
          saved: true,
          wishlistItemId: result.item.id,
          preferredVariantId: result.item.preferredVariantId,
          preferredColorValue: result.item.preferredColorValue,
          preferredSizeValue: result.item.preferredSizeValue,
          lastInteractedAt: result.item.lastInteractedAt.toISOString(),
        },
      },
      { status: 200 }
    );

    if (identity.kind === "guest" && identity.guestSession.isNew) {
      attachWishlistGuestCookie(response, identity.guestSession.token);
    }

    return response;
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/wishlist/items#POST" });
  }
}
