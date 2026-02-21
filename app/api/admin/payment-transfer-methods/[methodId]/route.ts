import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import {
  paymentTransferMethodIdParamSchema,
  paymentTransferMethodPayloadSchema,
} from "@/lib/validation/payment-transfer-method";
import { requireAdminUserId } from "@/server/auth/admin";
import {
  deletePaymentTransferMethod,
  getPaymentTransferMethodById,
  updatePaymentTransferMethod,
} from "@/server/services/payment-transfer-method.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ methodId: string }> }
) {
  try {
    await requireAdminUserId(request);
    const params = paymentTransferMethodIdParamSchema.parse(await context.params);
    const method = await getPaymentTransferMethodById(params.methodId);
    return NextResponse.json({ ok: true, method }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/payment-transfer-methods/[methodId]#GET",
    });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ methodId: string }> }
) {
  try {
    await requireAdminUserId(request);
    const params = paymentTransferMethodIdParamSchema.parse(await context.params);
    const payload = paymentTransferMethodPayloadSchema.parse(await request.json());
    const method = await updatePaymentTransferMethod(params.methodId, payload);
    return NextResponse.json({ ok: true, method }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/payment-transfer-methods/[methodId]#PATCH",
    });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ methodId: string }> }
) {
  try {
    await requireAdminUserId(request);
    const params = paymentTransferMethodIdParamSchema.parse(await context.params);
    await deletePaymentTransferMethod(params.methodId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/payment-transfer-methods/[methodId]#DELETE",
    });
  }
}
