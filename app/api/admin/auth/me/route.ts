import { requireAdminUser } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { NextResponse } from "next/server";

function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        error: error.message,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { ok: false, code: "INTERNAL_ERROR", error: "Unexpected server error." },
    { status: 500 }
  );
}

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
    return errorResponse(error);
  }
}
