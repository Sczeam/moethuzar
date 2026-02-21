"use client";

import Link from "next/link";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type ChannelType = "BANK" | "WALLET";

type PaymentTransferMethod = {
  id: string;
  methodCode: string;
  label: string;
  channelType: ChannelType;
  accountName: string;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
};

type MethodDraft = {
  methodCode: string;
  label: string;
  channelType: ChannelType;
  accountName: string;
  accountNumber: string;
  phoneNumber: string;
  instructions: string;
  isActive: boolean;
  sortOrder: string;
};

function createInitialDraft(): MethodDraft {
  return {
    methodCode: "",
    label: "",
    channelType: "BANK",
    accountName: "",
    accountNumber: "",
    phoneNumber: "",
    instructions: "",
    isActive: true,
    sortOrder: "0",
  };
}

function toDraft(method: PaymentTransferMethod): MethodDraft {
  return {
    methodCode: method.methodCode,
    label: method.label,
    channelType: method.channelType,
    accountName: method.accountName,
    accountNumber: method.accountNumber ?? "",
    phoneNumber: method.phoneNumber ?? "",
    instructions: method.instructions ?? "",
    isActive: method.isActive,
    sortOrder: String(method.sortOrder),
  };
}

function draftToPayload(draft: MethodDraft) {
  return {
    methodCode: draft.methodCode,
    label: draft.label,
    channelType: draft.channelType,
    accountName: draft.accountName,
    accountNumber: draft.accountNumber,
    phoneNumber: draft.phoneNumber,
    instructions: draft.instructions,
    isActive: draft.isActive,
    sortOrder: Number.parseInt(draft.sortOrder, 10),
  };
}

function apiErrorText(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as { error?: unknown; code?: unknown; requestId?: unknown };
  const errorText = typeof payload.error === "string" ? payload.error : fallback;
  const codeText = typeof payload.code === "string" ? payload.code : null;
  const requestIdText = typeof payload.requestId === "string" ? payload.requestId : null;

  if (codeText && requestIdText) {
    return `${errorText} (${codeText}, requestId: ${requestIdText})`;
  }

  if (codeText) {
    return `${errorText} (${codeText})`;
  }

  return errorText;
}

export default function PaymentTransferMethodsClient() {
  const [methods, setMethods] = useState<PaymentTransferMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<MethodDraft>(createInitialDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<MethodDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCount = useMemo(() => methods.filter((method) => method.isActive).length, [methods]);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setStatusText("");
    try {
      const response = await fetch("/api/admin/payment-transfer-methods");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to load payment transfer methods."));
        return;
      }

      setMethods(data.methods as PaymentTransferMethod[]);
    } catch {
      setStatusText("Unexpected error while loading payment transfer methods.");
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
    try {
      const response = await fetch("/api/admin/payment-transfer-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(createDraft)),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to create payment transfer method."));
        return;
      }
      setCreateDraft(createInitialDraft());
      setStatusText(`Created ${data.method.label}.`);
      await loadMethods();
    } catch {
      setStatusText("Unexpected error while creating payment transfer method.");
    } finally {
      setCreating(false);
    }
  }

  async function updateMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editingDraft) {
      return;
    }

    setSaving(true);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/payment-transfer-methods/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(editingDraft)),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to update payment transfer method."));
        return;
      }

      setStatusText(`Updated ${data.method.label}.`);
      await loadMethods();
    } catch {
      setStatusText("Unexpected error while updating payment transfer method.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMethod(methodId: string) {
    setDeletingId(methodId);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/payment-transfer-methods/${methodId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to delete payment transfer method."));
        return;
      }

      if (editingId === methodId) {
        setEditingId(null);
        setEditingDraft(null);
      }

      setStatusText("Payment transfer method deleted.");
      await loadMethods();
    } catch {
      setStatusText("Unexpected error while deleting payment transfer method.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Payment Transfer Methods</h1>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            Orders
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            Shipping Rules
          </Link>
          <Link href="/admin/catalog" className="btn-secondary">
            Catalog
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-charcoal">Active methods in checkout: {activeCount}</p>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">Current Methods</h2>
        {loading ? <p className="mt-3 text-sm text-charcoal">Loading...</p> : null}
        {!loading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-parchment text-left text-charcoal">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Account/Phone</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-t border-sepia-border/60">
                    <td className="px-3 py-2 font-mono text-xs">{method.methodCode}</td>
                    <td className="px-3 py-2">{method.label}</td>
                    <td className="px-3 py-2">{method.channelType}</td>
                    <td className="px-3 py-2">
                      {method.channelType === "BANK"
                        ? method.accountNumber || "-"
                        : method.phoneNumber || "-"}
                    </td>
                    <td className="px-3 py-2">{method.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingId(method.id);
                            setEditingDraft(toDraft(method));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={deletingId === method.id}
                          onClick={() => void deleteMethod(method.id)}
                        >
                          {deletingId === method.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-charcoal">
                      No payment transfer methods yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="vintage-panel mt-6 p-5">
        <h2 className="text-xl font-semibold text-ink">Create Method</h2>
        <MethodForm
          draft={createDraft}
          onChange={setCreateDraft}
          onSubmit={createMethod}
          submitLabel={creating ? "Creating..." : "Create Method"}
          disabled={creating}
        />
      </section>

      {editingDraft && editingId ? (
        <section className="vintage-panel mt-6 p-5">
          <h2 className="text-xl font-semibold text-ink">Edit Method</h2>
          <p className="mt-1 text-xs text-charcoal">Method ID: {editingId}</p>
          <MethodForm
            draft={editingDraft}
            onChange={(updater) =>
              setEditingDraft((prev) => {
                const current = prev ?? createInitialDraft();
                return typeof updater === "function"
                  ? (updater as (value: MethodDraft) => MethodDraft)(current)
                  : updater;
              })
            }
            onSubmit={updateMethod}
            submitLabel={saving ? "Saving..." : "Save Method"}
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
            Close Editor
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
  draft: MethodDraft;
  onChange: Dispatch<SetStateAction<MethodDraft>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitLabel: string;
  disabled: boolean;
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={draft.methodCode}
          onChange={(event) => onChange((prev) => ({ ...prev, methodCode: event.target.value }))}
          placeholder="Method code (e.g. KBZ_PAY)"
          className="field-input"
          required
        />
        <input
          value={draft.label}
          onChange={(event) => onChange((prev) => ({ ...prev, label: event.target.value }))}
          placeholder="Display name"
          className="field-input"
          required
        />
        <select
          value={draft.channelType}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              channelType: event.target.value as ChannelType,
            }))
          }
          className="field-select"
        >
          <option value="BANK">Bank</option>
          <option value="WALLET">Wallet</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={draft.accountName}
          onChange={(event) => onChange((prev) => ({ ...prev, accountName: event.target.value }))}
          placeholder="Account holder name"
          className="field-input"
          required
        />
        <input
          value={draft.accountNumber}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, accountNumber: event.target.value }))
          }
          placeholder="Account number (bank)"
          className="field-input"
        />
        <input
          value={draft.phoneNumber}
          onChange={(event) => onChange((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          placeholder="Phone number (wallet)"
          className="field-input"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={draft.instructions}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, instructions: event.target.value }))
          }
          placeholder="Instructions (optional)"
          className="field-input"
        />
        <input
          type="number"
          min={0}
          step={1}
          value={draft.sortOrder}
          onChange={(event) => onChange((prev) => ({ ...prev, sortOrder: event.target.value }))}
          placeholder="Sort order"
          className="field-input"
          required
        />
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
