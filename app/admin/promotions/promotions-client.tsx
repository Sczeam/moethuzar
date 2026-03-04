"use client";

import { presentAdminApiError } from "@/lib/admin/error-presenter";
import { adminDisabledControlClass, adminStateBadgeClass } from "@/lib/admin/state-clarity";
import { formatMoney } from "@/lib/format";
import { type PromoDiscountType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type AdminPromoStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED" | "INACTIVE" | "EXHAUSTED";

type PromoRow = {
  id: string;
  code: string;
  label: string | null;
  discountType: PromoDiscountType;
  value: number;
  minOrderAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  status: AdminPromoStatus;
  createdAt: string;
  updatedAt: string;
};

type PromoDraft = {
  code: string;
  label: string;
  discountType: PromoDiscountType;
  value: string;
  minOrderAmount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
};

function createEmptyDraft(): PromoDraft {
  return {
    code: "",
    label: "",
    discountType: "FLAT",
    value: "",
    minOrderAmount: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    isActive: true,
  };
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function payloadFromDraft(draft: PromoDraft) {
  const value = Number(draft.value);
  const minOrderAmount = draft.minOrderAmount.trim() ? Number(draft.minOrderAmount) : null;
  const usageLimit = draft.usageLimit.trim() ? Number(draft.usageLimit) : null;

  return {
    code: draft.code.trim(),
    label: draft.label.trim(),
    discountType: draft.discountType,
    value,
    minOrderAmount,
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
    usageLimit,
    isActive: draft.isActive,
  };
}

function toDraft(row: PromoRow): PromoDraft {
  return {
    code: row.code,
    label: row.label ?? "",
    discountType: row.discountType,
    value: String(row.value),
    minOrderAmount: row.minOrderAmount !== null ? String(row.minOrderAmount) : "",
    startsAt: toDateTimeLocal(row.startsAt),
    endsAt: toDateTimeLocal(row.endsAt),
    usageLimit: row.usageLimit !== null ? String(row.usageLimit) : "",
    isActive: row.isActive,
  };
}

function statusMeta(status: AdminPromoStatus): { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "success" };
    case "SCHEDULED":
      return { label: "Scheduled", tone: "info" };
    case "EXPIRED":
      return { label: "Expired", tone: "neutral" };
    case "INACTIVE":
      return { label: "Inactive", tone: "warning" };
    case "EXHAUSTED":
      return { label: "Exhausted", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export default function PromotionsClient() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<PromoDraft>(createEmptyDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PromoDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [subtotalPreview, setSubtotalPreview] = useState("100000");

  function updateActiveDraft(updater: (draft: PromoDraft) => PromoDraft) {
    if (editId) {
      setEditDraft((prev) => (prev ? updater(prev) : prev));
      return;
    }
    setCreateDraft((prev) => updater(prev));
  }

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setStatusText("");
    try {
      const response = await fetch("/api/admin/promos");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, {
            fallback: "Failed to load promo codes.",
            includeRequestId: true,
          }),
        );
        return;
      }
      setRows(data.promos as PromoRow[]);
    } catch {
      setStatusText("Unexpected error while loading promo codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromos();
  }, [loadPromos]);

  async function createPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatusText("");
    try {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft(createDraft)),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, {
            fallback: "Failed to create promo code.",
            includeRequestId: true,
          }),
        );
        return;
      }
      setCreateDraft(createEmptyDraft());
      setStatusText(`Promo ${data.promo.code} created.`);
      await loadPromos();
    } catch {
      setStatusText("Unexpected error while creating promo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editId || !editDraft) return;
    setSaving(true);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/promos/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft(editDraft)),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, {
            fallback: "Failed to update promo code.",
            includeRequestId: true,
          }),
        );
        return;
      }
      setEditId(null);
      setEditDraft(null);
      setStatusText(`Promo ${data.promo.code} updated.`);
      await loadPromos();
    } catch {
      setStatusText("Unexpected error while updating promo.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePromo(row: PromoRow) {
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/promos/${row.id}/toggle`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, {
            fallback: "Failed to toggle promo status.",
            includeRequestId: true,
          }),
        );
        return;
      }
      setStatusText(`Promo ${row.code} ${row.isActive ? "deactivated" : "activated"}.`);
      await loadPromos();
    } catch {
      setStatusText("Unexpected error while toggling promo status.");
    }
  }

  const preview = useMemo(() => {
    const subtotal = Number(subtotalPreview || "0");
    const source = editDraft ?? createDraft;
    const value = Number(source.value || "0");
    const minOrder = Number(source.minOrderAmount || "0");
    if (!subtotal || !value) {
      return { discount: 0, after: subtotal || 0, reason: "Enter subtotal + value for preview." };
    }
    if (source.minOrderAmount.trim() && subtotal < minOrder) {
      return { discount: 0, after: subtotal, reason: "Subtotal below minimum order amount." };
    }
    const discount =
      source.discountType === "PERCENT"
        ? Math.floor((subtotal * value) / 100)
        : Math.min(value, subtotal);
    return { discount, after: Math.max(0, subtotal - discount), reason: "" };
  }, [subtotalPreview, createDraft, editDraft]);

  const activeDraft = editDraft ?? createDraft;

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Discounts</h1>
      </div>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">{editId ? "Edit Promo" : "Create Promo"}</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={editId ? saveEdit : createPromo}
        >
          <label className="field-label">
            Promo Code
            <input
              className="field-input mt-1"
              value={activeDraft.code}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, code: event.target.value.toUpperCase() }));
              }}
              placeholder="SUMMER10"
            />
          </label>
          <label className="field-label">
            Label (optional)
            <input
              className="field-input mt-1"
              value={activeDraft.label}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, label: event.target.value }));
              }}
              placeholder="Summer campaign"
            />
          </label>
          <label className="field-label">
            Discount Type
            <select
              className="field-input mt-1"
              value={activeDraft.discountType}
              onChange={(event) => {
                updateActiveDraft((prev) => ({
                  ...prev,
                  discountType: event.target.value as PromoDiscountType,
                }));
              }}
            >
              <option value="FLAT">Flat (MMK)</option>
              <option value="PERCENT">Percent (%)</option>
            </select>
          </label>
          <label className="field-label">
            Value
            <input
              className="field-input mt-1"
              value={activeDraft.value}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, value: event.target.value }));
              }}
              placeholder={activeDraft.discountType === "PERCENT" ? "10" : "5000"}
            />
          </label>
          <label className="field-label">
            Min Order Amount (optional)
            <input
              className="field-input mt-1"
              value={activeDraft.minOrderAmount}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, minOrderAmount: event.target.value }));
              }}
              placeholder="100000"
            />
          </label>
          <label className="field-label">
            Usage Limit (optional)
            <input
              className="field-input mt-1"
              value={activeDraft.usageLimit}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, usageLimit: event.target.value }));
              }}
              placeholder="100"
            />
          </label>
          <label className="field-label">
            Starts At (optional)
            <input
              type="datetime-local"
              className="field-input mt-1"
              value={activeDraft.startsAt}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, startsAt: event.target.value }));
              }}
            />
          </label>
          <label className="field-label">
            Ends At (optional)
            <input
              type="datetime-local"
              className="field-input mt-1"
              value={activeDraft.endsAt}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, endsAt: event.target.value }));
              }}
            />
          </label>
          <label className="field-label inline-flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={activeDraft.isActive}
              onChange={(event) => {
                updateActiveDraft((prev) => ({ ...prev, isActive: event.target.checked }));
              }}
            />
            Active
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-2">
            <button className={`btn-primary ${adminDisabledControlClass()}`} disabled={saving}>
              {saving ? "Saving..." : editId ? "Save Changes" : "Create Promo"}
            </button>
            {editId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditId(null);
                  setEditDraft(null);
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">Promo Preview</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="field-label">
            Subtotal (MMK)
            <input
              className="field-input mt-1"
              value={subtotalPreview}
              onChange={(event) => setSubtotalPreview(event.target.value)}
              placeholder="100000"
            />
          </label>
          <div className="rounded border border-sepia-border/70 bg-paper-light p-3 text-sm">
            Discount:{" "}
            <span className="font-semibold text-ink">{formatMoney(String(preview.discount), "MMK")}</span>
          </div>
          <div className="rounded border border-sepia-border/70 bg-paper-light p-3 text-sm">
            After discount:{" "}
            <span className="font-semibold text-ink">{formatMoney(String(preview.after), "MMK")}</span>
            {preview.reason ? <p className="mt-1 text-seal-wax">{preview.reason}</p> : null}
          </div>
        </div>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">Promo Codes</h2>
        {loading ? <p className="mt-3 text-sm text-charcoal">Loading promo codes...</p> : null}
        {!loading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-parchment text-left text-charcoal">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Rule</th>
                  <th className="px-3 py-2">Window</th>
                  <th className="px-3 py-2">Usage</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = statusMeta(row.status);
                  return (
                    <tr key={row.id} className="border-t border-sepia-border/60">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-ink">{row.code}</p>
                        {row.label ? <p className="text-xs text-charcoal">{row.label}</p> : null}
                      </td>
                      <td className="px-3 py-2">
                        {row.discountType === "PERCENT" ? `${row.value}%` : formatMoney(String(row.value), "MMK")}
                        {row.minOrderAmount !== null ? (
                          <p className="text-xs text-charcoal">
                            Min {formatMoney(String(row.minOrderAmount), "MMK")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <p>{row.startsAt ? new Date(row.startsAt).toLocaleString() : "No start"}</p>
                        <p className="text-xs text-charcoal">
                          {row.endsAt ? new Date(row.endsAt).toLocaleString() : "No end"}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        {row.usageCount}
                        {row.usageLimit !== null ? ` / ${row.usageLimit}` : " / unlimited"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={adminStateBadgeClass(status.tone)}>{status.label}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setEditId(row.id);
                              setEditDraft(toDraft(row));
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => void togglePromo(row)}>
                            {row.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-charcoal">
                      No promo codes yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {statusText ? <p className="text-sm text-charcoal">{statusText}</p> : null}
    </main>
  );
}
