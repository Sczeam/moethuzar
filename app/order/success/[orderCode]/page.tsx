import { formatMoney } from "@/lib/format";
import { getPublicOrderByCode } from "@/server/services/public-order.service";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
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
        <p className="mt-1 text-charcoal">Status: {order.status}</p>
      </div>

      <section className="mt-8 vintage-panel p-5">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
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

      <Link href="/" className="mt-6 inline-block btn-secondary">
        Back to Home
      </Link>
    </main>
  );
}
