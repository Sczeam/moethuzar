import Link from "next/link";
import { ORDER_CODE_EXAMPLES } from "@/lib/order-code";

export default function OrderSuccessNotFoundPage() {
  return (
    <main className="vintage-shell max-w-3xl">
      <section className="vintage-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seal-wax">
          Order Not Found
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">We could not find that order.</h1>
        <p className="mt-3 text-sm text-charcoal">
          Check your order code and try again. Order codes look like {ORDER_CODE_EXAMPLES[0]} or{" "}
          {ORDER_CODE_EXAMPLES[1]}.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/order/track" className="btn-primary">
            Track Order
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
