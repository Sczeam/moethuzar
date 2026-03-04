import type { PromoRow, PromoUpsertPayload } from "@/features/admin/promotions/domain/types";

export interface PromoAdminApi {
  listPromos(): Promise<PromoRow[]>;
  createPromo(payload: PromoUpsertPayload): Promise<PromoRow>;
  updatePromo(promoId: string, payload: PromoUpsertPayload): Promise<PromoRow>;
  togglePromo(promoId: string): Promise<PromoRow>;
}
