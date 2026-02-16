import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { shippingRulePayloadSchema } from "@/lib/validation/shipping-rule";
import { requireAdminUserId } from "@/server/auth/admin";
import { createShippingRule, listShippingRules } from "@/server/services/shipping-rule.service";

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);
    const rules = await listShippingRules();
    return NextResponse.json({ ok: true, rules }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/shipping-rules#GET" });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = shippingRulePayloadSchema.parse(await request.json());
    const rule = await createShippingRule({
      ...payload,
      stateRegion: payload.stateRegion || null,
      townshipCity: payload.townshipCity || null,
    });

    return NextResponse.json({ ok: true, rule }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/shipping-rules#POST" });
  }
}
