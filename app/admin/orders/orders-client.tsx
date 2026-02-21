"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";

type PaymentStatus = "NOT_REQUIRED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
type PaymentMethod = "COD" | "PREPAID_TRANSFER";

type OrderItem = {
  id: string;
  orderCode: string;
  status: UiOrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const statuses = ["ALL", "PENDING", "CONFIRMED", "DELIVERING", "DELIVERED", "CANCELLED"] as const;
const paymentStatuses = ["ALL", "PENDING_REVIEW", "VERIFIED", "REJECTED", "NOT_REQUIRED"] as const;

function paymentStatusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-seal-wax/10 text-seal-wax";
    default:
      return "bg-paper-light text-charcoal";
  }
}

function paymentMethodLabel(method: PaymentMethod) {
  return method === "PREPAID_TRANSFER" ? "Prepaid" : "COD";
}

function buildOrdersQuery(params: {
  status: string;
  paymentStatus: string;
  q: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.status !== "ALL") {
    searchParams.set("status", params.status);
  }
  if (params.paymentStatus !== "ALL") {
    searchParams.set("paymentStatus", params.paymentStatus);
  }
  if (params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }
  if (params.from.trim()) {
    searchParams.set("from", params.from.trim());
  }
  if (params.to.trim()) {
    searchParams.set("to", params.to.trim());
  }
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  return searchParams.toString();
}

export default function OrdersClient({
  statusFilter,
  paymentStatusFilter,
  q,
  from,
  to,
  page,
  pageSize,
  orders,
  pagination,
}: {
  statusFilter: string;
  paymentStatusFilter: string;
  q: string;
  from: string;
  to: string;
  page: string;
  pageSize: string;
  orders: OrderItem[];
  pagination: PaginationMeta;
}) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(q);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  const normalizedStatus = useMemo(() => {
    return statuses.includes(statusFilter as (typeof statuses)[number]) ? statusFilter : "ALL";
  }, [statusFilter]);
  const normalizedPaymentStatus = useMemo(() => {
    return paymentStatuses.includes(paymentStatusFilter as (typeof paymentStatuses)[number])
      ? paymentStatusFilter
      : "ALL";
  }, [paymentStatusFilter]);

  const pageNumber = Number.parseInt(page, 10) || pagination.page;
  const pageSizeNumber = Number.parseInt(pageSize, 10) || pagination.pageSize;

  function pushState(next: {
    status?: string;
    paymentStatus?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const query = buildOrdersQuery({
      status: next.status ?? normalizedStatus,
      paymentStatus: next.paymentStatus ?? normalizedPaymentStatus,
      q: next.q ?? searchText,
      from: next.from ?? fromDate,
      to: next.to ?? toDate,
      page: next.page ?? pageNumber,
      pageSize: next.pageSize ?? pageSizeNumber,
    });
    router.push(`/admin/orders${query ? `?${query}` : ""}`);
  }

  async function onLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function onExportCsv() {
    const params = new URLSearchParams();
    if (normalizedStatus !== "ALL") {
      params.set("status", normalizedStatus);
    }
    if (normalizedPaymentStatus !== "ALL") {
      params.set("paymentStatus", normalizedPaymentStatus);
    }
    if (searchText.trim()) {
      params.set("q", searchText.trim());
    }
    if (fromDate.trim()) {
      params.set("from", fromDate.trim());
    }
    if (toDate.trim()) {
      params.set("to", toDate.trim());
    }
    params.set("format", "csv");
    window.location.href = `/api/admin/orders?${params.toString()}`;
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/catalog" className="btn-secondary">
            Catalog
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            Shipping Rules
          </Link>
          <Link href="/admin/payment-transfer-methods" className="btn-secondary">
            Payment Methods
          </Link>
          <button type="button" onClick={onExportCsv} className="btn-secondary">
            Export CSV
          </button>
          <button type="button" onClick={() => void onLogout()} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <form
        className="mb-5 grid gap-2 rounded-lg border border-sepia-border bg-paper-light p-3 sm:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          pushState({ q: searchText, from: fromDate, to: toDate, page: 1 });
        }}
      >
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search code/name/phone"
          className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm"
        />
        <select
          value={pageSizeNumber}
          onChange={(event) => {
            const nextSize = Number.parseInt(event.target.value, 10) || 20;
            pushState({ pageSize: nextSize, page: 1 });
          }}
          className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <button type="submit" className="btn-primary">
          Apply Filters
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((status) => {
          const active = status === normalizedStatus;
          return (
            <button
              key={status}
              type="button"
              onClick={() => pushState({ status, page: 1 })}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                active ? "bg-teak-brown text-paper-light" : "bg-paper-light text-charcoal"
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {paymentStatuses.map((paymentStatus) => {
          const active = paymentStatus === normalizedPaymentStatus;
          return (
            <button
              key={paymentStatus}
              type="button"
              onClick={() => pushState({ paymentStatus, page: 1 })}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                active ? "bg-antique-brass text-ink" : "bg-paper-light text-charcoal"
              }`}
            >
              {paymentStatus}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto vintage-panel">
        <table className="min-w-full text-sm">
          <thead className="bg-parchment text-left text-charcoal">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Order Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-sepia-border/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold underline">
                    {order.orderCode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{order.customerName}</p>
                  <p className="text-charcoal/80">{order.customerPhone}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-charcoal">
                      {paymentMethodLabel(order.paymentMethod)}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusBadgeClass(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {Number(order.totalAmount).toLocaleString()} {order.currency}
                </td>
                <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-charcoal">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-charcoal">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary disabled:opacity-60"
            disabled={pagination.page <= 1}
            onClick={() => pushState({ page: pagination.page - 1 })}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn-secondary disabled:opacity-60"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => pushState({ page: pagination.page + 1 })}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
