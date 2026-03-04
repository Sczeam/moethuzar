import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { promoCodePayloadSchema } from "@/lib/validation/promo-code";
import { requireAdminUserId } from "@/server/auth/admin";
import { createAdminPromo, listAdminPromos } from "@/server/services/admin-promo-code.service";

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);
    const promos = await listAdminPromos();
    return NextResponse.json({ ok: true, promos }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/promos#GET" });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = promoCodePayloadSchema.parse(await request.json());
    const promo = await createAdminPromo(payload);
    return NextResponse.json({ ok: true, promo }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/promos#POST" });
  }
}

