import { getPublicOrderByCode } from "@/server/services/public-order.service";
import { normalizeOrderCode } from "@/lib/order-code";
import { routeErrorResponse } from "@/lib/api/route-error";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { NextResponse } from "next/server";

type PublicOrder = NonNullable<Awaited<ReturnType<typeof getPublicOrderByCode>>>;
type PublicOrderItem = PublicOrder["items"][number];

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderCode: string }> }
) {
  try {
    const { orderCode: rawOrderCode } = await context.params;
    const orderCode = normalizeOrderCode(rawOrderCode);
    const limitedResponse = rateLimitOrResponse(request, "publicOrderLookup", orderCode ?? undefined);
    if (limitedResponse) {
      return limitedResponse;
    }

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
          items: order.items.map((item: PublicOrderItem) => ({
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
      request,
      route: "api/orders/[orderCode]#GET",
    });
  }
}
