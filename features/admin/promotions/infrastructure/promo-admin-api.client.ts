import { presentAdminApiError } from "@/lib/admin/error-presenter";
import type { PromoAdminApi } from "@/features/admin/promotions/application/ports";
import type { PromoRow } from "@/features/admin/promotions/domain/types";

type ApiEnvelope<T> = {
  ok?: boolean;
  requestId?: string;
} & T;

async function readEnvelope<T>(
  response: Response,
  fallback: string,
): Promise<ApiEnvelope<T>> {
  const data = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !data.ok) {
    throw new Error(
      presentAdminApiError(data, {
        fallback,
        includeRequestId: true,
      }),
    );
  }
  return data;
}

export const promoAdminApiClient: PromoAdminApi = {
  async listPromos() {
    const response = await fetch("/api/admin/promos");
    const data = await readEnvelope<{ promos: PromoRow[] }>(response, "Failed to load promo codes.");
    return data.promos;
  },
  async createPromo(payload) {
    const response = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readEnvelope<{ promo: PromoRow }>(response, "Failed to create promo code.");
    return data.promo;
  },
  async updatePromo(promoId, payload) {
    const response = await fetch(`/api/admin/promos/${promoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readEnvelope<{ promo: PromoRow }>(response, "Failed to update promo code.");
    return data.promo;
  },
  async togglePromo(promoId) {
    const response = await fetch(`/api/admin/promos/${promoId}/toggle`, {
      method: "POST",
    });
    const data = await readEnvelope<{ promo: PromoRow }>(response, "Failed to toggle promo status.");
    return data.promo;
  },
};

export function buildPromoAdminApiClient(overrides: Partial<PromoAdminApi>): PromoAdminApi {
  return {
    ...promoAdminApiClient,
    ...overrides,
  };
}
