import {
  adminOrderStatusUpdateSchema,
  orderIdParamSchema,
} from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { updateOrderStatus } from "@/server/services/admin-order.service";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminUserId = await requireAdminUserId(request);
    const params = orderIdParamSchema.parse(await context.params);
    const payload = adminOrderStatusUpdateSchema.parse(await request.json());

    const order = await updateOrderStatus({
      orderId: params.orderId,
      adminUserId,
      toStatus: payload.toStatus,
      note: payload.note,
    });

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
