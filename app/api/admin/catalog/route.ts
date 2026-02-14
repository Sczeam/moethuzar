import { routeErrorResponse } from "@/lib/api/route-error";
import {
  adminCatalogCreateSchema,
} from "@/lib/validation/admin-catalog";
import { requireAdminUserId } from "@/server/auth/admin";
import {
  createAdminProduct,
  listAdminCatalog,
} from "@/server/services/admin-catalog.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);
    const data = await listAdminCatalog();
    return NextResponse.json({ ok: true, ...data }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/catalog#GET" });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = adminCatalogCreateSchema.parse(await request.json());
    const product = await createAdminProduct(payload);
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/catalog#POST" });
  }
}
