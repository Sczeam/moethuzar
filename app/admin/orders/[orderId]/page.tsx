"use client";

import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";
import {
  ACTION_DESCRIPTORS,
  COPY_TEXT,
  type CopyKey,
  type OrderActionId,
} from "@/lib/constants/admin-order-action-contract";
import { buildOrderActionRequest } from "./order-action-adapter";
import { mapOrderActionError, type ActionFeedbackSeverity } from "./action-feedback";
import { presentAdminApiError } from "@/lib/admin/error-presenter";
import { ADMIN_ORDERS_COPY } from "@/lib/admin/orders-copy";
import { ADMIN_A11Y } from "@/lib/admin/a11y-contract";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type OrderStatus = UiOrderStatus;
type PaymentMethod = "COD" | "PREPAID_TRANSFER";
type PaymentStatus = "NOT_REQUIRED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
type ActionFeedbackState = {
  severity: ActionFeedbackSeverity;
  message: string;
  retryable: boolean;
};

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

function feedbackClass(severity: ActionFeedbackSeverity) {
  switch (severity) {
    case "success":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border-antique-brass/70 bg-antique-brass/10 text-ink";
    case "error":
    default:
      return "border-seal-wax/40 bg-seal-wax/10 text-seal-wax";
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<OrderActionId | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [feedback, setFeedback] = useState<ActionFeedbackState | null>(null);
  const [retryIntent, setRetryIntent] = useState<{
    actionId: OrderActionId;
    note: string;
  } | null>(null);
  const modalCancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastActionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const loadOrder = useCallback(async () => {
    setLoadError("");
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const presented = presentAdminApiError(data, {
        fallback: ADMIN_ORDERS_COPY.load.loadFailedFallback,
        includeRequestId: true,
        includeFirstIssue: true,
      });
      setLoadError(presented);
      setFeedback({
        severity: "error",
        message: presented,
        retryable: true,
      });
      setLoading(false);
      return;
    }

    setOrder(data.order);
    setLoadError("");
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    (async () => {
      await loadOrder();
      setLoading(false);
    })();
  }, [loadOrder]);

  useEffect(() => {
    if (!feedback || feedback.severity !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback((current) => (current?.severity === "success" ? null : current));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!selectedActionId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actionPending) {
        setSelectedActionId(null);
        setNoteError("");
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]), textarea:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
          )
        );
        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const timer = window.setTimeout(() => {
      modalCancelButtonRef.current?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [selectedActionId, actionPending]);

  useEffect(() => {
    if (selectedActionId === null) {
      lastActionTriggerRef.current?.focus();
    }
  }, [selectedActionId]);

  const actionState = useMemo(() => {
    if (!order) {
      return null;
    }
    return order.actionState;
  }, [order]);

  const recommendedAction = actionState?.recommendedAction ?? null;
  const secondaryAllowedActions = useMemo(
    () => (actionState?.allowedActions ?? []).filter((actionId) => actionId !== recommendedAction),
    [actionState?.allowedActions, recommendedAction]
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

  async function runAction(intent?: { actionId: OrderActionId; note: string }) {
    if (!order) {
      return;
    }

    const actionId = intent?.actionId ?? selectedActionId;
    if (!actionId) {
      return;
    }
    const note = intent?.note ?? actionNote;

    const descriptor = ACTION_DESCRIPTORS[actionId];
    if (descriptor.requiresNote && note.trim().length < 4) {
      setNoteError(ADMIN_ORDERS_COPY.modal.requiredNoteError);
      return;
    }
    setNoteError("");

    const request = buildOrderActionRequest(orderId, actionId, note);

    setActionPending(true);
    setFeedback(null);
    setRetryIntent(null);

    try {
      const response = await fetch(request.endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const mapped = mapOrderActionError(data ?? {});
        setFeedback({
          severity: mapped.severity,
          message: mapped.message,
          retryable: mapped.retryable,
        });

        if (mapped.staleState) {
          setSelectedActionId(null);
          await loadOrder();
        } else if (mapped.retryable) {
          setRetryIntent({ actionId, note });
        }
        return;
      }

      setFeedback({
        severity: "success",
        message: COPY_TEXT[descriptor.successMessageKey],
        retryable: false,
      });
      setSelectedActionId(null);
      setActionNote("");
      setNoteError("");
      await loadOrder();
    } catch {
      setFeedback({
        severity: "error",
        message: COPY_TEXT["error.action.generic"],
        retryable: true,
      });
      setRetryIntent({ actionId, note });
    } finally {
      setActionPending(false);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({
        severity: "success",
        message: successMessage,
        retryable: false,
      });
    } catch {
        setFeedback({
          severity: "error",
          message: ADMIN_ORDERS_COPY.feedback.unableToCopy,
          retryable: false,
        });
    }
  }

  return (
    <main className="vintage-shell max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            {ADMIN_ORDERS_COPY.nav.backToOrders}
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            {ADMIN_ORDERS_COPY.nav.shippingRules}
          </Link>
          <Link href="/admin/payment-transfer-methods" className="btn-secondary">
            {ADMIN_ORDERS_COPY.nav.paymentMethods}
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
          {ADMIN_ORDERS_COPY.nav.refresh}
        </button>
      </div>

      {feedback ? (
        <section
          className={`mb-4 rounded-none border px-4 py-3 text-sm ${feedbackClass(feedback.severity)}`}
          role={feedback.severity === "error" ? "alert" : "status"}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex-1">{feedback.message}</p>
            {feedback.retryable && retryIntent ? (
              <button
                type="button"
                className={`btn-secondary text-sm ${ADMIN_A11Y.target.minInteractive}`}
                disabled={actionPending}
                onClick={() => void runAction(retryIntent)}
              >
                {actionPending ? ADMIN_ORDERS_COPY.feedback.retrying : ADMIN_ORDERS_COPY.feedback.retry}
              </button>
            ) : null}
            <button
              type="button"
              className={`btn-secondary text-sm ${ADMIN_A11Y.target.minInteractive}`}
              onClick={() => setFeedback(null)}
            >
              {ADMIN_ORDERS_COPY.feedback.dismiss}
            </button>
          </div>
        </section>
      ) : null}

      {loading ? <p className="text-charcoal">{ADMIN_ORDERS_COPY.load.loading}</p> : null}

      {!loading && loadError ? (
        <section className="vintage-panel border-seal-wax/40 p-5">
          <h2 className="text-xl font-semibold text-ink">{ADMIN_ORDERS_COPY.load.loadFailedTitle}</h2>
          <p className="mt-2 text-sm text-charcoal">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadOrder();
            }}
            className="btn-primary mt-4"
          >
            {ADMIN_ORDERS_COPY.load.retry}
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
                onClick={() =>
                  void copyText(order.orderCode, ADMIN_ORDERS_COPY.feedback.orderCodeCopied)
                }
                className={`btn-secondary text-sm ${ADMIN_A11Y.target.minInteractive}`}
              >
                {ADMIN_ORDERS_COPY.actions.copyOrderCode}
              </button>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">{ADMIN_ORDERS_COPY.customer.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-charcoal">{order.customerPhone}</p>
                {order.customerEmail ? <p className="text-sm text-charcoal">{order.customerEmail}</p> : null}
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className={`btn-primary text-sm ${ADMIN_A11Y.target.minInteractive}`}
                >
                  {ADMIN_ORDERS_COPY.customer.callCustomer}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(order.customerPhone, ADMIN_ORDERS_COPY.feedback.customerPhoneCopied)
                  }
                  className={`btn-secondary text-sm ${ADMIN_A11Y.target.minInteractive}`}
                >
                  {ADMIN_ORDERS_COPY.customer.copyPhone}
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
                {ADMIN_ORDERS_COPY.customer.customerNotePrefix} {order.customerNote}
              </p>
            ) : null}
            <div className="mt-3 grid gap-1 text-sm text-charcoal">
              <p>Delivery fee: {Number(order.deliveryFeeAmount).toLocaleString()} MMK</p>
              <p>Shipping zone: {order.shippingZoneLabel ?? order.shippingZoneKey ?? "N/A"}</p>
              <p>Delivery ETA: {order.shippingEtaLabel ?? "N/A"}</p>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">{ADMIN_ORDERS_COPY.payment.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <p>
                Method:{" "}
                <span className="font-semibold">
                  {order.paymentMethod === "PREPAID_TRANSFER"
                    ? ADMIN_ORDERS_COPY.payment.prepaidTransfer
                    : ADMIN_ORDERS_COPY.payment.cashOnDelivery}
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
                    {ADMIN_ORDERS_COPY.payment.transferReference}{" "}
                    <span className="font-medium">{order.paymentReference}</span>
                  </p>
                ) : null}
                {order.paymentSubmittedAt ? (
                  <p>
                    {ADMIN_ORDERS_COPY.payment.submittedAt}{" "}
                    {new Date(order.paymentSubmittedAt).toLocaleString()}
                  </p>
                ) : null}
                {order.paymentVerifiedAt ? (
                  <p>
                    {ADMIN_ORDERS_COPY.payment.reviewedAt}{" "}
                    {new Date(order.paymentVerifiedAt).toLocaleString()}
                  </p>
                ) : null}
                {order.paymentProofUrl ? (
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn-secondary inline-flex text-sm ${ADMIN_A11Y.target.minInteractive}`}
                  >
                    {ADMIN_ORDERS_COPY.payment.openPaymentProof}
                  </a>
                ) : (
                  <p className="text-seal-wax">Payment proof missing.</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-charcoal">
                {ADMIN_ORDERS_COPY.payment.noPaymentReviewRequired}
              </p>
            )}
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">{ADMIN_ORDERS_COPY.items.title}</h2>
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
            <h2 className="text-lg font-semibold">{ADMIN_ORDERS_COPY.actionCenter.title}</h2>
            {recommendedAction ? (
              <div className="mt-3 rounded-lg border border-antique-brass/60 bg-parchment p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  {ADMIN_ORDERS_COPY.actionCenter.recommended}
                </p>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={(event) => {
                    lastActionTriggerRef.current = event.currentTarget;
                    setSelectedActionId(recommendedAction);
                    setNoteError("");
                  }}
                  className="btn-primary mt-3 disabled:opacity-60"
                >
                  {COPY_TEXT[ACTION_DESCRIPTORS[recommendedAction].labelKey]}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-charcoal">
                {ADMIN_ORDERS_COPY.actionCenter.noFurtherActions}
              </p>
            )}

            {secondaryAllowedActions.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  {ADMIN_ORDERS_COPY.actionCenter.otherAllowed}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {secondaryAllowedActions.map((actionId) => (
                    <button
                      key={actionId}
                      type="button"
                      disabled={actionPending}
                      onClick={(event) => {
                        lastActionTriggerRef.current = event.currentTarget;
                        setSelectedActionId(actionId);
                        setNoteError("");
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
                  {ADMIN_ORDERS_COPY.actionCenter.blocked}
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
            <h2 className="text-lg font-semibold">{ADMIN_ORDERS_COPY.timeline.title}</h2>
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
                <p className="text-sm text-charcoal">{ADMIN_ORDERS_COPY.timeline.noHistory}</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {selectedActionId ? (
        <div
          className="fixed inset-0 z-60 bg-ink/35 p-4"
          onClick={() => {
            if (!actionPending) {
              setSelectedActionId(null);
              setNoteError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ADMIN_ORDERS_COPY.modal.ariaLabel}
            aria-describedby="order-action-confirm-body"
            ref={modalRef}
            className="mx-auto mt-20 w-full max-w-lg rounded-none border border-sepia-border bg-paper-light p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-ink">
              {COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].confirmTitleKey]}
            </h3>
            <p id="order-action-confirm-body" className="mt-2 text-sm text-charcoal">
              {COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].confirmBodyKey]}
            </p>

            <label className="mt-4 block text-xs font-medium text-charcoal">
              {ACTION_DESCRIPTORS[selectedActionId].requiresNote
                ? ADMIN_ORDERS_COPY.modal.noteRequired
                : ADMIN_ORDERS_COPY.modal.noteOptional}
            </label>
            <textarea
              value={actionNote}
              onChange={(event) => {
                setActionNote(event.target.value);
                if (noteError && event.target.value.trim().length >= 4) {
                  setNoteError("");
                }
              }}
              aria-invalid={noteError ? "true" : "false"}
              aria-describedby={noteError ? "order-action-note-error" : undefined}
              className="mt-1 min-h-24 w-full rounded-none border border-sepia-border bg-parchment px-3 py-2 text-sm"
              placeholder={
                ACTION_DESCRIPTORS[selectedActionId].requiresNote
                  ? ADMIN_ORDERS_COPY.modal.requiredPlaceholder
                  : ADMIN_ORDERS_COPY.modal.optionalPlaceholder
              }
            />
            {noteError ? (
              <p id="order-action-note-error" className="mt-2 text-xs text-seal-wax" role="alert">
                {noteError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => void runAction()}
                className={`btn-primary disabled:opacity-60 ${ADMIN_A11Y.target.minInteractive}`}
              >
                {actionPending
                  ? ADMIN_ORDERS_COPY.modal.saving
                  : COPY_TEXT[ACTION_DESCRIPTORS[selectedActionId].labelKey]}
              </button>
              <button
                type="button"
                disabled={actionPending}
                ref={modalCancelButtonRef}
                onClick={() => {
                  setSelectedActionId(null);
                  setNoteError("");
                }}
                className={`btn-secondary ${ADMIN_A11Y.target.minInteractive}`}
              >
                {ADMIN_ORDERS_COPY.modal.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
