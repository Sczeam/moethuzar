import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import type { ShippingRuleRecord } from "@/lib/admin/shipping-rule-form-adapter";
import type { PaymentTransferMethodRecord } from "@/lib/admin/payment-transfer-method-form-adapter";

export type ShippingSettingsHealth = {
  activeRuleCount: number;
  hasActiveFallback: boolean;
  missingRequiredZoneKeys: string[];
  warnings: string[];
};

export type PaymentSettingsHealth = {
  totalCount: number;
  activeCount: number;
  activeBankCount: number;
  activeWalletCount: number;
  warnings: string[];
};

const REQUIRED_ZONE_KEYS = [
  SHIPPING_ZONE_KEYS.YANGON,
  SHIPPING_ZONE_KEYS.MANDALAY,
  SHIPPING_ZONE_KEYS.PYINMANA,
  SHIPPING_ZONE_KEYS.NAY_PYI_DAW,
  FALLBACK_SHIPPING_ZONE_KEY,
] as const;

function normalizeZoneKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

export function getShippingHealth(rules: ShippingRuleRecord[]): ShippingSettingsHealth {
  const activeRules = rules.filter((rule) => rule.isActive);
  const activeRuleCount = activeRules.length;
  const hasActiveFallback = activeRules.some((rule) => rule.isFallback);

  const missingRequiredZoneKeys = REQUIRED_ZONE_KEYS.filter(
    (requiredKey) =>
      !activeRules.some((rule) => normalizeZoneKey(rule.zoneKey) === requiredKey),
  );

  const warnings: string[] = [];
  if (!hasActiveFallback) {
    warnings.push("Fallback rule is not active. Non-matching locations will fail checkout.");
  }
  if (missingRequiredZoneKeys.length > 0) {
    warnings.push(`Missing required active zones: ${missingRequiredZoneKeys.join(", ")}.`);
  }
  if (activeRuleCount === 0) {
    warnings.push("No active shipping rules. Shipping quote will be unavailable.");
  }

  return {
    activeRuleCount,
    hasActiveFallback,
    missingRequiredZoneKeys,
    warnings,
  };
}

export function getPaymentHealth(methods: PaymentTransferMethodRecord[]): PaymentSettingsHealth {
  const activeMethods = methods.filter((method) => method.isActive);
  const activeCount = activeMethods.length;
  const activeBankCount = activeMethods.filter((method) => method.channelType === "BANK").length;
  const activeWalletCount = activeMethods.filter((method) => method.channelType === "WALLET").length;

  const warnings: string[] = [];
  if (activeCount === 0) {
    warnings.push("No active transfer methods. Prepaid checkout will be blocked.");
  } else if (activeCount === 1) {
    warnings.push("Only one active transfer method. Consider enabling a backup method.");
  }
  if (activeBankCount === 0) {
    warnings.push("No active bank transfer method.");
  }
  if (activeWalletCount === 0) {
    warnings.push("No active wallet transfer method.");
  }

  return {
    totalCount: methods.length,
    activeCount,
    activeBankCount,
    activeWalletCount,
    warnings,
  };
}

export function getShippingDeleteWarning(rule: Pick<ShippingRuleRecord, "name" | "isFallback" | "isActive">) {
  if (rule.isFallback && rule.isActive) {
    return `Deleting "${rule.name}" removes active fallback coverage.`;
  }
  if (rule.isActive) {
    return `Deleting "${rule.name}" reduces active shipping coverage.`;
  }
  return `Delete shipping rule "${rule.name}"?`;
}

export function getPaymentDeleteWarning(
  method: Pick<PaymentTransferMethodRecord, "label" | "isActive">,
  activeMethodCount: number,
) {
  if (method.isActive && activeMethodCount <= 1) {
    return "Cannot delete the last active method.";
  }
  if (method.isActive) {
    return `Deleting active method "${method.label}" reduces prepaid options.`;
  }
  return `Delete payment method "${method.label}"?`;
}
