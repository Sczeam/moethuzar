import { orderIdParamSchema } from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { getOrderById } from "@/server/services/admin-order.service";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Invalid request payload.",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

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

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAdminUserId(request);
    const params = orderIdParamSchema.parse(await context.params);
    const order = await getOrderById(params.orderId);
    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
