import { resolveAdminPromoStatus, type AdminPromoStatus } from "@/lib/admin/promo-status";
import { prisma } from "@/lib/prisma";
import type { PromoCodePayloadInput } from "@/lib/validation/promo-code";
import { AppError } from "@/server/errors";
import { normalizePromoCode } from "@/server/services/promo-engine.service";

type AdminPromoRecord = {
  id: string;
  code: string;
  label: string | null;
  discountType: "FLAT" | "PERCENT";
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminPromoListItem = AdminPromoRecord & {
  status: AdminPromoStatus;
};

type AdminPromoGetOptions = {
  now?: Date;
};

function toAdminPromoListItem(record: AdminPromoRecord, now: Date): AdminPromoListItem {
  return {
    ...record,
    status: resolveAdminPromoStatus(record, now),
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toPromoCreateData(input: PromoCodePayloadInput) {
  return {
    code: normalizePromoCode(input.code),
    label: normalizeOptionalText(input.label),
    discountType: input.discountType,
    value: input.value,
    minOrderAmount: input.minOrderAmount ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    usageLimit: input.usageLimit ?? null,
    isActive: input.isActive ?? true,
  };
}

function toPromoUpdateData(input: PromoCodePayloadInput) {
  return {
    code: normalizePromoCode(input.code),
    label: normalizeOptionalText(input.label),
    discountType: input.discountType,
    value: input.value,
    minOrderAmount: input.minOrderAmount ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    usageLimit: input.usageLimit ?? null,
    isActive: input.isActive,
  };
}

export async function listAdminPromos(options?: AdminPromoGetOptions): Promise<AdminPromoListItem[]> {
  const now = options?.now ?? new Date();
  const records = await prisma.promoCode.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return records.map((record) => toAdminPromoListItem(record, now));
}

export async function getAdminPromoById(
  promoId: string,
  options?: AdminPromoGetOptions,
): Promise<AdminPromoListItem> {
  const now = options?.now ?? new Date();
  const record = await prisma.promoCode.findUnique({
    where: { id: promoId },
  });

  if (!record) {
    throw new AppError("Promo not found.", 404, "PROMO_NOT_FOUND");
  }

  return toAdminPromoListItem(record, now);
}

export async function createAdminPromo(input: PromoCodePayloadInput): Promise<AdminPromoRecord> {
  return prisma.promoCode.create({
    data: toPromoCreateData(input),
  });
}

export async function updateAdminPromo(
  promoId: string,
  input: PromoCodePayloadInput,
): Promise<AdminPromoRecord> {
  const existing = await prisma.promoCode.findUnique({ where: { id: promoId }, select: { id: true } });
  if (!existing) {
    throw new AppError("Promo not found.", 404, "PROMO_NOT_FOUND");
  }

  return prisma.promoCode.update({
    where: { id: promoId },
    data: toPromoUpdateData(input),
  });
}

export async function toggleAdminPromo(promoId: string): Promise<AdminPromoRecord> {
  const existing = await prisma.promoCode.findUnique({
    where: { id: promoId },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    throw new AppError("Promo not found.", 404, "PROMO_NOT_FOUND");
  }

  return prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive: !existing.isActive },
  });
}
