import { routeErrorResponse } from "@/lib/api/route-error";
import { orderIdParamSchema } from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { getOrderById } from "@/server/services/admin-order.service";
import { NextResponse } from "next/server";

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
    return routeErrorResponse(error, { request, route: "api/admin/orders/[orderId]#GET" });
  }
}
