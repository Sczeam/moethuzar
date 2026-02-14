import OrdersClient from "./orders-client";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "ALL";

  return <OrdersClient statusFilter={statusFilter} />;
}
