import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { resolveCartSession } from "@/lib/cart-session";
import { checkoutPromoSchema } from "@/lib/validation/checkout-promo";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { previewPromoForActiveCart } from "@/server/services/checkout-promo.service";
import {
  logPromoApplyPreviewRejected,
  logPromoApplyPreviewSuccess,
} from "@/server/services/promo-observability.service";
import { AppError } from "@/server/errors";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? undefined;
  try {
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const session = resolveCartSession(request);
    const payload = checkoutPromoSchema.parse(await request.json());
    const preview = await previewPromoForActiveCart(session.token, payload);

    logPromoApplyPreviewSuccess({
      requestId,
      promoCode: preview.promoCode,
      discountType: preview.discountType,
      discountValue: preview.discountValue,
      discountAmount: preview.discountAmount,
      subtotalBeforeDiscount: preview.subtotalBeforeDiscount,
      subtotalAfterDiscount: preview.subtotalAfterDiscount,
    });

    return NextResponse.json({ ok: true, promo: preview }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError && error.code.startsWith("PROMO_")) {
      logPromoApplyPreviewRejected({
        requestId,
        promoCodeInput: "REDACTED",
        rejectionCode: error.code,
        status: error.status,
      });
    }
    return routeErrorResponse(error, { request, route: "api/checkout/promo#POST" });
  }
}
