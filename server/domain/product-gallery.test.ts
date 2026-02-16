import { describe, expect, it } from "vitest";

import { buildProductGalleryImages } from "@/lib/storefront/product-gallery";

const images = [
  { id: "1", url: "a.jpg", alt: null, variantId: null },
  { id: "2", url: "b.jpg", alt: null, variantId: "v1" },
  { id: "3", url: "c.jpg", alt: null, variantId: "v1" },
  { id: "4", url: "d.jpg", alt: null, variantId: "v2" },
];

describe("buildProductGalleryImages", () => {
  it("prefers selected variant mapped images", () => {
    const result = buildProductGalleryImages(images, "v1", { minItems: 2, maxItems: 6 });
    expect(result.every((item) => item.variantId === "v1")).toBe(true);
  });

  it("falls back to unassigned images when variant has no mapping", () => {
    const result = buildProductGalleryImages(images, "v3", { minItems: 1, maxItems: 6 });
    expect(result[0].id).toBe("1");
  });

  it("repeats small sets to reach minimum gallery size", () => {
    const result = buildProductGalleryImages(
      [{ id: "x", url: "x.jpg", alt: null, variantId: null }],
      null,
      { minItems: 4, maxItems: 6 }
    );

    expect(result).toHaveLength(4);
    expect(result[0].id).toBe("x");
    expect(result[3].id).toBe("x");
  });
});
