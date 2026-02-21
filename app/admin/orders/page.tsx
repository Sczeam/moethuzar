import OrdersClient from "./orders-client";
import { adminOrdersListQuerySchema } from "@/lib/validation/admin-order";
import { listOrders } from "@/server/services/admin-order.service";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    paymentStatus?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const query = adminOrdersListQuerySchema.parse({
    status: params.status === "ALL" ? undefined : params.status,
    paymentStatus: params.paymentStatus === "ALL" ? undefined : params.paymentStatus,
    q: params.q,
    from: params.from,
    to: params.to,
    page: params.page,
    pageSize: params.pageSize,
    format: "json",
  });

  const data = await listOrders(query);
  type OrdersResult = Awaited<ReturnType<typeof listOrders>>;
  type OrderRow = OrdersResult["orders"][number];

  return (
    <OrdersClient
      statusFilter={query.status ?? "ALL"}
      paymentStatusFilter={query.paymentStatus ?? "ALL"}
      q={query.q ?? ""}
      from={query.from ?? ""}
      to={query.to ?? ""}
      page={String(query.page)}
      pageSize={String(query.pageSize)}
      orders={data.orders.map((order: OrderRow) => ({
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount.toString(),
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
      }))}
      pagination={data.pagination}
    />
  );
}
