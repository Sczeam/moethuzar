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
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Order Placed
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">Thank you for your order.</h1>
        <p className="mt-2 text-zinc-700">Order code: {order.orderCode}</p>
        <p className="mt-1 text-zinc-700">Status: {order.status}</p>
      </div>

      <section className="mt-8 rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <p className="text-sm text-zinc-800">
                {item.productName}
                {item.variantName ? ` (${item.variantName})` : ""} x {item.quantity}
              </p>
              <p className="text-sm font-medium">
                {formatMoney(item.lineTotal.toString(), order.currency)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-zinc-200 pt-4">
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

      <Link href="/" className="mt-6 inline-block text-sm text-zinc-700 underline">
        Back to Home
      </Link>
    </main>
  );
}
