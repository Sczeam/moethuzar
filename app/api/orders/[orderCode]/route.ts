import { getPublicOrderByCode } from "@/server/services/public-order.service";
import { normalizeOrderCode } from "@/lib/order-code";
import { routeErrorResponse } from "@/lib/api/route-error";
import { NextResponse } from "next/server";

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderCode: string }> }
) {
  try {
    const { orderCode: rawOrderCode } = await context.params;
    const orderCode = normalizeOrderCode(rawOrderCode);

    if (!orderCode) {
      return NextResponse.json(
        { ok: false, code: "INVALID_ORDER_CODE", error: "Invalid order code format." },
        { status: 400 }
      );
    }

    const order = await getPublicOrderByCode(orderCode);

    if (!order) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        order: {
          ...order,
          subtotalAmount: toPriceString(order.subtotalAmount),
          deliveryFeeAmount: toPriceString(order.deliveryFeeAmount),
          totalAmount: toPriceString(order.totalAmount),
          items: order.items.map((item) => ({
            ...item,
            unitPrice: toPriceString(item.unitPrice),
            lineTotal: toPriceString(item.lineTotal),
          })),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return routeErrorResponse(error, {
      request: _request,
      route: "api/orders/[orderCode]#GET",
    });
  }
}
