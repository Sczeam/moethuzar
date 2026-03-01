"use client";

import Link from "next/link";
import { ADMIN_SETTINGS_NAV_LINKS, PAYMENT_TRANSFER_METHODS_COPY } from "@/lib/admin/settings-copy";
import { getPaymentDeleteWarning, getPaymentHealth } from "@/lib/admin/settings-guardrails";
import {
  createPaymentTransferMethodFormDraft,
  maskPaymentDestination,
  nextMethodSortOrder,
  paymentTransferMethodToDraft,
  toPaymentTransferMethodPayload,
  withChannelType,
  type ChannelType,
  type PaymentTransferMethodFormDraft,
  type PaymentTransferMethodRecord,
} from "@/lib/admin/payment-transfer-method-form-adapter";
import { type Dispatch, type FormEvent, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

type PaymentTransferMethod = PaymentTransferMethodRecord;

function apiErrorText(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const payload = data as { error?: unknown; code?: unknown; requestId?: unknown };
  const errorText = typeof payload.error === "string" ? payload.error : fallback;
  const codeText = typeof payload.code === "string" ? payload.code : null;
  const requestIdText = typeof payload.requestId === "string" ? payload.requestId : null;

  if (codeText && requestIdText) return `${errorText} (${codeText}, requestId: ${requestIdText})`;
  if (codeText) return `${errorText} (${codeText})`;
  return errorText;
}

export default function PaymentTransferMethodsClient() {
  const [methods, setMethods] = useState<PaymentTransferMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<PaymentTransferMethodFormDraft>(
    createPaymentTransferMethodFormDraft(1),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<PaymentTransferMethodFormDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCount = useMemo(() => methods.filter((method) => method.isActive).length, [methods]);
  const paymentHealth = useMemo(() => getPaymentHealth(methods), [methods]);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setStatusText("");
    try {
      const response = await fetch("/api/admin/payment-transfer-methods");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, PAYMENT_TRANSFER_METHODS_COPY.loadFailed));
        return;
      }

      const nextMethods = data.methods as PaymentTransferMethod[];
      setMethods(nextMethods);
      setCreateDraft(createPaymentTransferMethodFormDraft(nextMethodSortOrder(nextMethods)));
    } catch {
      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.loadUnexpected);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  async function createMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setStatusText("");

    const mapped = toPaymentTransferMethodPayload(createDraft, nextMethodSortOrder(methods));
    if (!mapped.ok) {
      setStatusText(mapped.error);
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/payment-transfer-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped.payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, PAYMENT_TRANSFER_METHODS_COPY.createFailed));
        return;
      }
      setCreateDraft(createPaymentTransferMethodFormDraft(nextMethodSortOrder(methods)));
      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.createSuccess(data.method.label));
      await loadMethods();
    } catch {
      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.createUnexpected);
    } finally {
      setCreating(false);
    }
  }

  async function updateMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editingDraft) return;

    setSaving(true);
    setStatusText("");
    const mapped = toPaymentTransferMethodPayload(editingDraft, nextMethodSortOrder(methods), {
      preserveMethodCode: true,
    });
    if (!mapped.ok) {
      setStatusText(mapped.error);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/payment-transfer-methods/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped.payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, PAYMENT_TRANSFER_METHODS_COPY.updateFailed));
        return;
      }

      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.updateSuccess(data.method.label));
      await loadMethods();
    } catch {
      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.updateUnexpected);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMethod(method: PaymentTransferMethod) {
    const warning = getPaymentDeleteWarning(method, activeCount);
    if (warning.startsWith("Cannot delete")) {
      setStatusText(warning);
      return;
    }

    const confirmed = window.confirm(warning);
    if (!confirmed) return;

    setDeletingId(method.id);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/payment-transfer-methods/${method.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, PAYMENT_TRANSFER_METHODS_COPY.deleteFailed));
        return;
      }

      if (editingId === method.id) {
        setEditingId(null);
        setEditingDraft(null);
      }

      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.deleteSuccess);
      await loadMethods();
    } catch {
      setStatusText(PAYMENT_TRANSFER_METHODS_COPY.deleteUnexpected);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">{PAYMENT_TRANSFER_METHODS_COPY.pageTitle}</h1>
        <div className="flex gap-2">
          {ADMIN_SETTINGS_NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="btn-secondary">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mb-1 text-sm text-charcoal">
        {PAYMENT_TRANSFER_METHODS_COPY.activeCountLabel(activeCount)}
      </p>
      {activeCount === 0 ? (
        <p className="mb-4 text-xs text-seal-wax">{PAYMENT_TRANSFER_METHODS_COPY.activeCountWarning}</p>
      ) : null}

      <section className="vintage-panel mb-6 p-5">
        <h2 className="text-xl font-semibold text-ink">{PAYMENT_TRANSFER_METHODS_COPY.healthTitle}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">{PAYMENT_TRANSFER_METHODS_COPY.healthActiveLabel}</p>
            <p className="text-2xl font-semibold text-ink">{paymentHealth.activeCount}</p>
          </div>
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">{PAYMENT_TRANSFER_METHODS_COPY.healthBankLabel}</p>
            <p className="text-2xl font-semibold text-ink">{paymentHealth.activeBankCount}</p>
          </div>
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">{PAYMENT_TRANSFER_METHODS_COPY.healthWalletLabel}</p>
            <p className="text-2xl font-semibold text-ink">{paymentHealth.activeWalletCount}</p>
          </div>
        </div>
        {paymentHealth.warnings.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-seal-wax">
            {paymentHealth.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-charcoal">Prepaid checkout availability is healthy.</p>
        )}
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">
          {PAYMENT_TRANSFER_METHODS_COPY.currentSectionTitle}
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-charcoal">{PAYMENT_TRANSFER_METHODS_COPY.loadingText}</p>
        ) : null}
        {!loading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-parchment text-left text-charcoal">
                <tr>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Transfer destination</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-t border-sepia-border/60">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{method.label}</div>
                      <div className="font-mono text-xs text-charcoal">{method.methodCode}</div>
                    </td>
                    <td className="px-3 py-2">{method.channelType === "BANK" ? "Bank transfer" : "Wallet"}</td>
                    <td className="px-3 py-2">
                      {method.channelType === "BANK"
                        ? `A/C ${maskPaymentDestination(method.accountNumber)}`
                        : `Phone ${maskPaymentDestination(method.phoneNumber)}`}
                    </td>
                    <td className="px-3 py-2">{method.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingId(method.id);
                            setEditingDraft(paymentTransferMethodToDraft(method));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={deletingId === method.id}
                          onClick={() => void deleteMethod(method)}
                        >
                          {deletingId === method.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-charcoal">
                      {PAYMENT_TRANSFER_METHODS_COPY.emptyStateText}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="vintage-panel mt-6 p-5">
        <h2 className="text-xl font-semibold text-ink">
          {PAYMENT_TRANSFER_METHODS_COPY.createSectionTitle}
        </h2>
        <MethodForm
          draft={createDraft}
          onChange={setCreateDraft}
          onSubmit={createMethod}
          submitLabel={
            creating
              ? PAYMENT_TRANSFER_METHODS_COPY.form.createSubmitting
              : PAYMENT_TRANSFER_METHODS_COPY.form.createSubmit
          }
          disabled={creating}
        />
      </section>

      {editingDraft && editingId ? (
        <section className="vintage-panel mt-6 p-5">
          <h2 className="text-xl font-semibold text-ink">
            {PAYMENT_TRANSFER_METHODS_COPY.editSectionTitle}
          </h2>
          <p className="mt-1 text-xs text-charcoal">Method ID: {editingId}</p>
          <MethodForm
            draft={editingDraft}
            onChange={(updater) =>
              setEditingDraft((prev) => {
                const current = prev ?? createPaymentTransferMethodFormDraft(nextMethodSortOrder(methods));
                return typeof updater === "function"
                  ? (updater as (value: PaymentTransferMethodFormDraft) => PaymentTransferMethodFormDraft)(current)
                  : updater;
              })
            }
            onSubmit={updateMethod}
            submitLabel={
              saving
                ? PAYMENT_TRANSFER_METHODS_COPY.form.editSubmitting
                : PAYMENT_TRANSFER_METHODS_COPY.form.editSubmit
            }
            disabled={saving}
          />
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => {
              setEditingId(null);
              setEditingDraft(null);
            }}
          >
            {PAYMENT_TRANSFER_METHODS_COPY.closeEditorLabel}
          </button>
        </section>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-charcoal">{statusText}</p> : null}
    </main>
  );
}

function MethodForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  disabled,
}: {
  draft: PaymentTransferMethodFormDraft;
  onChange: Dispatch<SetStateAction<PaymentTransferMethodFormDraft>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitLabel: string;
  disabled: boolean;
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-charcoal">
          <span>Method label</span>
          <input
            value={draft.label}
            onChange={(event) => onChange((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="e.g. KBZPay Personal"
            className="field-input"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-charcoal">
          <span>Channel</span>
          <select
            value={draft.channelType}
            onChange={(event) =>
              onChange((prev) => withChannelType(prev, event.target.value as ChannelType))
            }
            className="field-select"
          >
            <option value="BANK">Bank</option>
            <option value="WALLET">Wallet</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-charcoal">
          <span>Account name</span>
          <input
            value={draft.accountName}
            onChange={(event) => onChange((prev) => ({ ...prev, accountName: event.target.value }))}
            placeholder="Account holder name"
            className="field-input"
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {draft.channelType === "BANK" ? (
          <label className="space-y-1 text-sm text-charcoal">
            <span>Account number</span>
            <input
              value={draft.accountNumber}
              onChange={(event) => onChange((prev) => ({ ...prev, accountNumber: event.target.value }))}
              placeholder="Bank account number"
              className="field-input"
              required
            />
          </label>
        ) : (
          <label className="space-y-1 text-sm text-charcoal">
            <span>Phone number</span>
            <input
              value={draft.phoneNumber}
              onChange={(event) => onChange((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              placeholder="Wallet phone number"
              className="field-input"
              required
            />
          </label>
        )}

        <label className="space-y-1 text-sm text-charcoal">
          <span>Instructions (optional)</span>
          <input
            value={draft.instructions}
            onChange={(event) => onChange((prev) => ({ ...prev, instructions: event.target.value }))}
            placeholder="e.g. Include transfer note with order code"
            className="field-input"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-charcoal">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => onChange((prev) => ({ ...prev, isActive: event.target.checked }))}
        />
        Active in checkout
      </label>

      <button type="submit" disabled={disabled} className="btn-primary disabled:opacity-60">
        {submitLabel}
      </button>
    </form>
  );
}
