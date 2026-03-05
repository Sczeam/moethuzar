import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/server/auth/redirect";

describe("sanitizeNextPath", () => {
  it("returns fallback for nullish or empty", () => {
    expect(sanitizeNextPath(undefined, "/admin/catalog")).toBe("/admin/catalog");
    expect(sanitizeNextPath(null, "/admin/catalog")).toBe("/admin/catalog");
    expect(sanitizeNextPath("   ", "/admin/catalog")).toBe("/admin/catalog");
  });

  it("allows safe internal paths", () => {
    expect(sanitizeNextPath("/admin/orders", "/admin/catalog")).toBe("/admin/orders");
    expect(sanitizeNextPath("/admin/login?next=%2Fadmin%2Fcatalog", "/admin/catalog")).toBe(
      "/admin/login?next=%2Fadmin%2Fcatalog"
    );
  });

  it("rejects external and protocol-relative redirect targets", () => {
    expect(sanitizeNextPath("https://evil.example", "/admin/catalog")).toBe("/admin/catalog");
    expect(sanitizeNextPath("//evil.example", "/admin/catalog")).toBe("/admin/catalog");
    expect(sanitizeNextPath("javascript:alert(1)", "/admin/catalog")).toBe("/admin/catalog");
  });
});

