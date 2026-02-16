import { NextResponse } from "next/server";

import { routeErrorResponse } from "@/lib/api/route-error";
import { requireAdminUserId } from "@/server/auth/admin";
import { listAdminVariantPresets } from "@/server/services/admin-variant-preset.service";

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);
    const presets = await listAdminVariantPresets();
    return NextResponse.json({ ok: true, presets }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/catalog/variant-presets#GET",
    });
  }
}
