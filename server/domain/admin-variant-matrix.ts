export type AdminVariantMatrixInput = {
  namePrefix: string;
  skuPrefix: string;
  colors: string[];
  sizes: string[];
  material?: string | null;
  basePrice?: string | null;
  compareAtPrice?: string | null;
  initialInventory: number;
  isActive: boolean;
  existing?: Array<{
    color: string;
    size: string;
  }>;
};

export type AdminVariantMatrixRow = {
  key: string;
  sku: string;
  name: string;
  color: string;
  size: string;
  material: string | null;
  price: string | null;
  compareAtPrice: string | null;
  initialInventory: number;
  isActive: boolean;
  exists: boolean;
};

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeList(values: string[]) {
  const deduped = new Map<string, string>();
  for (const raw of values) {
    const normalized = normalizeLabel(raw);
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  }
  return [...deduped.values()];
}

function toSkuToken(value: string) {
  const token = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return token || "X";
}

function buildExistingKeySet(existing: AdminVariantMatrixInput["existing"]) {
  const result = new Set<string>();
  for (const row of existing ?? []) {
    const color = normalizeLabel(row.color).toLowerCase();
    const size = normalizeLabel(row.size).toLowerCase();
    if (!color || !size) {
      continue;
    }
    result.add(`${color}__${size}`);
  }
  return result;
}

export function generateVariantMatrix(input: AdminVariantMatrixInput): AdminVariantMatrixRow[] {
  const colors = normalizeList(input.colors);
  const sizes = normalizeList(input.sizes);
  const material = normalizeLabel(input.material ?? "") || null;
  const price = normalizeLabel(input.basePrice ?? "") || null;
  const compareAtPrice = normalizeLabel(input.compareAtPrice ?? "") || null;
  const existingKeys = buildExistingKeySet(input.existing);
  const usedSkus = new Map<string, number>();
  const rows: AdminVariantMatrixRow[] = [];

  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color.toLowerCase()}__${size.toLowerCase()}`;
      const baseSku = `${toSkuToken(input.skuPrefix)}-${toSkuToken(color)}-${toSkuToken(size)}`;
      const skuCount = (usedSkus.get(baseSku) ?? 0) + 1;
      usedSkus.set(baseSku, skuCount);
      const sku = skuCount > 1 ? `${baseSku}-${skuCount}` : baseSku;

      rows.push({
        key,
        sku,
        name: `${normalizeLabel(input.namePrefix)} - ${color} / ${size}`,
        color,
        size,
        material,
        price,
        compareAtPrice,
        initialInventory: input.initialInventory,
        isActive: input.isActive,
        exists: existingKeys.has(key),
      });
    }
  }

  return rows;
}
