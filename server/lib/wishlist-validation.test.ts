import { describe, expect, it } from "vitest";
import { updateWishlistPreferencesSchema } from "@/lib/validation/wishlist";

describe("wishlist validation", () => {
  it("normalizes blank preference values to null on update", () => {
    const parsed = updateWishlistPreferencesSchema.parse({
      preferredColorValue: "   ",
      preferredSizeValue: "\t",
    });

    expect(parsed.preferredColorValue).toBeNull();
    expect(parsed.preferredSizeValue).toBeNull();
  });

  it("keeps non-blank preference values trimmed", () => {
    const parsed = updateWishlistPreferencesSchema.parse({
      preferredColorValue: "  Black  ",
      preferredSizeValue: "  M ",
    });

    expect(parsed.preferredColorValue).toBe("Black");
    expect(parsed.preferredSizeValue).toBe("M");
  });
});
