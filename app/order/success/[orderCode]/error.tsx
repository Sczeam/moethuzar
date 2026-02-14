"use client";

import Link from "next/link";

export default function OrderSuccessErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="vintage-shell max-w-3xl">
      <section className="vintage-panel border-seal-wax/40 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seal-wax">
          Order Tracking Error
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Unable to load order details.</h1>
        <p className="mt-3 text-sm text-charcoal">
          Please retry. If this keeps happening, contact support with your order code.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/order/track" className="btn-secondary">
            Track Another Order
          </Link>
        </div>
      </section>
    </main>
  );
}
