import { attachCartCookie, resolveCartSession } from "@/lib/cart-session";
import { routeErrorResponse } from "@/lib/api/route-error";
import { logInfo } from "@/lib/observability";
import { checkoutSchema } from "@/lib/validation/checkout";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { createOrderFromCart } from "@/server/services/order.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const idempotencyKeySchema = z.string().uuid();

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const session = resolveCartSession(request);
    const payload = checkoutSchema.parse(await request.json());
    const idempotencyHeader = request.headers.get("x-idempotency-key");
    const idempotencyKey = idempotencyHeader
      ? idempotencyKeySchema.parse(idempotencyHeader)
      : undefined;
    const order = await createOrderFromCart(session.token, payload, { idempotencyKey });
    logInfo({
      event: "order.checkout_created",
      orderId: order.id,
      orderCode: order.orderCode,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.length,
      currency: order.currency,
    });

    const response = NextResponse.json(
      {
        ok: true,
        order,
      },
      { status: 201 }
    );

    // Rotate cart token after successful checkout to avoid reusing converted cart sessions.
    attachCartCookie(response, crypto.randomUUID());
    return response;
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/checkout#POST" });
  }
}
