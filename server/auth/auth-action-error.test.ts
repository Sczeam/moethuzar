import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "@/server/errors";
import { mapAuthActionError } from "@/server/auth/auth-action-error";

describe("mapAuthActionError", () => {
  it("maps zod errors to VALIDATION_ERROR", () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "not-email" });
    if (parsed.success) {
      throw new Error("Expected parse failure.");
    }

    const mapped = mapAuthActionError(parsed.error);
    expect(mapped.code).toBe("VALIDATION_ERROR");
  });

  it("maps known AppError code", () => {
    const mapped = mapAuthActionError(
      new AppError("already exists", 409, "EMAIL_ALREADY_REGISTERED")
    );
    expect(mapped.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("maps unknown errors to UNEXPECTED_ERROR", () => {
    const mapped = mapAuthActionError(new Error("boom"));
    expect(mapped.code).toBe("UNEXPECTED_ERROR");
  });
});

