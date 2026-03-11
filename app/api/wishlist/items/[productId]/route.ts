import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { attachWishlistGuestCookie } from "@/lib/wishlist/guest-token";
import { wishlistProductIdParamSchema } from "@/lib/validation/wishlist";
import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { removeWishlistItem } from "@/server/services/wishlist-write.service";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const identity = await resolveWishlistIdentity(request, { requestId });
    const params = wishlistProductIdParamSchema.parse(await context.params);
    const result = await removeWishlistItem({
      identity:
        identity.kind === "customer"
          ? { kind: "customer", customerId: identity.customerId }
          : { kind: "guest", guestTokenHash: identity.guestSession.tokenHash },
      productId: params.productId,
    });

    const response = NextResponse.json(
      {
        ok: true,
        removed: result.removed,
        removedItemId: result.removedItemId,
      },
      { status: 200 }
    );

    if (identity.kind === "guest" && identity.guestSession.isNew) {
      attachWishlistGuestCookie(response, identity.guestSession.token);
    }

    return response;
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/wishlist/items/[productId]#DELETE" });
  }
}
