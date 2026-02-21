import { routeErrorResponse } from "@/lib/api/route-error";
import { adminOrdersListQuerySchema } from "@/lib/validation/admin-order";
import { requireAdminUserId } from "@/server/auth/admin";
import { listOrders, listOrdersForCsv } from "@/server/services/admin-order.service";
import { NextResponse } from "next/server";

function escapeCsv(value: string): string {
  const safeValue = value.replace(/"/g, '""');
  return `"${safeValue}"`;
}

function formatCsvDate(value: Date): string {
  return value.toISOString();
}

export async function GET(request: Request) {
  try {
    await requireAdminUserId(request);

    const { searchParams } = new URL(request.url);
    const query = adminOrdersListQuerySchema.parse({
      status:
        searchParams.get("status") === "ALL"
          ? undefined
          : searchParams.get("status") ?? undefined,
      paymentStatus:
        searchParams.get("paymentStatus") === "ALL"
          ? undefined
          : searchParams.get("paymentStatus") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      format: searchParams.get("format") ?? undefined,
    });

    if (query.format === "csv") {
      const exportOrders = await listOrdersForCsv({
        status: query.status,
        paymentStatus: query.paymentStatus,
        q: query.q,
        from: query.from,
        to: query.to,
        format: query.format,
      });
      type CsvOrderRow = Awaited<ReturnType<typeof listOrdersForCsv>>[number];

      const headers = [
        "Order Code",
        "Status",
        "Payment Status",
        "Payment Method",
        "Customer Name",
        "Phone",
        "Total Amount",
        "Currency",
        "State / Region",
        "Township / City",
        "Created At",
      ];

      const rows = exportOrders.map((order: CsvOrderRow) =>
        [
          order.orderCode,
          order.status,
          order.paymentStatus,
          order.paymentMethod,
          order.customerName,
          order.customerPhone,
          order.totalAmount.toString(),
          order.currency,
          order.address?.stateRegion ?? "",
          order.address?.townshipCity ?? "",
          formatCsvDate(order.createdAt),
        ]
          .map((value) => escapeCsv(String(value)))
          .join(",")
      );

      const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="orders-export.csv"',
        },
      });
    }

    const data = await listOrders(query);
    return NextResponse.json({ ok: true, ...data }, { status: 200 });
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/admin/orders#GET" });
  }
}
