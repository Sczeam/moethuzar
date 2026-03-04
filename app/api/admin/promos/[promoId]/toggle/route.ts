import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { adminPromoIdParamSchema } from "@/lib/validation/admin-promo";
import { requireAdminUserId } from "@/server/auth/admin";
import { toggleAdminPromo } from "@/server/services/admin-promo-code.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ promoId: string }> },
) {
  try {
    await requireAdminUserId(request);
    const params = adminPromoIdParamSchema.parse(await context.params);
    const promo = await toggleAdminPromo(params.promoId);
    return NextResponse.json({ ok: true, promo }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/promos/[promoId]/toggle#POST" });
  }
}

