"use client";

import { formatMoney } from "@/lib/format";
import {
  MM_COUNTRIES,
  MM_STATES_AND_DIVISIONS,
  PRIORITY_CITIES,
  YANGON_TOWNSHIPS,
} from "@/lib/constants/mm-locations";
import { LEGAL_TERMS_VERSION } from "@/lib/constants/legal";
import type { PaymentPolicy } from "@/lib/payment-policy";
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

type ShippingQuote = {
  ruleId: string;
  zoneKey: string;
  zoneLabel: string;
  etaLabel: string;
  feeAmount: number;
};

type ShippingQuoteResponse = {
  ok?: boolean;
  error?: string;
  quote?: ShippingQuote;
  paymentPolicy?: PaymentPolicy;
};

type PaymentTransferMethodOption = {
  id: string;
  methodCode: string;
  label: string;
  channelType: "BANK" | "WALLET";
  accountName: string;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
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
  termsAccepted: boolean;
  termsVersion: string;
  paymentMethod: "" | "COD" | "PREPAID_TRANSFER";
  paymentProofUrl: string;
  paymentReference: string;
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
  termsAccepted: false,
  termsVersion: LEGAL_TERMS_VERSION,
  paymentMethod: "",
  paymentProofUrl: "",
  paymentReference: "",
};

