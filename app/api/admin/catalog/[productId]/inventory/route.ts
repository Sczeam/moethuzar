import { routeErrorResponse } from "@/lib/api/route-error";
import {
  adminCatalogProductIdParamSchema,
  adminInventoryAdjustmentSchema,
} from "@/lib/validation/admin-catalog";
import { requireAdminUserId } from "@/server/auth/admin";
import { adjustVariantInventory } from "@/server/services/admin-catalog.service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const adminUserId = await requireAdminUserId(request);
    const params = adminCatalogProductIdParamSchema.parse(await context.params);
    const payload = adminInventoryAdjustmentSchema.parse(await request.json());

    const variant = await adjustVariantInventory(params.productId, adminUserId, payload);
    return NextResponse.json({ ok: true, variant }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/catalog/[productId]/inventory#POST",
    });
  }
}
