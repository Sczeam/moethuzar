import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { adminPromoIdParamSchema } from "@/lib/validation/admin-promo";
import { promoCodePayloadSchema } from "@/lib/validation/promo-code";
import { requireAdminUserId } from "@/server/auth/admin";
import { getAdminPromoById, updateAdminPromo } from "@/server/services/admin-promo-code.service";
import { logAdminPromoUpdated } from "@/server/services/promo-observability.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ promoId: string }> },
) {
  try {
    await requireAdminUserId(request);
    const params = adminPromoIdParamSchema.parse(await context.params);
    const promo = await getAdminPromoById(params.promoId);
    return NextResponse.json({ ok: true, promo }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/promos/[promoId]#GET" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ promoId: string }> },
) {
  try {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const adminUserId = await requireAdminUserId(request);
    const params = adminPromoIdParamSchema.parse(await context.params);
    const payload = promoCodePayloadSchema.parse(await request.json());
    const promo = await updateAdminPromo(params.promoId, payload);
    logAdminPromoUpdated({
      requestId,
      adminUserId,
      promoId: promo.id,
      promoCode: promo.code,
      isActive: promo.isActive,
    });
    return NextResponse.json({ ok: true, promo }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/promos/[promoId]#PATCH" });
  }
}

