"use client";

import Link from "next/link";
import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import { MM_STATES_AND_DIVISIONS, CHECKOUT_TOWNSHIP_CITY_OPTIONS } from "@/lib/constants/mm-locations";
import {
  createShippingRuleFormDraft,
  shippingRuleToFormDraft,
  SHIPPING_ZONE_PRESET_OPTIONS,
  toShippingRulePayload,
  withFallbackState,
  withZonePreset,
  type ShippingRuleFormDraft,
  type ShippingRuleRecord,
} from "@/lib/admin/shipping-rule-form-adapter";
import { ADMIN_SETTINGS_NAV_LINKS, SHIPPING_RULES_COPY } from "@/lib/admin/settings-copy";
import { getShippingDeleteWarning, getShippingHealth } from "@/lib/admin/settings-guardrails";
import { presentAdminApiError } from "@/lib/admin/error-presenter";
import { type Dispatch, type FormEvent, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

type ShippingRule = ShippingRuleRecord;

function nextSortOrderFromRules(rules: ShippingRule[]) {
  const maxSort = rules.reduce((acc, rule) => Math.max(acc, rule.sortOrder), 0);
  return maxSort + 1;
}

export default function ShippingRulesClient() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<ShippingRuleFormDraft>(createShippingRuleFormDraft(1));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ShippingRuleFormDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const shippingHealth = useMemo(() => getShippingHealth(rules), [rules]);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setStatusText("");
    try {
      const response = await fetch("/api/admin/shipping-rules");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, { fallback: SHIPPING_RULES_COPY.loadFailed, includeRequestId: true }),
        );
        return;
      }

      const nextRules = data.rules as ShippingRule[];
      setRules(nextRules);
      setCreateDraft(createShippingRuleFormDraft(nextSortOrderFromRules(nextRules)));
    } catch {
      setStatusText(SHIPPING_RULES_COPY.loadUnexpected);
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
    const mapped = toShippingRulePayload(createDraft, nextSortOrderFromRules(rules));
    if (!mapped.ok) {
      setStatusText(mapped.error);
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/shipping-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped.payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, { fallback: SHIPPING_RULES_COPY.createFailed, includeRequestId: true }),
        );
        return;
      }
      setStatusText(SHIPPING_RULES_COPY.createSuccess(data.rule.name));
      await loadRules();
    } catch {
      setStatusText(SHIPPING_RULES_COPY.createUnexpected);
    } finally {
      setCreating(false);
    }
  }

  async function updateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editingDraft) return;

    setSaving(true);
    setStatusText("");
    const mapped = toShippingRulePayload(editingDraft, nextSortOrderFromRules(rules));
    if (!mapped.ok) {
      setStatusText(mapped.error);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping-rules/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped.payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, { fallback: SHIPPING_RULES_COPY.updateFailed, includeRequestId: true }),
        );
        return;
      }
      setStatusText(SHIPPING_RULES_COPY.updateSuccess(data.rule.name));
      await loadRules();
    } catch {
      setStatusText(SHIPPING_RULES_COPY.updateUnexpected);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(rule: ShippingRule) {
    const confirmed = window.confirm(getShippingDeleteWarning(rule));
    if (!confirmed) return;

    setDeletingId(rule.id);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/shipping-rules/${rule.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(
          presentAdminApiError(data, { fallback: SHIPPING_RULES_COPY.deleteFailed, includeRequestId: true }),
        );
        return;
      }

      if (editingId === rule.id) {
        setEditingId(null);
        setEditingDraft(null);
      }

      setStatusText(SHIPPING_RULES_COPY.deleteSuccess);
      await loadRules();
    } catch {
      setStatusText(SHIPPING_RULES_COPY.deleteUnexpected);
    } finally {
      setDeletingId(null);
    }
  }

  const activeFallbackRuleId = useMemo(
    () => rules.find((rule) => rule.isFallback && rule.isActive)?.id ?? null,
    [rules],
  );

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">{SHIPPING_RULES_COPY.pageTitle}</h1>
        <div className="flex gap-2">
          {ADMIN_SETTINGS_NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="btn-secondary">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {!shippingHealth.hasActiveFallback ? (
        <div className="mb-4 border border-seal-wax/40 bg-seal-wax/10 p-3 text-sm text-seal-wax">
          {SHIPPING_RULES_COPY.fallbackMissingWarning}
        </div>
      ) : null}

      {shippingHealth.missingRequiredZoneKeys.length ? (
        <div className="mb-4 border border-amber-700/30 bg-amber-100/40 p-3 text-sm text-amber-900">
          Missing active required zones: {shippingHealth.missingRequiredZoneKeys.join(", ")}.
        </div>
      ) : null}

      <section className="vintage-panel mb-6 p-5">
        <h2 className="text-xl font-semibold text-ink">{SHIPPING_RULES_COPY.healthTitle}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">{SHIPPING_RULES_COPY.healthActiveRulesLabel}</p>
            <p className="text-2xl font-semibold text-ink">{shippingHealth.activeRuleCount}</p>
          </div>
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">{SHIPPING_RULES_COPY.healthFallbackLabel}</p>
            <p className="text-2xl font-semibold text-ink">
              {shippingHealth.hasActiveFallback
                ? SHIPPING_RULES_COPY.healthFallbackActive
                : SHIPPING_RULES_COPY.healthFallbackMissing}
            </p>
          </div>
          <div className="rounded border border-sepia-border/60 bg-parchment p-3 text-sm">
            <p className="text-charcoal">Warnings</p>
            <p className="text-2xl font-semibold text-ink">{shippingHealth.warnings.length}</p>
          </div>
        </div>
        {shippingHealth.warnings.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-seal-wax">
            {shippingHealth.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-charcoal">All required shipping coverage checks are healthy.</p>
        )}
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-xl font-semibold text-ink">{SHIPPING_RULES_COPY.currentSectionTitle}</h2>
        {loading ? <p className="mt-3 text-sm text-charcoal">{SHIPPING_RULES_COPY.loadingText}</p> : null}

        {!loading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-parchment text-left text-charcoal">
                <tr>
                  <th className="px-3 py-2">Coverage</th>
                  <th className="px-3 py-2">Rule</th>
                  <th className="px-3 py-2">Fee (MMK)</th>
                  <th className="px-3 py-2">ETA</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-sepia-border/60">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{rule.zoneKey}</div>
                      <div className="text-xs text-charcoal">
                        {rule.townshipCity ?? rule.stateRegion ?? "All areas"}
                      </div>
                    </td>
                    <td className="px-3 py-2">{rule.name}</td>
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
                            setEditingDraft(shippingRuleToFormDraft(rule));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={deletingId === rule.id}
                          onClick={() => void deleteRule(rule)}
                        >
                          {deletingId === rule.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-charcoal">
                      {SHIPPING_RULES_COPY.emptyStateText}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="vintage-panel mt-6 p-5">
        <h2 className="text-xl font-semibold text-ink">{SHIPPING_RULES_COPY.createSectionTitle}</h2>
        <ShippingRuleForm
          draft={createDraft}
          onChange={setCreateDraft}
          onSubmit={createRule}
          submitLabel={
            creating ? SHIPPING_RULES_COPY.form.createSubmitting : SHIPPING_RULES_COPY.form.createSubmit
          }
          disabled={creating}
          activeFallbackRuleId={activeFallbackRuleId}
          editingRuleId={null}
        />
      </section>

      {editingDraft && editingId ? (
        <section className="vintage-panel mt-6 p-5">
          <h2 className="text-xl font-semibold text-ink">{SHIPPING_RULES_COPY.editSectionTitle}</h2>
          <p className="mt-1 text-xs text-charcoal">Rule ID: {editingId}</p>
          <ShippingRuleForm
            draft={editingDraft}
            onChange={(updater) =>
              setEditingDraft((prev) => {
                const current = prev ?? createShippingRuleFormDraft(nextSortOrderFromRules(rules));
                return typeof updater === "function"
                  ? (updater as (value: ShippingRuleFormDraft) => ShippingRuleFormDraft)(current)
                  : updater;
              })
            }
            onSubmit={updateRule}
            submitLabel={
              saving ? SHIPPING_RULES_COPY.form.editSubmitting : SHIPPING_RULES_COPY.form.editSubmit
            }
            disabled={saving}
            activeFallbackRuleId={activeFallbackRuleId}
            editingRuleId={editingId}
          />
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => {
              setEditingId(null);
              setEditingDraft(null);
            }}
          >
            {SHIPPING_RULES_COPY.closeEditorLabel}
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
  activeFallbackRuleId,
  editingRuleId,
}: {
  draft: ShippingRuleFormDraft;
  onChange: Dispatch<SetStateAction<ShippingRuleFormDraft>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitLabel: string;
  disabled: boolean;
  activeFallbackRuleId: string | null;
  editingRuleId: string | null;
}) {
  const lockFallbackToggle =
    draft.zonePreset === FALLBACK_SHIPPING_ZONE_KEY ||
    (!!activeFallbackRuleId && activeFallbackRuleId !== editingRuleId && !draft.isFallback);

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-charcoal">
          <span>Zone / Region</span>
          <select
            value={draft.zonePreset}
            onChange={(event) =>
              onChange((prev) =>
                withZonePreset(prev, event.target.value as ShippingRuleFormDraft["zonePreset"]),
              )
            }
            className="field-select"
          >
            {SHIPPING_ZONE_PRESET_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {draft.zonePreset === "CUSTOM" ? (
          <label className="space-y-1 text-sm text-charcoal">
            <span>Custom zone key</span>
            <input
              value={draft.customZoneKey}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, customZoneKey: event.target.value }))
              }
              placeholder="e.g. UPPER_MYANMAR"
              className="field-input"
              required
            />
          </label>
        ) : null}

        <label className="space-y-1 text-sm text-charcoal">
          <span>Rule label</span>
          <input
            value={draft.name}
            onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Display name"
            className="field-input"
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-charcoal">
          <span>Township / City (optional)</span>
          <select
            value={draft.townshipCity}
            onChange={(event) => onChange((prev) => ({ ...prev, townshipCity: event.target.value }))}
            className="field-select"
            disabled={draft.isFallback}
          >
            <option value="">All townships/cities</option>
            {CHECKOUT_TOWNSHIP_CITY_OPTIONS.map((township) => (
              <option key={township} value={township}>
                {township}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-charcoal">
          <span>State / Region (optional)</span>
          <select
            value={draft.stateRegion}
            onChange={(event) => onChange((prev) => ({ ...prev, stateRegion: event.target.value }))}
            className="field-select"
            disabled={draft.isFallback}
          >
            <option value="">All states</option>
            {MM_STATES_AND_DIVISIONS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-charcoal">
          <span>Shipping fee (MMK)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.feeAmount}
            onChange={(event) => onChange((prev) => ({ ...prev, feeAmount: event.target.value }))}
            className="field-input"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-charcoal">
          <span>Free shipping threshold (optional)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.freeShippingThreshold}
            onChange={(event) =>
              onChange((prev) => ({ ...prev, freeShippingThreshold: event.target.value }))
            }
            className="field-input"
          />
        </label>

        <label className="space-y-1 text-sm text-charcoal">
          <span>Delivery ETA</span>
          <input
            value={draft.etaLabel}
            onChange={(event) => onChange((prev) => ({ ...prev, etaLabel: event.target.value }))}
            placeholder="e.g. 2-4 business days"
            className="field-input"
            required
          />
        </label>
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
            disabled={lockFallbackToggle}
            onChange={(event) => onChange((prev) => withFallbackState(prev, event.target.checked))}
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
