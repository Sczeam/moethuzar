import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { shippingRuleIdParamSchema, shippingRulePayloadSchema } from "@/lib/validation/shipping-rule";
import { requireAdminUserId } from "@/server/auth/admin";
import { deleteShippingRule, getShippingRuleById, updateShippingRule } from "@/server/services/shipping-rule.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ ruleId: string }> },
) {
  try {
    await requireAdminUserId(request);
    const params = shippingRuleIdParamSchema.parse(await context.params);
    const rule = await getShippingRuleById(params.ruleId);
    return NextResponse.json({ ok: true, rule }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/shipping-rules/[ruleId]#GET" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> },
) {
  try {
    await requireAdminUserId(request);
    const params = shippingRuleIdParamSchema.parse(await context.params);
    const payload = shippingRulePayloadSchema.parse(await request.json());

    const rule = await updateShippingRule(params.ruleId, {
      ...payload,
      stateRegion: payload.stateRegion || null,
      townshipCity: payload.townshipCity || null,
    });

    return NextResponse.json({ ok: true, rule }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/shipping-rules/[ruleId]#PATCH" });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ ruleId: string }> },
) {
  try {
    await requireAdminUserId(request);
    const params = shippingRuleIdParamSchema.parse(await context.params);
    await deleteShippingRule(params.ruleId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/shipping-rules/[ruleId]#DELETE" });
  }
}
