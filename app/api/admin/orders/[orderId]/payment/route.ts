import { routeErrorResponse } from "@/lib/api/route-error";
import { logInfo } from "@/lib/observability";
import {
  adminOrderPaymentReviewSchema,
  orderIdParamSchema,
} from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { reviewOrderPayment } from "@/server/services/admin-order.service";
import { emitPaymentReviewHook } from "@/server/services/payment-notification.service";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminUserId = await requireAdminUserId(request);
    const params = orderIdParamSchema.parse(await context.params);
    const payload = adminOrderPaymentReviewSchema.parse(await request.json());

    const order = await reviewOrderPayment({
      orderId: params.orderId,
      adminUserId,
      decision: payload.decision,
      note: payload.note,
    });

    await emitPaymentReviewHook({
      orderId: order.id,
      orderCode: order.orderCode,
      outcome: payload.decision,
      adminUserId,
    });

    logInfo({
      event: "admin.order_payment_reviewed",
      orderId: order.id,
      orderCode: order.orderCode,
      paymentStatus: order.paymentStatus,
      adminUserId,
    });

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/orders/[orderId]/payment#PATCH",
    });
  }
}

