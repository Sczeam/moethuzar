export type ProductVariantDraftLike = {
  sku: string;
  name: string;
  color?: string | null;
  size?: string | null;
  isActive: boolean;
  inventory?: number;
};

export type VariantDiagnostics = {
  issuesByIndex: Record<number, string[]>;
  hasBlocking: boolean;
};

export function toSkuToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildVariantDiagnostics(
  variants: ProductVariantDraftLike[]
): VariantDiagnostics {
  const issuesByIndex: Record<number, string[]> = {};
  const skuToIndexes = new Map<string, number[]>();
  const comboToIndexes = new Map<string, number[]>();

  variants.forEach((variant, index) => {
    const issues: string[] = [];
    const sku = variant.sku.trim().toUpperCase();
    const name = variant.name.trim();
    const color = (variant.color ?? "").trim().toLowerCase();
    const size = (variant.size ?? "").trim().toLowerCase();

    if (!sku) {
      issues.push("SKU is required.");
    } else {
      skuToIndexes.set(sku, [...(skuToIndexes.get(sku) ?? []), index]);
    }

    if (!name) {
      issues.push("Variant name is required.");
    }

    const comboKey = `${color}__${size}`;
    comboToIndexes.set(comboKey, [...(comboToIndexes.get(comboKey) ?? []), index]);

    if (variant.isActive === false && (variant.inventory ?? 0) > 0) {
      issues.push("Inactive variant still has stock.");
    }

    if (issues.length > 0) {
      issuesByIndex[index] = issues;
    }
  });

  for (const indexes of skuToIndexes.values()) {
    if (indexes.length <= 1) {
      continue;
    }
    indexes.forEach((index) => {
      issuesByIndex[index] = [...(issuesByIndex[index] ?? []), "Duplicate SKU in this draft."];
    });
  }

  for (const [key, indexes] of comboToIndexes.entries()) {
    if (indexes.length <= 1 || key === "__") {
      continue;
    }
    indexes.forEach((index) => {
      issuesByIndex[index] = [
        ...(issuesByIndex[index] ?? []),
        "Duplicate color + size combination in this draft.",
      ];
    });
  }

  return {
    issuesByIndex,
    hasBlocking: Object.values(issuesByIndex).some((issues) =>
      issues.some((issue) =>
        [
          "SKU is required.",
          "Variant name is required.",
          "Duplicate SKU in this draft.",
          "Duplicate color + size combination in this draft.",
        ].includes(issue)
      )
    ),
  };
}