type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;
const MAX_PAYMENT_PROOF_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_PAYMENT_PROOF_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [paymentPolicy, setPaymentPolicy] = useState<PaymentPolicy | null>(null);
  const [selectedTransferMethodId, setSelectedTransferMethodId] = useState<string>("");
  const [transferMethods, setTransferMethods] = useState<PaymentTransferMethodOption[]>([]);
  const [transferMethodsLoading, setTransferMethodsLoading] = useState(false);
  const [transferMethodsError, setTransferMethodsError] = useState("");
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState("");
  const [paymentUploadError, setPaymentUploadError] = useState("");
  const [paymentUploadStatus, setPaymentUploadStatus] = useState("");
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [copyStatusText, setCopyStatusText] = useState("");
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
  const subtotalAmountInt = useMemo(() => {
    if (!cart) {
      return 0;
    }

    return Math.round(Number(cart.subtotalAmount));
  }, [cart]);

  const canRequestShippingQuote = useMemo(() => {
    if (isCartEmpty || !cart) {
      return false;
    }

    return Boolean(form.country && form.stateRegion && form.townshipCity);
  }, [cart, form.country, form.stateRegion, form.townshipCity, isCartEmpty]);

  const deliveryFeeAmount = shippingQuote?.feeAmount ?? 0;
  const grandTotalAmount = subtotalAmountInt + deliveryFeeAmount;
  const requiresPrepaidProof = paymentPolicy?.requiresProof ?? false;
  const selectedTransferMethod = useMemo(
    () =>
      transferMethods.find((method) => method.methodCode === selectedTransferMethodId) ?? null,
    [selectedTransferMethodId, transferMethods]
  );

  function onChange<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!canRequestShippingQuote) {
      setShippingQuote(null);
      setPaymentPolicy(null);
      setShippingQuoteError("");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const loadShippingQuote = async () => {
      setShippingQuoteLoading(true);
      setShippingQuoteError("");

      try {
        const response = await fetch("/api/checkout/shipping-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: form.country,
            stateRegion: form.stateRegion,
            townshipCity: form.townshipCity,
            subtotalAmount: subtotalAmountInt,
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as ShippingQuoteResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.ok) {
          setShippingQuote(null);
          setPaymentPolicy(null);
          setShippingQuoteError(
            typeof data?.error === "string"
              ? data.error
              : "Shipping is temporarily unavailable for this location.",
          );
          return;
        }

        if (!data.quote || !data.paymentPolicy) {
          setShippingQuote(null);
          setPaymentPolicy(null);
          setShippingQuoteError("Shipping quote is unavailable for this location.");
          return;
        }

        setShippingQuote(data.quote);
        setPaymentPolicy(data.paymentPolicy);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setShippingQuote(null);
        setPaymentPolicy(null);
        setShippingQuoteError("Unable to fetch shipping quote. Please try again.");
      } finally {
        if (!cancelled) {
          setShippingQuoteLoading(false);
        }
      }
    };

    void loadShippingQuote();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    canRequestShippingQuote,
    form.country,
    form.stateRegion,
    form.townshipCity,
    subtotalAmountInt,
  ]);

  useEffect(() => {
    if (!paymentPolicy) {
      setForm((prev) => ({
        ...prev,
        paymentMethod: "",
      }));
      setSelectedTransferMethodId("");
      setTransferMethods([]);
      setTransferMethodsError("");
      return;
    }

    if (paymentPolicy.requiresProof) {
      setForm((prev) => ({
        ...prev,
        paymentMethod: "PREPAID_TRANSFER",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      paymentMethod: "COD",
      paymentProofUrl: "",
      paymentReference: "",
    }));
    setPaymentUploadError("");
    setPaymentUploadStatus("");
    setSelectedTransferMethodId("");
    setCopyStatusText("");
    setTransferMethods([]);
    setTransferMethodsError("");
  }, [paymentPolicy]);

  useEffect(() => {
    if (!requiresPrepaidProof) {
      return;
    }

    let cancelled = false;

    const loadTransferMethods = async () => {
      setTransferMethodsLoading(true);
      setTransferMethodsError("");
      try {
        const response = await fetch("/api/checkout/prepaid-transfer-methods", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          ok?: boolean;
          methods?: PaymentTransferMethodOption[];
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.ok || !Array.isArray(data.methods)) {
          setTransferMethods([]);
          setTransferMethodsError(data.error ?? "Failed to load transfer methods.");
          return;
        }

        const methods = data.methods;
        setTransferMethods(methods);
        setSelectedTransferMethodId((prev) => {
          if (prev && methods.some((method) => method.methodCode === prev)) {
            return prev;
          }

          return methods[0]?.methodCode ?? "";
        });
      } catch {
        if (!cancelled) {
          setTransferMethods([]);
          setTransferMethodsError("Failed to load transfer methods.");
        }
      } finally {
        if (!cancelled) {
          setTransferMethodsLoading(false);
        }
      }
    };

    void loadTransferMethods();

    return () => {
      cancelled = true;
    };
  }, [requiresPrepaidProof]);

  async function copyText(value: string, successLabel: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatusText(`${successLabel} copied.`);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopyStatusText(`${successLabel} copied.`);
    }
  }

  async function uploadPaymentProof(file: File) {
    if (!ALLOWED_PAYMENT_PROOF_MIME_TYPES.has(file.type)) {
      setPaymentUploadError("Unsupported image format. Use JPG, PNG, WEBP, or AVIF.");
      return;
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE_BYTES) {
      setPaymentUploadError("Payment proof image must be 8 MB or smaller.");
      return;
    }

    setPaymentUploading(true);
    setPaymentUploadError("");
    setPaymentUploadStatus("Uploading payment proof...");

    try {
      const signResponse = await fetch("/api/checkout/payment-proof/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const signData = (await signResponse.json()) as {
        ok?: boolean;
        uploadUrl?: string;
        publicUrl?: string;
        error?: string;
      };

      if (!signResponse.ok || !signData.ok || !signData.uploadUrl || !signData.publicUrl) {
        setPaymentUploadError(signData.error ?? "Failed to prepare payment proof upload.");
        setPaymentUploadStatus("");
        return;
      }

      const uploadResponse = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        const fallbackForm = new FormData();
        fallbackForm.append("file", file);
        const fallbackResponse = await fetch("/api/checkout/payment-proof/upload", {
          method: "POST",
          body: fallbackForm,
        });
        const fallbackData = (await fallbackResponse.json()) as {
          ok?: boolean;
          url?: string;
          error?: string;
        };

        if (!fallbackResponse.ok || !fallbackData.ok || !fallbackData.url) {
          setPaymentUploadError(fallbackData.error ?? "Failed to upload payment proof image.");
          setPaymentUploadStatus("");
          return;
        }

        onChange("paymentProofUrl", fallbackData.url);
        setPaymentUploadStatus("Payment proof uploaded.");
        return;
      }

      onChange("paymentProofUrl", signData.publicUrl);
      setPaymentUploadStatus("Payment proof uploaded.");
    } catch {
      setPaymentUploadError("Unexpected error while uploading payment proof.");
      setPaymentUploadStatus("");
    } finally {
      setPaymentUploading(false);
    }
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
    if (!form.termsAccepted) {
      errors.termsAccepted = "Please agree to Terms and Privacy Policy.";
    }
    if (!paymentPolicy) {
      errors.paymentMethod = "Shipping quote is required before payment method can be set.";
    } else if (paymentPolicy.requiresProof) {
      if (form.paymentMethod !== "PREPAID_TRANSFER") {
        errors.paymentMethod = "Prepaid transfer is required for this delivery zone.";
      }
      if (!selectedTransferMethodId) {
        errors.paymentMethod = "Please select a transfer method.";
      }
      if (transferMethodsError) {
        errors.paymentMethod = "Transfer methods are unavailable. Please try again.";
      }
      if (!form.paymentProofUrl.trim()) {
        errors.paymentProofUrl = "Please upload a payment screenshot for prepaid transfer.";
      }
    } else if (form.paymentMethod !== "COD") {
      errors.paymentMethod = "Cash on delivery is the only payment method for Yangon.";
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
    if (!shippingQuote) {
      setStatusText(
        shippingQuoteError || "Shipping quote is not ready. Please check your address and try again.",
      );
      return;
    }

    setSubmitting(true);
    setStatusText("");
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const checkoutPayload = {
        ...form,
        paymentMethod: form.paymentMethod || undefined,
        paymentProofUrl: form.paymentProofUrl.trim(),
        paymentReference: requiresPrepaidProof
          ? `${selectedTransferMethodId}${form.paymentReference.trim() ? `:${form.paymentReference.trim()}` : ""}`
          : form.paymentReference.trim(),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKeyRef.current,
        },
        body: JSON.stringify(checkoutPayload),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        setStatusText(`Checkout failed (${response.status}). Please try again.`);
        return;
      }

      const parsedData =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;

      if (!response.ok || !parsedData?.ok) {
        if (Array.isArray(parsedData?.issues)) {
          const nextFieldErrors: FieldErrors = {};
          for (const issue of parsedData.issues) {
            const pathKey = issue?.path?.[0];
            if (typeof pathKey === "string" && pathKey in form) {
              nextFieldErrors[pathKey as keyof CheckoutForm] = issue.message;
            }
          }
          setFieldErrors(nextFieldErrors);
        }
        if (parsedData?.code === "INSUFFICIENT_STOCK") {
          setStatusText("Some items are out of stock. Please review your cart.");
        } else if (parsedData?.code === "PAYMENT_PROOF_REQUIRED") {
          setStatusText("Upload a payment screenshot before placing this order.");
        } else if (
          parsedData?.code === "INVALID_PAYMENT_METHOD_FOR_ZONE" ||
          parsedData?.code === "TRANSFER_METHOD_REQUIRED" ||
          parsedData?.code === "INVALID_TRANSFER_METHOD"
        ) {
          setStatusText("This payment method is not allowed for your delivery location.");
        } else {
          setStatusText(
            typeof parsedData?.error === "string" ? parsedData.error : "Failed to place order."
          );
        }
        return;
      }

      const orderCode =
        parsedData.order &&
        typeof parsedData.order === "object" &&
        "orderCode" in parsedData.order &&
        typeof parsedData.order.orderCode === "string"
          ? parsedData.order.orderCode
          : null;

      if (!orderCode) {
        setStatusText("Order created but response was invalid. Please check your order list.");
        return;
      }

      router.push(`/order/success/${orderCode}`);
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
      <h1 className="mb-6 text-3xl font-semibold text-ink sm:text-4xl">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-4 vintage-panel p-5">
          <h2 className="text-lg font-semibold">Billing Information</h2>

          <input
            required
            placeholder="Full Name"
            value={form.customerName}
            onChange={(event) => onChange("customerName", event.target.value)}
            className="field-input"
          />
          {fieldErrors.customerName ? <p className="text-xs text-seal-wax">{fieldErrors.customerName}</p> : null}
          <input
            required
            placeholder="Phone Number"
            value={form.customerPhone}
            onChange={(event) => onChange("customerPhone", event.target.value)}
            className="field-input"
          />
          {fieldErrors.customerPhone ? <p className="text-xs text-seal-wax">{fieldErrors.customerPhone}</p> : null}
          <input
            placeholder="Email (optional)"
            value={form.customerEmail}
            onChange={(event) => onChange("customerEmail", event.target.value)}
            className="field-input"
          />
          {fieldErrors.customerEmail ? <p className="text-xs text-seal-wax">{fieldErrors.customerEmail}</p> : null}
          <select
            required
            value={form.country}
            onChange={(event) => onChange("country", event.target.value)}
            className="field-select"
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
            className="field-select"
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
            className="field-select"
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
            className="field-input"
          />
          {fieldErrors.addressLine1 ? <p className="text-xs text-seal-wax">{fieldErrors.addressLine1}</p> : null}
          <input
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(event) => onChange("addressLine2", event.target.value)}
            className="field-input"
          />
          <input
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            className="field-input"
          />
          <textarea
            placeholder="Order note (optional)"
            value={form.customerNote}
            onChange={(event) => onChange("customerNote", event.target.value)}
            className="field-input min-h-24"
          />
          <div className="space-y-3 rounded border border-sepia-border/70 bg-paper-light p-3">
            <h3 className="text-sm font-semibold text-ink">Payment</h3>
            {!shippingQuote ? (
              <p className="text-xs text-charcoal">
                Select your delivery state and township to load payment options.
              </p>
            ) : null}
            {shippingQuote ? (
              <p className="text-xs text-charcoal">
                Delivery zone: <span className="font-medium text-ink">{shippingQuote.zoneLabel}</span>
              </p>
            ) : null}
            {paymentPolicy && !requiresPrepaidProof ? (
              <div className="space-y-1 text-xs text-charcoal">
                <p className="font-medium text-ink">Cash on Delivery (Yangon only)</p>
                <p>You can pay cash when your order arrives.</p>
              </div>
            ) : null}
            {paymentPolicy && requiresPrepaidProof ? (
              <div className="space-y-3 text-xs text-charcoal">
                <p className="font-medium text-ink">Prepaid Transfer Required</p>
                <p>
                  For this delivery zone, complete a transfer via KBZPay, AyaPay, or WavePay, then
                  upload your payment screenshot.
                </p>
                <div className="rounded border border-sepia-border/70 bg-parchment px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-charcoal/75">Exact Amount to Transfer</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {formatMoney(String(grandTotalAmount), cart.currency)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-ink">Transfer Method</p>
                  {transferMethodsLoading ? (
                    <p className="text-xs text-charcoal">Loading payment channels...</p>
                  ) : null}
                  {transferMethodsError ? (
                    <p className="text-xs text-seal-wax">{transferMethodsError}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {transferMethods.map((method) => (
                      <button
                        key={method.methodCode}
                        type="button"
                        onClick={() => setSelectedTransferMethodId(method.methodCode)}
                        className={`border px-2 py-2 text-[11px] uppercase tracking-[0.08em] transition ${
                          selectedTransferMethodId === method.methodCode
                            ? "border-antique-brass bg-antique-brass/10 text-ink"
                            : "border-sepia-border text-charcoal hover:bg-parchment"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                  {selectedTransferMethod ? (
                    <div className="space-y-2 rounded border border-sepia-border/70 bg-paper-light p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-ink">{selectedTransferMethod.label}</p>
                        <button
                          type="button"
                          className="text-[11px] underline hover:text-ink"
                          onClick={() => {
                            const chunks = [
                              selectedTransferMethod.label,
                              `Name: ${selectedTransferMethod.accountName}`,
                              selectedTransferMethod.accountNumber
                                ? `Account Number: ${selectedTransferMethod.accountNumber}`
                                : null,
                              selectedTransferMethod.phoneNumber
                                ? `Phone Number: ${selectedTransferMethod.phoneNumber}`
                                : null,
                            ].filter(Boolean);
                            void copyText(chunks.join("\n"), `${selectedTransferMethod.label} details`);
                          }}
                        >
                          Copy all
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p>Name: {selectedTransferMethod.accountName}</p>
                          <button
                            type="button"
                            className="text-[11px] underline hover:text-ink"
                            onClick={() =>
                              void copyText(selectedTransferMethod.accountName, "Account name")
                            }
                          >
                            Copy
                          </button>
                        </div>
                        {selectedTransferMethod.accountNumber ? (
                          <div className="flex items-center justify-between gap-2">
                            <p>Account Number: {selectedTransferMethod.accountNumber}</p>
                            <button
                              type="button"
                              className="text-[11px] underline hover:text-ink"
                              onClick={() =>
                                void copyText(selectedTransferMethod.accountNumber ?? "", "Account number")
                              }
                            >
                              Copy
                            </button>
                          </div>
                        ) : null}
                        {selectedTransferMethod.phoneNumber ? (
                          <div className="flex items-center justify-between gap-2">
                            <p>Phone Number: {selectedTransferMethod.phoneNumber}</p>
                            <button
                              type="button"
                              className="text-[11px] underline hover:text-ink"
                              onClick={() =>
                                void copyText(selectedTransferMethod.phoneNumber ?? "", "Phone number")
                              }
                            >
                              Copy
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {copyStatusText ? <p className="text-[11px] text-teak-brown">{copyStatusText}</p> : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink" htmlFor="payment-proof-file">
                    Payment Screenshot
                  </label>
                  <input
                    id="payment-proof-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="field-input py-2 text-xs"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      void uploadPaymentProof(file);
                    }}
                  />
                  {paymentUploading ? <p className="text-xs text-charcoal">Uploading...</p> : null}
                  {paymentUploadStatus ? (
                    <p className="text-xs text-teak-brown">{paymentUploadStatus}</p>
                  ) : null}
                  {form.paymentProofUrl ? (
                    <Link
                      href={form.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline hover:text-ink"
                    >
                      View uploaded proof
                    </Link>
                  ) : null}
                  {paymentUploadError ? (
                    <p className="text-xs text-seal-wax">{paymentUploadError}</p>
                  ) : null}
                  {fieldErrors.paymentProofUrl ? (
                    <p className="text-xs text-seal-wax">{fieldErrors.paymentProofUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink" htmlFor="payment-reference">
                    Transfer Reference (optional)
                  </label>
                  <input
                    id="payment-reference"
                    placeholder="Last 6 digits / transaction id"
                    value={form.paymentReference}
                    onChange={(event) => onChange("paymentReference", event.target.value)}
                    className="field-input py-2 text-sm"
                  />
                </div>
              </div>
            ) : null}
            {fieldErrors.paymentMethod ? (
              <p className="text-xs text-seal-wax">{fieldErrors.paymentMethod}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="flex items-start gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => onChange("termsAccepted", event.target.checked)}
                className="mt-0.5 h-4 w-4 border border-sepia-border"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="underline hover:text-ink">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="underline hover:text-ink">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {fieldErrors.termsAccepted ? (
              <p className="text-xs text-seal-wax">{fieldErrors.termsAccepted}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              !shippingQuote ||
              (requiresPrepaidProof &&
                (!selectedTransferMethodId ||
                  !form.paymentProofUrl ||
                  paymentUploading ||
                  transferMethodsLoading ||
                  Boolean(transferMethodsError)))
            }
            className="btn-primary w-full disabled:opacity-60 sm:w-auto"
          >
            {submitting
              ? "Placing order..."
              : requiresPrepaidProof
                ? "Place Order (Prepaid Transfer)"
                : "Place Order (Cash on Delivery)"}
          </button>
          {shippingQuoteLoading ? (
            <p className="text-xs text-charcoal">Calculating shipping fee...</p>
          ) : null}
          {shippingQuoteError ? (
            <p className="text-xs text-seal-wax">{shippingQuoteError}</p>
          ) : null}
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
          <div className="mt-2 flex items-center justify-between text-sm">
            <p>Shipping</p>
            <p>{formatMoney(String(deliveryFeeAmount), cart.currency)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-sepia-border pt-2 text-base font-semibold">
            <p>Total</p>
            <p>{formatMoney(String(grandTotalAmount), cart.currency)}</p>
          </div>
          {shippingQuote ? (
            <div className="mt-3 rounded border border-sepia-border/70 bg-parchment p-2 text-xs text-charcoal">
              <p>Zone: {shippingQuote.zoneLabel}</p>
              <p>Estimated delivery: {shippingQuote.etaLabel}</p>
              {paymentPolicy ? (
                <p>
                  Payment: {paymentPolicy.requiresProof ? "Prepaid transfer + proof upload" : "Cash on delivery"}
                </p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>

      {statusText ? (
        <p className="mt-4 text-sm text-seal-wax" aria-live="polite">
          {statusText}
        </p>
      ) : null}
    </main>
  );
}
