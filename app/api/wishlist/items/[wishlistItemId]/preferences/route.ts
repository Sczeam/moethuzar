import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { attachWishlistGuestCookie } from "@/lib/wishlist/guest-token";
import { updateWishlistPreferencesSchema, wishlistItemIdParamSchema } from "@/lib/validation/wishlist";
import { resolveWishlistIdentity } from "@/server/auth/wishlist-identity";
import { updateWishlistPreferences } from "@/server/services/wishlist-write.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ wishlistItemId: string }> }
) {
  try {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const identity = await resolveWishlistIdentity(request, { requestId });
    const params = wishlistItemIdParamSchema.parse(await context.params);
    const payload = updateWishlistPreferencesSchema.parse(await request.json());

    const item = await updateWishlistPreferences({
      identity:
        identity.kind === "customer"
          ? { kind: "customer", customerId: identity.customerId }
          : { kind: "guest", guestTokenHash: identity.guestSession.tokenHash },
      wishlistItemId: params.wishlistItemId,
      preferredVariantId: payload.preferredVariantId,
      preferredColorValue: payload.preferredColorValue,
      preferredSizeValue: payload.preferredSizeValue,
      sourceSurface: payload.sourceSurface,
    });

    const response = NextResponse.json(
      {
        ok: true,
        item: {
          productId: item.productId,
          saved: true,
          wishlistItemId: item.id,
          preferredVariantId: item.preferredVariantId,
          preferredColorValue: item.preferredColorValue,
          preferredSizeValue: item.preferredSizeValue,
          lastInteractedAt: item.lastInteractedAt.toISOString(),
        },
      },
      { status: 200 }
    );

    if (identity.kind === "guest" && identity.guestSession.isNew) {
      attachWishlistGuestCookie(response, identity.guestSession.token);
    }

    return response;
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/wishlist/items/[wishlistItemId]/preferences#PATCH" });
  }
}
