import { routeErrorResponse } from "@/lib/api/route-error";
import { logInfo } from "@/lib/observability";
import {
  adminOrderStatusUpdateSchema,
  orderIdParamSchema,
} from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { updateOrderStatus } from "@/server/services/admin-order.service";
import { NextResponse } from "next/server";

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
    logInfo({
      event: "admin.order_status_updated",
      orderId: order.id,
      orderCode: order.orderCode,
      toStatus: payload.toStatus,
      adminUserId,
    });

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/orders/[orderId]/status#PATCH",
    });
  }
}
