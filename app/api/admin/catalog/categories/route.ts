import { routeErrorResponse } from "@/lib/api/route-error";
import { adminCatalogCategoryCreateSchema } from "@/lib/validation/admin-catalog";
import { requireAdminUserId } from "@/server/auth/admin";
import { createAdminCategory } from "@/server/services/admin-catalog.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = adminCatalogCategoryCreateSchema.parse(await request.json());
    const category = await createAdminCategory(payload);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/catalog/categories#POST",
    });
  }
}
