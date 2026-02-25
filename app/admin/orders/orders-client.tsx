"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrdersKpiSnapshot } from "@/lib/constants/admin-orders-kpi-contract";
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

function asSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function formatMoneyAmount(value: number, currency: string) {
  const normalized = asSafeNumber(value);
  return `${currency} ${Math.round(normalized).toLocaleString()}`;
}

export default function OrdersClient({
  statusFilter,
  paymentStatusFilter,
  q,
  from,
  to,
  page,
  pageSize,
  kpis,
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
  kpis: OrdersKpiSnapshot;
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

  const kpisView = useMemo(() => {
    return {
      totalOrders: asSafeNumber(kpis.totalOrders),
      totalRevenueAmount: asSafeNumber(kpis.totalRevenueAmount),
      averageOrderValueAmount: asSafeNumber(kpis.averageOrderValueAmount),
      fulfillmentRate: asSafeNumber(kpis.fulfillmentRate),
      currency: kpis.currency || "MMK",
      scopeLabel: kpis.scope === "ALL_TIME" ? "All time" : "Filtered results",
    };
  }, [kpis]);

  return (
    <main className="space-y-4 md:space-y-6">
      <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5">
        <p className="text-[1.75rem] font-semibold leading-tight text-ink md:text-[2rem]">
          Orders Revenue
        </p>
        <p className="mt-1 text-sm text-charcoal/85">{kpisView.scopeLabel}</p>
        <p className="mt-3 text-[clamp(1.5rem,4.5vw,3rem)] font-semibold leading-none text-ink">
          {formatMoneyAmount(kpisView.totalRevenueAmount, kpisView.currency)}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5" aria-label="Order KPIs">
        <article className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
          <p className="text-sm text-charcoal">Total Orders</p>
          <p className="mt-2 text-[clamp(1.5rem,4.5vw,2.5rem)] font-semibold leading-none text-ink">
            {kpisView.totalOrders.toLocaleString()}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-charcoal/80">
            {kpisView.scopeLabel}
          </p>
        </article>
        <article className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
          <p className="text-sm text-charcoal">Avg. Order Value</p>
          <p className="mt-2 text-[clamp(1.2rem,4vw,2rem)] font-semibold leading-none text-ink">
            {formatMoneyAmount(kpisView.averageOrderValueAmount, kpisView.currency)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-charcoal/80">
            {kpisView.scopeLabel}
          </p>
        </article>
        <article className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
          <p className="text-sm text-charcoal">Orders Fulfillment Rate</p>
          <p className="mt-2 text-[clamp(1.2rem,4vw,2rem)] font-semibold leading-none text-ink">
            {kpisView.fulfillmentRate.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-charcoal/80">Current page</p>
        </article>
      </section>

      <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5">
        <form
          className="mt-4 grid gap-2 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            pushState({ q: searchText, from: fromDate, to: toDate, page: 1 });
          }}
        >
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search code/name/phone"
            className="rounded-xl border border-sepia-border bg-parchment px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-xl border border-sepia-border bg-parchment px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-xl border border-sepia-border bg-parchment px-3 py-2 text-sm"
          />
          <select
            value={pageSizeNumber}
            onChange={(event) => {
              const nextSize = Number.parseInt(event.target.value, 10) || 20;
              pushState({ pageSize: nextSize, page: 1 });
            }}
            className="rounded-xl border border-sepia-border bg-parchment px-3 py-2 text-sm"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button type="submit" className="btn-primary rounded-xl">
            Apply
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => {
              const active = status === normalizedStatus;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => pushState({ status, page: 1 })}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    active ? "bg-teak-brown text-paper-light" : "bg-paper-light text-charcoal"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onExportCsv} className="btn-secondary text-xs md:text-sm">
            Export Current CSV
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {paymentStatuses.map((paymentStatus) => {
            const active = paymentStatus === normalizedPaymentStatus;
            return (
              <button
                key={paymentStatus}
                type="button"
                onClick={() => pushState({ paymentStatus, page: 1 })}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  active ? "bg-antique-brass text-ink" : "bg-paper-light text-charcoal"
                }`}
              >
                {paymentStatus}
              </button>
            );
          })}
        </div>
      </section>

      <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-parchment text-left text-charcoal">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Total</th>
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
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
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
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </td>
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

        <div className="space-y-3 md:hidden">
          {orders.length === 0 ? (
            <p className="rounded-xl border border-sepia-border/60 bg-parchment p-4 text-sm text-charcoal">
              No orders found.
            </p>
          ) : null}
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-sepia-border/70 bg-parchment p-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold underline">
                  {order.orderCode}
                </Link>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${orderStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink">{order.customerName}</p>
              <p className="text-xs text-charcoal/80">{order.customerPhone}</p>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-charcoal">
                <p>{paymentMethodLabel(order.paymentMethod)}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentStatusBadgeClass(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-charcoal">
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="font-semibold text-ink">
                  {Number(order.totalAmount).toLocaleString()} {order.currency}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
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
