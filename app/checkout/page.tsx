"use client";

import { formatMoney } from "@/lib/format";
import {
  MM_COUNTRIES,
  MM_STATES_AND_DIVISIONS,
  PRIORITY_CITIES,
  YANGON_TOWNSHIPS,
} from "@/lib/constants/mm-locations";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  country: string;
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
  country: "Myanmar",
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

type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const idempotencyKeyRef = useRef<string | null>(null);
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
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (form.customerName.trim().length < 2) {
      errors.customerName = "Please enter a valid full name.";
    }

    if (!/^[0-9+\-\s()]{6,30}$/.test(form.customerPhone.trim())) {
      errors.customerPhone = "Please enter a valid phone number.";
    }

    if (form.customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.customerEmail.trim())) {
        errors.customerEmail = "Please enter a valid email address.";
      }
    }

    if (!form.country) {
      errors.country = "Country is required.";
    }
    if (!form.stateRegion) {
      errors.stateRegion = "State / Division is required.";
    }
    if (!form.townshipCity) {
      errors.townshipCity = "Township / City is required.";
    }
    if (form.addressLine1.trim().length < 4) {
      errors.addressLine1 = "Address line 1 must be at least 4 characters.";
    }

    return errors;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatusText("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setStatusText("");
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          ...form,
          deliveryFeeAmount: 0,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (Array.isArray(data.issues)) {
          const nextFieldErrors: FieldErrors = {};
          for (const issue of data.issues) {
            const pathKey = issue?.path?.[0];
            if (typeof pathKey === "string" && pathKey in form) {
              nextFieldErrors[pathKey as keyof CheckoutForm] = issue.message;
            }
          }
          setFieldErrors(nextFieldErrors);
        }
        if (data?.code === "INSUFFICIENT_STOCK") {
          setStatusText("Some items are out of stock. Please review your cart.");
        } else {
          setStatusText(data.error ?? "Failed to place order.");
        }
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
    return <main className="vintage-shell max-w-4xl">Loading checkout...</main>;
  }

  if (isCartEmpty || !cart) {
    return (
      <main className="vintage-shell max-w-4xl">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-3 text-charcoal">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block btn-secondary">
          Back to products
        </Link>
      </main>
    );
  }

  return (
    <main className="vintage-shell max-w-5xl">
      <h1 className="mb-6 text-4xl font-semibold text-ink">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-4 vintage-panel p-5">
          <h2 className="text-lg font-semibold">Billing Information</h2>

          <input
            required
            placeholder="Full Name"
            value={form.customerName}
            onChange={(event) => onChange("customerName", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          {fieldErrors.customerName ? <p className="text-xs text-seal-wax">{fieldErrors.customerName}</p> : null}
          <input
            required
            placeholder="Phone Number"
            value={form.customerPhone}
            onChange={(event) => onChange("customerPhone", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          {fieldErrors.customerPhone ? <p className="text-xs text-seal-wax">{fieldErrors.customerPhone}</p> : null}
          <input
            placeholder="Email (optional)"
            value={form.customerEmail}
            onChange={(event) => onChange("customerEmail", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          {fieldErrors.customerEmail ? <p className="text-xs text-seal-wax">{fieldErrors.customerEmail}</p> : null}
          <select
            required
            value={form.country}
            onChange={(event) => onChange("country", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          >
            {MM_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {fieldErrors.country ? <p className="text-xs text-seal-wax">{fieldErrors.country}</p> : null}
          <select
            required
            value={form.stateRegion}
            onChange={(event) => onChange("stateRegion", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          >
            <option value="">Select State / Division</option>
            {MM_STATES_AND_DIVISIONS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {fieldErrors.stateRegion ? <p className="text-xs text-seal-wax">{fieldErrors.stateRegion}</p> : null}
          <select
            required
            value={form.townshipCity}
            onChange={(event) => onChange("townshipCity", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          >
            <option value="">Select Township / City</option>
            <optgroup label="Yangon Townships">
              {YANGON_TOWNSHIPS.map((township) => (
                <option key={township} value={township}>
                  {township}
                </option>
              ))}
            </optgroup>
            <optgroup label="Priority Cities">
              {PRIORITY_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </optgroup>
          </select>
          {fieldErrors.townshipCity ? <p className="text-xs text-seal-wax">{fieldErrors.townshipCity}</p> : null}
          <input
            required
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(event) => onChange("addressLine1", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          {fieldErrors.addressLine1 ? <p className="text-xs text-seal-wax">{fieldErrors.addressLine1}</p> : null}
          <input
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(event) => onChange("addressLine2", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          <input
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />
          <textarea
            placeholder="Order note (optional)"
            value={form.customerNote}
            onChange={(event) => onChange("customerNote", event.target.value)}
            className="min-h-24 w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place Order (Cash on Delivery)"}
          </button>
        </form>

        <aside className="vintage-panel p-5">
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
          <div className="mt-6 flex items-center justify-between border-t border-sepia-border pt-4">
            <p className="font-semibold">Subtotal</p>
            <p className="font-semibold">{formatMoney(cart.subtotalAmount, cart.currency)}</p>
          </div>
        </aside>
      </div>

      {statusText ? <p className="mt-4 text-sm text-seal-wax">{statusText}</p> : null}
    </main>
  );
}
