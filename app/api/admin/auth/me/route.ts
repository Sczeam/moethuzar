import { requireAdminUser } from "@/server/auth/admin";
import { routeErrorResponse } from "@/lib/api/route-error";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const adminUser = await requireAdminUser(request);
    return NextResponse.json(
      {
        ok: true,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          role: adminUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/auth/me#GET" });
  }
}
