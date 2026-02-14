import { routeErrorResponse } from "@/lib/api/route-error";
import { requireAdminUserId } from "@/server/auth/admin";
import { listOrders } from "@/server/services/admin-order.service";
import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { AppError } from "@/server/errors";

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
    return routeErrorResponse(error, { request, route: "api/admin/orders#GET" });
  }
}
