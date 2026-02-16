import { describe, expect, it } from "vitest";

import { generateVariantMatrix } from "@/server/domain/admin-variant-matrix";

describe("generateVariantMatrix", () => {
  it("builds color x size rows and marks existing keys", () => {
    const rows = generateVariantMatrix({
      namePrefix: "Core Hoodie",
      skuPrefix: "core-hoodie",
      colors: ["Sand", "Navy"],
      sizes: ["S", "M"],
      initialInventory: 3,
      isActive: true,
      existing: [{ color: "sand", size: "s" }],
    });

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      sku: "CORE-HOODIE-SAND-S",
      name: "Core Hoodie - Sand / S",
      exists: true,
      initialInventory: 3,
    });
    expect(rows[3]).toMatchObject({
      sku: "CORE-HOODIE-NAVY-M",
      exists: false,
    });
  });

  it("dedupes noisy input values and normalizes spacing", () => {
    const rows = generateVariantMatrix({
      namePrefix: " Rose Veranda ",
      skuPrefix: "  rose veranda  ",
      colors: [" Pink ", "pink", ""],
      sizes: [" M ", "M"],
      initialInventory: 0,
      isActive: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sku: "ROSE-VERANDA-PINK-M",
      name: "Rose Veranda - Pink / M",
    });
  });
});
