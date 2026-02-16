import { formatMoney } from "@/lib/format";
import LiveStatus from "@/components/order/live-status";
import { normalizeOrderCode } from "@/lib/order-code";
import { getPublicOrderByCode } from "@/server/services/public-order.service";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PublicOrder = NonNullable<Awaited<ReturnType<typeof getPublicOrderByCode>>>;
type PublicOrderItem = PublicOrder["items"][number];

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode: rawOrderCode } = await params;
  const orderCode = normalizeOrderCode(rawOrderCode);

  if (!orderCode) {
    notFound();
  }

  if (rawOrderCode !== orderCode) {
    redirect(`/order/success/${orderCode}`);
  }

  const order = await getPublicOrderByCode(orderCode);

  if (!order) {
    notFound();
  }

  return (
    <main className="vintage-shell max-w-4xl">
      <div className="vintage-panel border-antique-brass p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teak-brown">
          Order Placed
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Thank you for your order.</h1>
        <p className="mt-2 text-charcoal">Order code: {order.orderCode}</p>
        <p className="mt-1 text-charcoal">
          Payment method: <span className="font-semibold">Cash on delivery (COD)</span>
        </p>
        <p className="mt-1 text-charcoal">
          Please keep your phone available. Our team will call to confirm your order.
        </p>
        {order.shippingZoneLabel ? (
          <p className="mt-1 text-charcoal">Shipping zone: {order.shippingZoneLabel}</p>
        ) : null}
        {order.shippingEtaLabel ? (
          <p className="mt-1 text-charcoal">Estimated delivery: {order.shippingEtaLabel}</p>
        ) : null}
      </div>

      <div className="mt-8">
        <LiveStatus orderCode={order.orderCode} initialStatus={order.status} />
      </div>

      <section className="mt-8 vintage-panel p-5">
        <h2 className="text-lg font-semibold">Delivery Details</h2>
        <p className="mt-3 text-sm text-charcoal">
          Customer: {order.customerName} ({order.customerPhone})
        </p>
        {order.customerNote ? (
          <p className="mt-2 rounded-md bg-parchment p-3 text-sm text-charcoal">
            Note: {order.customerNote}
          </p>
        ) : null}
      </section>

      <section className="mt-8 vintage-panel p-5">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item: PublicOrderItem) => (
            <div key={item.id} className="flex items-start justify-between">
              <p className="text-sm text-charcoal">
                {item.productName}
                {item.variantName ? ` (${item.variantName})` : ""} x {item.quantity}
              </p>
              <p className="text-sm font-medium">
                {formatMoney(item.lineTotal.toString(), order.currency)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-sepia-border pt-4">
          <div className="flex justify-between text-sm">
            <p>Subtotal</p>
            <p>{formatMoney(order.subtotalAmount.toString(), order.currency)}</p>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <p>Delivery Fee</p>
            <p>{formatMoney(order.deliveryFeeAmount.toString(), order.currency)}</p>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold">
            <p>Total</p>
            <p>{formatMoney(order.totalAmount.toString(), order.currency)}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="btn-secondary">
          Back to Home
        </Link>
        <Link href="/order/track" className="btn-secondary">
          Track Another Order
        </Link>
      </div>
    </main>
  );
}
