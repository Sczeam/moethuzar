"use client";

import { formatMoney } from "@/lib/format";
import type { SalesOverview } from "@/server/services/admin-ops-dashboard.service";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AdminSalesOverviewCardProps = {
  overview: SalesOverview;
};

export function AdminSalesOverviewCard({ overview }: AdminSalesOverviewCardProps) {
  const chartData = overview.series.map((point) => ({
    day: point.dayKey.slice(-2),
    salesAmount: Number(point.salesAmount),
    ordersCount: point.ordersCount,
  }));

  return (
    <section className="rounded-[24px] border border-sepia-border/50 bg-paper-light p-4 shadow-[0_8px_22px_rgba(37,30,24,0.05)] md:p-5" aria-labelledby="admin-sales-overview-title">
      <h3 id="admin-sales-overview-title" className="text-2xl font-semibold text-ink md:text-3xl">
        Sales Overview
      </h3>
      <p className="mt-1 text-sm text-charcoal">{overview.rangeLabel}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-sepia-border/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Sales</p>
          <p className="mt-1 break-words text-[clamp(0.95rem,4.7vw,1.25rem)] font-semibold leading-tight text-ink md:text-3xl">
            {formatMoney(overview.totalSales, overview.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-sepia-border/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Orders</p>
          <p className="mt-1 text-[clamp(0.95rem,4.7vw,1.25rem)] font-semibold leading-tight text-ink md:text-3xl">
            {overview.totalOrders}
          </p>
        </div>
      </div>

      <div className="mt-4 h-40 rounded-xl border border-sepia-border/55 bg-parchment/60 p-2 md:mt-5 md:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#CBB79F" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#3B332B", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, "dataMax + 1"]} />
            <Tooltip
              cursor={{ fill: "rgba(176, 141, 58, 0.08)" }}
              contentStyle={{
                border: "1px solid #CBB79F",
                backgroundColor: "#F1E8DA",
                color: "#251E18",
                borderRadius: "10px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="salesAmount"
              fill="#B08D3A"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
