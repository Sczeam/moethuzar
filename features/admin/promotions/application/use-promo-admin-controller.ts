"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createEmptyPromoDraft,
  toPromoDraft,
  toPromoUpsertPayload,
} from "@/features/admin/promotions/domain/draft";
import { evaluatePromoPreview } from "@/features/admin/promotions/domain/preview";
import type { PromoDraft, PromoRow } from "@/features/admin/promotions/domain/types";
import type { PromoAdminApi } from "@/features/admin/promotions/application/ports";
import { promoAdminApiClient } from "@/features/admin/promotions/infrastructure/promo-admin-api.client";

type UsePromoAdminControllerOptions = {
  api?: PromoAdminApi;
};

export function usePromoAdminController(options: UsePromoAdminControllerOptions = {}) {
  const api = options.api ?? promoAdminApiClient;

  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [createDraft, setCreateDraft] = useState<PromoDraft>(createEmptyPromoDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PromoDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [subtotalPreview, setSubtotalPreview] = useState("100000");

  const activeDraft = editDraft ?? createDraft;

  const updateActiveDraft = useCallback((updater: (draft: PromoDraft) => PromoDraft) => {
    setStatusText("");
    if (editId) {
      setEditDraft((prev) => (prev ? updater(prev) : prev));
      return;
    }
    setCreateDraft((prev) => updater(prev));
  }, [editId]);

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setStatusText("");
    try {
      const promos = await api.listPromos();
      setRows(promos);
    } catch {
      setStatusText("Unexpected error while loading promo codes.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadPromos();
  }, [loadPromos]);

  const createPromo = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatusText("");
    try {
      const promo = await api.createPromo(toPromoUpsertPayload(createDraft));
      setCreateDraft(createEmptyPromoDraft());
      setStatusText(`Promo ${promo.code} created.`);
      await loadPromos();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unexpected error while creating promo.");
    } finally {
      setSaving(false);
    }
  }, [api, createDraft, loadPromos]);

  const saveEdit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editId || !editDraft) return;

    setSaving(true);
    setStatusText("");
    try {
      const promo = await api.updatePromo(editId, toPromoUpsertPayload(editDraft));
      setEditId(null);
      setEditDraft(null);
      setStatusText(`Promo ${promo.code} updated.`);
      await loadPromos();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unexpected error while updating promo.");
    } finally {
      setSaving(false);
    }
  }, [api, editDraft, editId, loadPromos]);

  const togglePromo = useCallback(async (row: PromoRow) => {
    setStatusText("");
    try {
      await api.togglePromo(row.id);
      setStatusText(`Promo ${row.code} ${row.isActive ? "deactivated" : "activated"}.`);
      await loadPromos();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unexpected error while toggling promo status.");
    }
  }, [api, loadPromos]);

  const beginEdit = useCallback((row: PromoRow) => {
    setEditId(row.id);
    setEditDraft(toPromoDraft(row));
    setStatusText("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditId(null);
    setEditDraft(null);
    setStatusText("");
  }, []);

  const preview = useMemo(
    () => evaluatePromoPreview(subtotalPreview, activeDraft),
    [subtotalPreview, activeDraft],
  );

  return {
    rows,
    loading,
    statusText,
    saving,
    subtotalPreview,
    setSubtotalPreview,
    createDraft,
    editId,
    activeDraft,
    preview,
    loadPromos,
    updateActiveDraft,
    createPromo,
    saveEdit,
    togglePromo,
    beginEdit,
    cancelEdit,
  };
}
