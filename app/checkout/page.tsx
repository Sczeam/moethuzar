"use client";

import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CartData = {
  currency: string;
  subtotalAmount: string;
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: string;
    variant: { name: string; product: { name: string } };
  }>;
};

type CheckoutForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNote: string;
  stateRegion: string;
  townshipCity: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
};

const initialForm: CheckoutForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerNote: "",
  stateRegion: "",
  townshipCity: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      const response = await fetch("/api/cart");
      const data = await response.json();
      if (response.ok && data.ok) {
        setCart(data.cart);
      } else {
        setStatusText(data.error ?? "Failed to load cart.");
      }
      setLoading(false);
    }

    void loadCart();
  }, []);

  const isCartEmpty = useMemo(() => !cart || cart.items.length === 0, [cart]);

  function onChange<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatusText("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryFeeAmount: 0,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to place order.");
        return;
      }

      router.push(`/order/success/${data.order.orderCode}`);
    } catch {
      setStatusText("Unexpected error while placing order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-4 py-10">Loading checkout...</main>;
  }

  if (isCartEmpty || !cart) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-3 text-zinc-600">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-5">
          <h2 className="text-lg font-semibold">Billing Information</h2>

          <input
            required
            placeholder="Full Name"
            value={form.customerName}
            onChange={(event) => onChange("customerName", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            required
            placeholder="Phone Number"
            value={form.customerPhone}
            onChange={(event) => onChange("customerPhone", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            placeholder="Email (optional)"
            value={form.customerEmail}
            onChange={(event) => onChange("customerEmail", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            required
            placeholder="State / Region"
            value={form.stateRegion}
            onChange={(event) => onChange("stateRegion", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            required
            placeholder="Township / City"
            value={form.townshipCity}
            onChange={(event) => onChange("townshipCity", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            required
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(event) => onChange("addressLine1", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(event) => onChange("addressLine2", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <input
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          <textarea
            placeholder="Order note (optional)"
            value={form.customerNote}
            onChange={(event) => onChange("customerNote", event.target.value)}
            className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place Order (Cash on Delivery)"}
          </button>
        </form>

        <aside className="rounded-xl border border-zinc-200 p-5">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <p>
                  {item.variant.product.name} ({item.variant.name}) x {item.quantity}
                </p>
                <p>{formatMoney(item.lineTotal, cart.currency)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4">
            <p className="font-semibold">Subtotal</p>
            <p className="font-semibold">{formatMoney(cart.subtotalAmount, cart.currency)}</p>
          </div>
        </aside>
      </div>

      {statusText ? <p className="mt-4 text-sm text-red-700">{statusText}</p> : null}
    </main>
  );
}
