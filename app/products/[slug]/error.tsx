"use client";

import Link from "next/link";

export default function ProductErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="vintage-shell max-w-3xl">
      <section className="vintage-panel border-seal-wax/50 p-8">
        <h1 className="text-3xl font-semibold text-ink">Unable to load product</h1>
        <p className="mt-3 text-charcoal">
          Something went wrong while loading this product page.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-primary" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
