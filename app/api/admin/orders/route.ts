import { requireAdminUserId } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { listOrders } from "@/server/services/admin-order.service";
import { OrderStatus } from "@prisma/client";
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

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let status: OrderStatus | undefined;
    if (statusParam) {
      if (!Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
        throw new AppError("Invalid order status filter.", 400, "INVALID_STATUS");
      }
      status = statusParam as OrderStatus;
    }

    const orders = await listOrders(status);
    return NextResponse.json({ ok: true, orders }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
