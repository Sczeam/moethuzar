"use client";

import Link from "next/link";
import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import { MM_STATES_AND_DIVISIONS, CHECKOUT_TOWNSHIP_CITY_OPTIONS } from "@/lib/constants/mm-locations";
import { type Dispatch, type FormEvent, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

type ShippingRule = {
  id: string;
  zoneKey: string;
  name: string;
  country: string;
  stateRegion: string | null;
  townshipCity: string | null;
  feeAmount: number;
  freeShippingThreshold: number | null;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: number;
};

type RuleDraft = {
  zoneKey: string;
  name: string;
  country: "Myanmar";
  stateRegion: string;
  townshipCity: string;
  feeAmount: string;
  freeShippingThreshold: string;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: string;
};

function createInitialDraft(): RuleDraft {
  return {
    zoneKey: "",
    name: "",
    country: "Myanmar",
    stateRegion: "",
    townshipCity: "",
    feeAmount: "",
    freeShippingThreshold: "",
    etaLabel: "",
    isFallback: false,
    isActive: true,
    sortOrder: "0",
  };
}

function toDraft(rule: ShippingRule): RuleDraft {
  return {
    zoneKey: rule.zoneKey,
    name: rule.name,
    country: "Myanmar",
    stateRegion: rule.stateRegion ?? "",
    townshipCity: rule.townshipCity ?? "",
    feeAmount: String(rule.feeAmount),
    freeShippingThreshold:
      typeof rule.freeShippingThreshold === "number"
        ? String(rule.freeShippingThreshold)
        : "",
    etaLabel: rule.etaLabel,
    isFallback: rule.isFallback,
    isActive: rule.isActive,
    sortOrder: String(rule.sortOrder),
  };
}

function draftToPayload(draft: RuleDraft) {
  const feeAmount = Number.parseInt(draft.feeAmount, 10);
  const sortOrder = Number.parseInt(draft.sortOrder, 10);
  const thresholdTrimmed = draft.freeShippingThreshold.trim();
  const freeShippingThreshold = thresholdTrimmed.length
    ? Number.parseInt(thresholdTrimmed, 10)
    : null;

  return {
    zoneKey: draft.zoneKey,
    name: draft.name,
    country: draft.country,
    stateRegion: draft.stateRegion,
    townshipCity: draft.townshipCity,
    feeAmount,
    freeShippingThreshold,
    etaLabel: draft.etaLabel,
    isFallback: draft.isFallback,
    isActive: draft.isActive,
    sortOrder,
  };
}

function inferFallbackFromZoneKey(zoneKey: string) {
  return zoneKey.trim().toUpperCase().replace(/\s+/g, "_") === FALLBACK_SHIPPING_ZONE_KEY;
}

function apiErrorText(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as {
    error?: unknown;
    code?: unknown;
    requestId?: unknown;
  };

  const errorText = typeof payload.error === "string" ? payload.error : fallback;
  const codeText = typeof payload.code === "string" ? payload.code : null;
  const requestIdText = typeof payload.requestId === "string" ? payload.requestId : null;

  if (codeText && requestIdText) {
    return `${errorText} (${codeText}, requestId: ${requestIdText})`;
  }

  if (codeText) {
    return `${errorText} (${codeText})`;
  }

  if (requestIdText) {
    return `${errorText} (requestId: ${requestIdText})`;
  }

  return errorText;
}

export default function ShippingRulesClient() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<RuleDraft>(createInitialDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<RuleDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasActiveFallback = useMemo(
    () => rules.some((rule) => rule.isFallback && rule.isActive),
    [rules],
  );

  const loadRules = useCallback(async () => {
    setLoading(true);
    setStatusText("");

    try {
      const response = await fetch("/api/admin/shipping-rules");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to load shipping rules."));
        return;
      }

      setRules(data.rules as ShippingRule[]);
    } catch {
      setStatusText("Unexpected error while loading shipping rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  async function createRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setStatusText("");

    try {
      const response = await fetch("/api/admin/shipping-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(createDraft)),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to create shipping rule."));
        return;
      }

      setStatusText(`Created rule ${data.rule.name}.`);
      setCreateDraft(createInitialDraft());
      await loadRules();
    } catch {
      setStatusText("Unexpected error while creating shipping rule.");
    } finally {
      setCreating(false);
    }
  }

  async function updateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editingDraft) {
      return;
    }

    setSaving(true);
    setStatusText("");

    try {
      const response = await fetch(`/api/admin/shipping-rules/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(editingDraft)),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to update shipping rule."));
        return;
      }

      setStatusText(`Updated rule ${data.rule.name}.`);
      await loadRules();
    } catch {
      setStatusText("Unexpected error while updating shipping rule.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(ruleId: string) {
    setDeletingId(ruleId);
    setStatusText("");

    try {
      const response = await fetch(`/api/admin/shipping-rules/${ruleId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(apiErrorText(data, "Failed to delete shipping rule."));
        return;
      }

      if (editingId === ruleId) {
        setEditingId(null);
        setEditingDraft(null);
      }

      setStatusText("Shipping rule deleted.");
      await loadRules();
    } catch {
      setStatusText("Unexpected error while deleting shipping rule.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Shipping Rules</h1>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            Orders
          </Link>
          <Link href="/admin/catalog" className="btn-secondary">
            Catalog
          </Link>
        </div>
      </div>

      {!hasActiveFallback ? (
        <div className="mb-4 border border-seal-wax/40 bg-seal-wax/10 p-3 text-sm text-seal-wax">
          No active fallback rule found. Checkout will be blocked until fallback is active.
        </div>
      ) : null}

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">Current Rules</h2>
        {loading ? <p className="mt-3 text-sm text-charcoal">Loading...</p> : null}

        {!loading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-parchment text-left text-charcoal">
                <tr>
                  <th className="px-3 py-2">Zone Key</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Township/City</th>
                  <th className="px-3 py-2">Fee (MMK)</th>
                  <th className="px-3 py-2">ETA</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-sepia-border/60">
                    <td className="px-3 py-2 font-mono text-xs">{rule.zoneKey}</td>
                    <td className="px-3 py-2">{rule.name}</td>
                    <td className="px-3 py-2">{rule.townshipCity ?? "-"}</td>
                    <td className="px-3 py-2">{rule.feeAmount.toLocaleString()}</td>
                    <td className="px-3 py-2">{rule.etaLabel}</td>
                    <td className="px-3 py-2">
                      {rule.isActive ? "Active" : "Inactive"}
                      {rule.isFallback ? " / Fallback" : ""}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingId(rule.id);
                            setEditingDraft(toDraft(rule));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={deletingId === rule.id}
                          onClick={() => void deleteRule(rule.id)}
                        >
                          {deletingId === rule.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-charcoal">
                      No shipping rules yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="vintage-panel mt-6 p-5">
        <h2 className="text-xl font-semibold text-ink">Create Rule</h2>
        <ShippingRuleForm
          draft={createDraft}
          onChange={setCreateDraft}
          onSubmit={createRule}
          submitLabel={creating ? "Creating..." : "Create Rule"}
          disabled={creating}
        />
      </section>

      {editingDraft && editingId ? (
        <section className="vintage-panel mt-6 p-5">
          <h2 className="text-xl font-semibold text-ink">Edit Rule</h2>
          <p className="mt-1 text-xs text-charcoal">Rule ID: {editingId}</p>
          <ShippingRuleForm
            draft={editingDraft}
            onChange={(updater) =>
              setEditingDraft((prev) => {
                const current = prev ?? createInitialDraft();
                return typeof updater === "function"
                  ? (updater as (value: RuleDraft) => RuleDraft)(current)
                  : updater;
              })
            }
            onSubmit={updateRule}
            submitLabel={saving ? "Saving..." : "Save Rule"}
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

function ShippingRuleForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  disabled,
}: {
  draft: RuleDraft;
  onChange: Dispatch<SetStateAction<RuleDraft>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitLabel: string;
  disabled: boolean;
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={draft.zoneKey}
          onChange={(event) =>
            onChange((prev) => {
              const zoneKey = event.target.value;
              return {
                ...prev,
                zoneKey,
                isFallback: inferFallbackFromZoneKey(zoneKey),
              };
            })
          }
          placeholder="Zone key (e.g. YANGON)"
          className="field-input"
          required
        />
        <input
          value={draft.name}
          onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Display name"
          className="field-input"
          required
        />
        <input
          value={draft.etaLabel}
          onChange={(event) => onChange((prev) => ({ ...prev, etaLabel: event.target.value }))}
          placeholder="ETA label"
          className="field-input"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          value={draft.stateRegion}
          onChange={(event) => onChange((prev) => ({ ...prev, stateRegion: event.target.value }))}
          className="field-select"
        >
          <option value="">All states</option>
          {MM_STATES_AND_DIVISIONS.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select
          value={draft.townshipCity}
          onChange={(event) => onChange((prev) => ({ ...prev, townshipCity: event.target.value }))}
          className="field-select"
        >
          <option value="">All townships/cities</option>
          {CHECKOUT_TOWNSHIP_CITY_OPTIONS.map((township) => (
            <option key={township} value={township}>
              {township}
            </option>
          ))}
        </select>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="number"
          min={0}
          step={1}
          value={draft.feeAmount}
          onChange={(event) => onChange((prev) => ({ ...prev, feeAmount: event.target.value }))}
          placeholder="Shipping fee (MMK)"
          className="field-input"
          required
        />
        <input
          type="number"
          min={0}
          step={1}
          value={draft.freeShippingThreshold}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, freeShippingThreshold: event.target.value }))
          }
          placeholder="Free-shipping threshold (optional)"
          className="field-input"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-charcoal">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => onChange((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isFallback}
            onChange={(event) => onChange((prev) => ({ ...prev, isFallback: event.target.checked }))}
            disabled={inferFallbackFromZoneKey(draft.zoneKey)}
          />
          Fallback rule
        </label>
      </div>

      <button type="submit" disabled={disabled} className="btn-primary disabled:opacity-60">
        {submitLabel}
      </button>
      <p className="text-xs text-charcoal">
        Required zone keys: {SHIPPING_ZONE_KEYS.YANGON}, {SHIPPING_ZONE_KEYS.MANDALAY},{" "}
        {SHIPPING_ZONE_KEYS.PYINMANA}, {SHIPPING_ZONE_KEYS.NAY_PYI_DAW}, {FALLBACK_SHIPPING_ZONE_KEY}.
      </p>
    </form>
  );
}
