import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { AccountOrdersQuerySchema } from "@/lib/contracts/account-orders";
import { requireCustomerSessionUser } from "@/server/auth/customer";
import { listAccountOrders } from "@/server/services/account-orders.service";

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

export async function GET(request: Request) {
  try {
    const requestId = getRequestId(request);
    const sessionUser = await requireCustomerSessionUser(request);
    const url = new URL(request.url);
    const query = AccountOrdersQuerySchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listAccountOrders({
      customerId: sessionUser.id,
      pageSize: query.pageSize,
      cursor: query.cursor,
    });

    return NextResponse.json(
      {
        ok: true,
        requestId,
        ...result,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "Cache-Control": "no-store",
          Vary: "Cookie",
        },
      }
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/account/orders#GET" });
  }
}

