"use client";

import { normalizeOrderCode } from "@/lib/order-code";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderTrackPage() {
  const [orderCode, setOrderCode] = useState("");
  const [statusText, setStatusText] = useState("");
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeOrderCode(orderCode);

    if (!normalized) {
      setStatusText("Enter a valid order code like MZT-20260214-0001.");
      return;
    }

    setStatusText("");
    router.push(`/order/success/${normalized}`);
  }

  return (
    <main className="vintage-shell max-w-3xl">
      <section className="vintage-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teak-brown">
          Order Tracking
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Track your order</h1>
        <p className="mt-3 text-sm text-charcoal">
          Enter your order code from checkout confirmation.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            value={orderCode}
            onChange={(event) => setOrderCode(event.target.value)}
            placeholder="MZT-20260214-0001"
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2 text-ink"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary">
              Track Order
            </button>
            <Link href="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </form>

        {statusText ? <p className="mt-3 text-sm text-seal-wax">{statusText}</p> : null}
      </section>
    </main>
  );
}
