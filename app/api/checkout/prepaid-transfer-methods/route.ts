import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { listPublicPaymentTransferMethods } from "@/server/services/payment-transfer-method.service";

export async function GET(request: Request) {
  try {
    const methods = await listPublicPaymentTransferMethods();
    return NextResponse.json({ ok: true, methods }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/checkout/prepaid-transfer-methods#GET",
    });
  }
}
