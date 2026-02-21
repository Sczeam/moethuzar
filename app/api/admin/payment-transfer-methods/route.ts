import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { paymentTransferMethodPayloadSchema } from "@/lib/validation/payment-transfer-method";
import { requireAdminUserId } from "@/server/auth/admin";
import {
  createPaymentTransferMethod,
  listAdminPaymentTransferMethods,
} from "@/server/services/payment-transfer-method.service";

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);
    const methods = await listAdminPaymentTransferMethods();
    return NextResponse.json({ ok: true, methods }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/payment-transfer-methods#GET",
    });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = paymentTransferMethodPayloadSchema.parse(await request.json());
    const method = await createPaymentTransferMethod(payload);
    return NextResponse.json({ ok: true, method }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/admin/payment-transfer-methods#POST",
    });
  }
}
