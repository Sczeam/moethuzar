import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { resolvePaymentPolicyByZone } from "@/lib/payment-policy";
import { shippingQuoteSchema } from "@/lib/validation/shipping-rule";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { resolveShippingQuote } from "@/server/services/shipping-rule.service";

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const payload = shippingQuoteSchema.parse(await request.json());
    const quote = await resolveShippingQuote(payload);
    const paymentPolicy = resolvePaymentPolicyByZone(quote.zoneKey);

    return NextResponse.json({ ok: true, quote, paymentPolicy }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/checkout/shipping-quote#POST" });
  }
}
