import { describe, expect, it } from "vitest";

import { listAdminVariantPresets } from "@/server/services/admin-variant-preset.service";

describe("listAdminVariantPresets", () => {
  it("returns usable presets for admin matrix generation", async () => {
    const presets = await listAdminVariantPresets();
    expect(presets.length).toBeGreaterThan(0);
    expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length);
    expect(presets.every((preset) => preset.colors.length > 0)).toBe(true);
    expect(presets.every((preset) => preset.sizes.length > 0)).toBe(true);
  });
});
