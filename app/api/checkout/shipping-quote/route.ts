import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
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

    return NextResponse.json({ ok: true, quote }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/checkout/shipping-quote#POST" });
  }
}
