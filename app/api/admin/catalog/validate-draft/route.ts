import { NextResponse } from "next/server";

import { routeErrorResponse } from "@/lib/api/route-error";
import { adminCatalogDraftValidationSchema } from "@/lib/validation/admin-catalog";
import { requireAdminUserId } from "@/server/auth/admin";
import { validateAdminCatalogDraft } from "@/server/services/admin-catalog.service";

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = adminCatalogDraftValidationSchema.parse(await request.json());
    const result = await validateAdminCatalogDraft(payload);
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/catalog/validate-draft#POST",
    });
  }
}
