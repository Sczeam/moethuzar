import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import { YANGON_TOWNSHIPS } from "@/lib/constants/mm-locations";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import type { Prisma } from "@prisma/client";

type ResolveShippingInput = {
  country: string;
  stateRegion: string;
  townshipCity: string;
  subtotalAmount: number;
};

type ShippingQuote = {
  zoneKey: string;
  zoneLabel: string;
  etaLabel: string;
  feeAmount: number;
  ruleId: string;
};

type ShippingRuleUpsertInput = {
  zoneKey: string;
  name: string;
  country: string;
  stateRegion?: string | null;
  townshipCity?: string | null;
  feeAmount: number;
  freeShippingThreshold?: number | null;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: number;
};

function normalizeOptionalText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeKey(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function zoneLabelFromRule(rule: { zoneKey: string; name: string }): string {
  return rule.name.trim().length > 0 ? rule.name : rule.zoneKey;
}

function resolveZoneKey(input: Pick<ResolveShippingInput, "townshipCity">): string {
  const township = input.townshipCity.trim();
  if (YANGON_TOWNSHIPS.includes(township as (typeof YANGON_TOWNSHIPS)[number])) {
    return SHIPPING_ZONE_KEYS.YANGON;
  }

  if (township === "Mandalay") {
    return SHIPPING_ZONE_KEYS.MANDALAY;
  }

  if (township === "Pyinmana") {
    return SHIPPING_ZONE_KEYS.PYINMANA;
  }

  if (township === "Nay Pyi Daw") {
    return SHIPPING_ZONE_KEYS.NAY_PYI_DAW;
  }

  return FALLBACK_SHIPPING_ZONE_KEY;
}

export async function listShippingRules() {
  return prisma.shippingRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getShippingRuleById(ruleId: string) {
  const rule = await prisma.shippingRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new AppError("Shipping rule not found.", 404, "SHIPPING_RULE_NOT_FOUND");
  }

  return rule;
}

async function countActiveFallbackRules(tx: Prisma.TransactionClient) {
  return tx.shippingRule.count({ where: { isFallback: true, isActive: true } });
}

function ensureIntegerFee(value: number) {
  if (!Number.isInteger(value)) {
    throw new AppError("Shipping fee must be an integer MMK amount.", 400, "INVALID_SHIPPING_FEE");
  }
}

export async function createShippingRule(input: ShippingRuleUpsertInput) {
  ensureIntegerFee(input.feeAmount);
  if (
    typeof input.freeShippingThreshold === "number" &&
    !Number.isInteger(input.freeShippingThreshold)
  ) {
    throw new AppError(
      "Free shipping threshold must be an integer MMK amount.",
      400,
      "INVALID_FREE_SHIPPING_THRESHOLD",
    );
  }

  return prisma.shippingRule.create({
    data: {
      zoneKey: normalizeKey(input.zoneKey),
      name: input.name.trim(),
      country: input.country.trim(),
      stateRegion: normalizeOptionalText(input.stateRegion),
      townshipCity: normalizeOptionalText(input.townshipCity),
      feeAmount: input.feeAmount,
      freeShippingThreshold: input.freeShippingThreshold ?? null,
      etaLabel: input.etaLabel.trim(),
      isFallback: input.isFallback,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateShippingRule(ruleId: string, input: ShippingRuleUpsertInput) {
  ensureIntegerFee(input.feeAmount);
  if (
    typeof input.freeShippingThreshold === "number" &&
    !Number.isInteger(input.freeShippingThreshold)
  ) {
    throw new AppError(
      "Free shipping threshold must be an integer MMK amount.",
      400,
      "INVALID_FREE_SHIPPING_THRESHOLD",
    );
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.shippingRule.findUnique({ where: { id: ruleId } });
    if (!existing) {
      throw new AppError("Shipping rule not found.", 404, "SHIPPING_RULE_NOT_FOUND");
    }

    const nextIsFallback = input.isFallback;
    const nextIsActive = input.isActive;

    if (existing.isFallback && existing.isActive && (!nextIsFallback || !nextIsActive)) {
      const activeFallbackCount = await countActiveFallbackRules(tx);
      if (activeFallbackCount <= 1) {
        throw new AppError(
          "Cannot disable or remove the last active fallback shipping rule.",
          409,
          "FALLBACK_RULE_REQUIRED",
        );
      }
    }

    return tx.shippingRule.update({
      where: { id: ruleId },
      data: {
        zoneKey: normalizeKey(input.zoneKey),
        name: input.name.trim(),
        country: input.country.trim(),
        stateRegion: normalizeOptionalText(input.stateRegion),
        townshipCity: normalizeOptionalText(input.townshipCity),
        feeAmount: input.feeAmount,
        freeShippingThreshold: input.freeShippingThreshold ?? null,
        etaLabel: input.etaLabel.trim(),
        isFallback: nextIsFallback,
        isActive: nextIsActive,
        sortOrder: input.sortOrder,
      },
    });
  });
}

export async function deleteShippingRule(ruleId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.shippingRule.findUnique({ where: { id: ruleId } });
    if (!existing) {
      throw new AppError("Shipping rule not found.", 404, "SHIPPING_RULE_NOT_FOUND");
    }

    if (existing.isFallback && existing.isActive) {
      const activeFallbackCount = await countActiveFallbackRules(tx);
      if (activeFallbackCount <= 1) {
        throw new AppError(
          "Cannot delete the last active fallback shipping rule.",
          409,
          "FALLBACK_RULE_REQUIRED",
        );
      }
    }

    await tx.shippingRule.delete({ where: { id: ruleId } });
  });
}

export async function resolveShippingQuote(input: ResolveShippingInput): Promise<ShippingQuote> {
  const country = input.country.trim();
  const stateRegion = input.stateRegion.trim();
  const townshipCity = input.townshipCity.trim();

  const prioritizedZoneKey = resolveZoneKey({ townshipCity });

  // 1) explicit township rule (custom granular override)
  const townshipRule = await prisma.shippingRule.findFirst({
    where: {
      country,
      townshipCity,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const zoneRule =
    townshipRule ??
    (await prisma.shippingRule.findFirst({
      where: {
        country,
        zoneKey: prioritizedZoneKey,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }));

  const stateRule =
    zoneRule ??
    (await prisma.shippingRule.findFirst({
      where: {
        country,
        stateRegion,
        townshipCity: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }));

  const fallbackRule =
    stateRule ??
    (await prisma.shippingRule.findFirst({
      where: {
        country,
        isFallback: true,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }));

  if (!fallbackRule) {
    throw new AppError(
      "Shipping is temporarily unavailable for this location. Please contact support.",
      409,
      "SHIPPING_RULE_UNAVAILABLE",
    );
  }

  const isFreeByThreshold =
    typeof fallbackRule.freeShippingThreshold === "number" &&
    input.subtotalAmount >= fallbackRule.freeShippingThreshold;

  const feeAmount = isFreeByThreshold ? 0 : fallbackRule.feeAmount;

  return {
    ruleId: fallbackRule.id,
    zoneKey: fallbackRule.zoneKey,
    zoneLabel: zoneLabelFromRule(fallbackRule),
    etaLabel: fallbackRule.etaLabel,
    feeAmount,
  };
}
