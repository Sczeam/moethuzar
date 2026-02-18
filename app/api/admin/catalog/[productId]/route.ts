import { routeErrorResponse } from "@/lib/api/route-error";
import {
  adminCatalogProductIdParamSchema,
  adminCatalogUpdateSchema,
} from "@/lib/validation/admin-catalog";
import { requireAdminUserId } from "@/server/auth/admin";
import {
  getAdminProductById,
  updateAdminProduct,
} from "@/server/services/admin-catalog.service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    await requireAdminUserId(request);
    const params = adminCatalogProductIdParamSchema.parse(await context.params);
    const product = await getAdminProductById(params.productId);
    return NextResponse.json({ ok: true, product }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/catalog/[productId]#GET" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const adminUserId = await requireAdminUserId(request);
    const params = adminCatalogProductIdParamSchema.parse(await context.params);
    const payload = adminCatalogUpdateSchema.parse(await request.json());
    const product = await updateAdminProduct(params.productId, payload, adminUserId);
    return NextResponse.json({ ok: true, product }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/catalog/[productId]#PATCH" });
  }
}
