import { attachCartCookie, resolveCartSession } from "@/lib/cart-session";
import { routeErrorResponse } from "@/lib/api/route-error";
import { logInfo, logWarn } from "@/lib/observability";
import { checkoutSchema } from "@/lib/validation/checkout";
import { resolveCustomerFromSession } from "@/server/auth/customer-identity";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { createOrderFromCart } from "@/server/services/order.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const idempotencyKeySchema = z.string().uuid();

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const requestId = getRequestId(request);
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const session = resolveCartSession(request);
    const payload = checkoutSchema.parse(await request.json());
    const resolvedCustomer = await resolveCustomerFromSession({ requestId });
    if (resolvedCustomer.kind !== "customer" && resolvedCustomer.reason !== "NO_SESSION") {
      logWarn({
        event: "checkout.customer_identity_degraded",
        requestId,
        reason: resolvedCustomer.reason,
        hasSession: true,
      });
    }

    const idempotencyHeader = request.headers.get("x-idempotency-key");
    const idempotencyKey = idempotencyHeader
      ? idempotencyKeySchema.parse(idempotencyHeader)
      : undefined;
    const order = await createOrderFromCart(session.token, payload, {
      idempotencyKey,
      customerId: resolvedCustomer.kind === "customer" ? resolvedCustomer.customerId : null,
    });
    logInfo({
      event: "order.checkout_created",
      requestId,
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
