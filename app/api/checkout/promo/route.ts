import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { resolveCartSession } from "@/lib/cart-session";
import { checkoutPromoSchema } from "@/lib/validation/checkout-promo";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { previewPromoForActiveCart } from "@/server/services/checkout-promo.service";

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const session = resolveCartSession(request);
    const payload = checkoutPromoSchema.parse(await request.json());
    const preview = await previewPromoForActiveCart(session.token, payload);

    return NextResponse.json({ ok: true, promo: preview }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/checkout/promo#POST" });
  }
}
