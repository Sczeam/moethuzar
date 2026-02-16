import { describe, expect, it } from "vitest";

import { buildVariantDiagnostics, toSkuToken } from "@/lib/admin/variant-editor";

describe("toSkuToken", () => {
  it("normalizes free-form text to stable SKU tokens", () => {
    expect(toSkuToken("  rose veranda  ")).toBe("ROSE-VERANDA");
    expect(toSkuToken("Pink / Red")).toBe("PINK-RED");
  });
});

describe("buildVariantDiagnostics", () => {
  it("detects missing required fields and duplicates", () => {
    const diagnostics = buildVariantDiagnostics([
      { sku: "", name: "", color: "Ivory", size: "S", isActive: true, inventory: 0 },
      { sku: "MZT-1", name: "One", color: "Ivory", size: "S", isActive: true, inventory: 0 },
      { sku: "MZT-1", name: "Two", color: "Ivory", size: "S", isActive: true, inventory: 2 },
    ]);

    expect(diagnostics.hasBlocking).toBe(true);
    expect(diagnostics.issuesByIndex[0]).toContain("SKU is required.");
    expect(diagnostics.issuesByIndex[0]).toContain("Variant name is required.");
    expect(diagnostics.issuesByIndex[1]).toContain("Duplicate SKU in this draft.");
    expect(diagnostics.issuesByIndex[2]).toContain("Duplicate color + size combination in this draft.");
  });

  it("flags inactive variants that still have stock", () => {
    const diagnostics = buildVariantDiagnostics([
      { sku: "MZT-2", name: "Inactive", color: "Navy", size: "M", isActive: false, inventory: 4 },
    ]);

    expect(diagnostics.issuesByIndex[0]).toContain("Inactive variant still has stock.");
    expect(diagnostics.hasBlocking).toBe(false);
  });
});
