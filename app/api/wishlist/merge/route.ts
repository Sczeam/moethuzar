import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { hashWishlistGuestToken, readWishlistGuestSession } from "@/lib/wishlist/guest-token";
import { wishlistMergeSchema } from "@/lib/validation/wishlist";
import { requireCustomerSessionUser } from "@/server/auth/customer";
import { mergeGuestWishlistIntoCustomer } from "@/server/services/wishlist-write.service";

export async function POST(request: Request) {
  try {
    const user = await requireCustomerSessionUser(request);
    const raw = await request.text();
    const payload = wishlistMergeSchema.parse(raw ? JSON.parse(raw) : {});
    const guestToken = payload.guestToken ?? readWishlistGuestSession(request)?.token;

    if (!guestToken) {
      return NextResponse.json({ ok: true, mergedCount: 0, skippedCount: 0 }, { status: 200 });
    }

    const result = await mergeGuestWishlistIntoCustomer({
      customerId: user.customerId,
      guestTokenHash: hashWishlistGuestToken(guestToken),
    });

    return NextResponse.json(
      {
        ok: true,
        mergedCount: result.mergedCount,
        skippedCount: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/wishlist/merge#POST" });
  }
}
