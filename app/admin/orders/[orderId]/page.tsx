"use client";

import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";
import {
  ACTION_DESCRIPTORS,
  COPY_TEXT,
  type CopyKey,
  type OrderActionId,
} from "@/lib/constants/admin-order-action-contract";
import {
  buildOrderActionRequest,
  INVALID_TRANSITION_CODES,
} from "./order-action-adapter";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = UiOrderStatus;
type PaymentMethod = "COD" | "PREPAID_TRANSFER";
type PaymentStatus = "NOT_REQUIRED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

type OrderDetail = {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  paymentReference: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  totalAmount: string;
  deliveryFeeAmount: string;
  currency: string;
  shippingZoneKey: string | null;
  shippingZoneLabel: string | null;
  shippingEtaLabel: string | null;
  address: {
    stateRegion: string;
    townshipCity: string;
    addressLine1: string;
    addressLine2: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    lineTotal: string;
  }>;
  history: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
  }>;
  actionState: {
    allowedActions: OrderActionId[];
    recommendedAction: OrderActionId | null;
    blockedActions: Array<{
      actionId: OrderActionId;
      reasonKey: CopyKey;
    }>;
  };
};

function paymentStatusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "REJECTED":
      return "bg-seal-wax/10 text-seal-wax";
    default:
      return "bg-paper-light text-charcoal";
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusText, setStatusText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<OrderActionId | null>(null);
  const [actionNote, setActionNote] = useState("");
  const router = useRouter();

  const loadOrder = useCallback(async () => {
    setLoadError("");
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setLoadError(data.error ?? "Failed to load order.");
      setStatusText(
        typeof data?.requestId === "string" ? `Request ID: ${data.requestId}` : "Please retry."
      );
      setLoading(false);
      return;
    }

    setOrder(data.order);
    setStatusText("");
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    (async () => {
      await loadOrder();
      setLoading(false);
    })();
  }, [loadOrder]);

  const actionState = useMemo(() => {
    if (!order) {
      return null;
    }
    return order.actionState;
  }, [order]);

  const recommendedAction = actionState?.recommendedAction ?? null;
  const allowedActions = actionState?.allowedActions ?? [];
  const secondaryAllowedActions = useMemo(
    () => allowedActions.filter((actionId) => actionId !== recommendedAction),
    [allowedActions, recommendedAction]
  );
  const blockedActionReasons = useMemo(() => {
    const map = new Map<OrderActionId, CopyKey>();
    for (const blocked of actionState?.blockedActions ?? []) {
      if (!map.has(blocked.actionId)) {
        map.set(blocked.actionId, blocked.reasonKey);
      }
    }
    return map;
  }, [actionState?.blockedActions]);

  async function runAction() {
    if (!order || !selectedActionId) {
      return;
    }

    const descriptor = ACTION_DESCRIPTORS[selectedActionId];
    if (descriptor.requiresNote && actionNote.trim().length < 4) {
      setStatusText("Please add a note with at least 4 characters.");
      return;
    }

    const request = buildOrderActionRequest(orderId, selectedActionId, actionNote);

    setActionPending(true);
    setStatusText("");

    try {
      const response = await fetch(request.endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (INVALID_TRANSITION_CODES.has(data?.code)) {
          setStatusText(COPY_TEXT["error.action.invalid_transition"]);
        } else {
          setStatusText(data.error ?? COPY_TEXT["error.action.generic"]);
        }
        return;
      }

      setStatusText(COPY_TEXT[descriptor.successMessageKey]);
      setSelectedActionId(null);
      setActionNote("");
      await loadOrder();
    } catch {
      setStatusText(COPY_TEXT["error.action.generic"]);
    } finally {
      setActionPending(false);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatusText(successMessage);
    } catch {
      setStatusText("Unable to copy.");
    }
  }

  return (
    <main className="vintage-shell max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            Back to Orders
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            Shipping Rules
          </Link>
          <Link href="/admin/payment-transfer-methods" className="btn-secondary">
            Payment Methods
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            router.refresh();
            void (async () => {
              await loadOrder();
              setLoading(false);
            })();
          }}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-charcoal">Loading order...</p> : null}

      {!loading && loadError ? (
        <section className="vintage-panel border-seal-wax/40 p-5">
          <h2 className="text-xl font-semibold text-ink">Unable to load order</h2>
          <p className="mt-2 text-sm text-charcoal">{loadError}</p>
          {statusText ? <p className="mt-1 text-xs text-charcoal/80">{statusText}</p> : null}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadOrder();
            }}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !loadError && order ? (
        <div className="space-y-6">
          <section className="vintage-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{order.orderCode}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <p className="text-sm text-charcoal">
                    Total: {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void copyText(order.orderCode, "Order code copied.")}
                className="btn-secondary text-xs"
              >
                Copy Order Code
              </button>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Customer</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-charcoal">{order.customerPhone}</p>
                {order.customerEmail ? <p className="text-sm text-charcoal">{order.customerEmail}</p> : null}
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="btn-primary text-xs"
                >
                  Call Customer
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(order.customerPhone, "Customer phone copied to clipboard.")
                  }
                  className="btn-secondary text-xs"
                >
                  Copy Phone
                </button>
              </div>
            </div>
            {order.address ? (
              <p className="mt-3 text-sm text-charcoal">
                {order.address.addressLine1}
                {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""},{" "}
                {order.address.townshipCity}, {order.address.stateRegion}
              </p>
            ) : null}
            {order.customerNote ? (
              <p className="mt-3 rounded-md bg-parchment p-3 text-sm text-charcoal">
                Customer note: {order.customerNote}
              </p>
            ) : null}
            <div className="mt-3 grid gap-1 text-sm text-charcoal">
              <p>Delivery fee: {Number(order.deliveryFeeAmount).toLocaleString()} MMK</p>
              <p>Shipping zone: {order.shippingZoneLabel ?? order.shippingZoneKey ?? "N/A"}</p>
              <p>Delivery ETA: {order.shippingEtaLabel ?? "N/A"}</p>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Payment</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <p>
                Method:{" "}
                <span className="font-semibold">
                  {order.paymentMethod === "PREPAID_TRANSFER"
                    ? "Prepaid Transfer"
                    : "Cash on Delivery"}
                </span>
              </p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusBadgeClass(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus}
              </span>
            </div>

            {order.paymentMethod === "PREPAID_TRANSFER" ? (
              <div className="mt-3 space-y-2 text-sm text-charcoal">
                {order.paymentReference ? (
                  <p>
                    Transfer reference: <span className="font-medium">{order.paymentReference}</span>
                  </p>
                ) : null}
                {order.paymentSubmittedAt ? (
                  <p>Submitted: {new Date(order.paymentSubmittedAt).toLocaleString()}</p>
                ) : null}
                {order.paymentVerifiedAt ? (
                  <p>Reviewed at: {new Date(order.paymentVerifiedAt).toLocaleString()}</p>
                ) : null}
                {order.paymentProofUrl ? (
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary inline-flex text-xs"
                  >
                    Open Payment Proof
                  </a>
                ) : (
                  <p className="text-seal-wax">Payment proof missing.</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-charcoal">
                No payment review required for COD orders.
              </p>
            )}
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <p>
                    {item.productName}
                    {item.variantName ? ` (${item.variantName})` : ""} x {item.quantity}
                  </p>
                  <p>{Number(item.lineTotal).toLocaleString()} MMK</p>
                </div>
              ))}
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Action Center</h2>
            {recommendedAction ? (
              <div className="mt-3 rounded-lg border border-antique-brass/60 bg-parchment p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  Recommended Next Action
                </p>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => {
                    setSelectedActionId(recommendedAction);
                    setActionNote("");
                  }}
                  className="btn-primary mt-3 disabled:opacity-60"
                >
                  {COPY_TEXT[ACTION_DESCRIPTORS[recommendedAction].labelKey]}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-charcoal">No further actions available for this order.</p>
            )}

            {secondaryAllowedActions.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  Other Allowed Actions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {secondaryAllowedActions.map((actionId) => (
                    <button
                      key={actionId}
                      type="button"
                      disabled={actionPending}
                      onClick={() => {
                        setSelectedActionId(actionId);
                        setActionNote("");
                      }}
                      className="btn-secondary disabled:opacity-60"
                    >
                      {COPY_TEXT[ACTION_DESCRIPTORS[actionId].labelKey]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {blockedActionReasons.size > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  Blocked Actions
                </p>
                <div className="mt-2 space-y-2">
                  {Array.from(blockedActionReasons.entries()).map(([actionId, reasonKey]) => (
                    <div
                      key={actionId}
                      className="rounded-md border border-sepia-border/80 bg-paper-light px-3 py-2"
                    >
                      <button type="button" disabled className="btn-secondary opacity-60">
                        {COPY_TEXT[ACTION_DESCRIPTORS[actionId].labelKey]}
                      </button>
                      <p className="mt-2 text-xs text-charcoal/90">{COPY_TEXT[reasonKey]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Status Timeline</h2>
            <div className="mt-3 space-y-3">
              {order.history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm text-charcoal"
                >
                  <p>
                    {entry.fromStatus ?? "START"} {"->"} {entry.toStatus}
                  </p>
                  <p className="text-xs text-charcoal/80">{new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note ? <p className="mt-1 text-xs">{entry.note}</p> : null}
                </div>
              ))}
              {order.history.length === 0 ? (
                <p className="text-sm text-charcoal">No status history yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-charcoal">{statusText}</p> : null}

      {selectedActionId ? (
        <div className="fixed inset-0 z-60 bg-ink/35 p-4">
          <div className="mx-auto mt-20 w-full max-w-lg rounded-none border border-sepia-border bg-paper-light p-5">
            <h3 className="text-lg font-semibold text-ink">
              {COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].confirmTitleKey]}
            </h3>
            <p className="mt-2 text-sm text-charcoal">
              {COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].confirmBodyKey]}
            </p>

            <label className="mt-4 block text-xs font-medium text-charcoal">
              Note {ACTION_DESCRIPTORS[selectedActionId].requiresNote ? "(Required)" : "(Optional)"}
            </label>
            <textarea
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-none border border-sepia-border bg-parchment px-3 py-2 text-sm"
              placeholder={
                ACTION_DESCRIPTORS[selectedActionId].requiresNote
                  ? "Explain why this action is needed"
                  : "Add internal context (optional)"
              }
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => void runAction()}
                className="btn-primary disabled:opacity-60"
              >
                {actionPending ? "Saving..." : COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].labelKey]}
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() => {
                  setSelectedActionId(null);
                  setActionNote("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
