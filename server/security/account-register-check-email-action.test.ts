import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  checkCustomerEmailAvailability: vi.fn(),
  rateLimitOrResponse: vi.fn(),
  mapAuthActionError: vi.fn(),
  logAuthFailureEvent: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/server/auth/account-discovery.service", () => ({
  checkCustomerEmailAvailability: mocks.checkCustomerEmailAvailability,
}));

vi.mock("@/server/security/rate-limit", () => ({
  rateLimitOrResponse: mocks.rateLimitOrResponse,
}));

vi.mock("@/server/auth/auth-action-error", () => ({
  mapAuthActionError: mocks.mapAuthActionError,
}));

vi.mock("@/server/observability/auth-events", () => ({
  logAuthFailureEvent: mocks.logAuthFailureEvent,
}));

import { accountRegisterCheckEmailAction } from "@/app/account/register/check-email/actions";
import { initialAccountRegisterEmailCheckState } from "@/app/account/register/check-email/state";

describe("accountRegisterCheckEmailAction", () => {
  beforeEach(() => {
    mocks.headers.mockReset();
    mocks.checkCustomerEmailAvailability.mockReset();
    mocks.rateLimitOrResponse.mockReset();
    mocks.mapAuthActionError.mockReset();
    mocks.logAuthFailureEvent.mockReset();

    mocks.headers.mockResolvedValue(new Headers([["x-request-id", "req-1"]]));
    mocks.rateLimitOrResponse.mockReturnValue(null);
  });

  it("returns available when the customer email does not exist", async () => {
    mocks.checkCustomerEmailAvailability.mockResolvedValueOnce({
      status: "available",
      normalizedEmail: "new@example.com",
    });

    const formData = new FormData();
    formData.set("email", " New@Example.com ");

    await expect(
      accountRegisterCheckEmailAction(initialAccountRegisterEmailCheckState, formData)
    ).resolves.toEqual({
      ok: true,
      code: "OK",
      error: "",
      requestId: "req-1",
      data: {
        status: "available",
        email: "new@example.com",
      },
    });
  });

  it("returns exists when the customer email already exists", async () => {
    mocks.checkCustomerEmailAvailability.mockResolvedValueOnce({
      status: "exists",
      normalizedEmail: "customer@example.com",
    });

    const formData = new FormData();
    formData.set("email", "customer@example.com");

    await expect(
      accountRegisterCheckEmailAction(initialAccountRegisterEmailCheckState, formData)
    ).resolves.toEqual({
      ok: true,
      code: "OK",
      error: "",
      requestId: "req-1",
      data: {
        status: "exists",
        email: "customer@example.com",
      },
    });
  });

  it("maps validation errors without logging sensitive input", async () => {
    mocks.mapAuthActionError.mockReturnValueOnce({
      code: "VALIDATION_ERROR",
      message: AUTH_COPY_BY_CODE.VALIDATION_ERROR,
    });

    const formData = new FormData();
    formData.set("email", "not-an-email");

    await expect(
      accountRegisterCheckEmailAction(initialAccountRegisterEmailCheckState, formData)
    ).resolves.toEqual({
      ok: false,
      code: "VALIDATION_ERROR",
      error: AUTH_COPY_BY_CODE.VALIDATION_ERROR,
      requestId: "req-1",
    });

    expect(mocks.logAuthFailureEvent).toHaveBeenCalledWith({
      event: "auth.customer_register.check_email_failed",
      requestId: "req-1",
      reasonCode: "VALIDATION_ERROR",
    });
  });

  it("returns rate limited when the precheck policy blocks the request", async () => {
    mocks.rateLimitOrResponse.mockReturnValueOnce(new Response(null, { status: 429 }));

    const formData = new FormData();
    formData.set("email", "customer@example.com");

    await expect(
      accountRegisterCheckEmailAction(initialAccountRegisterEmailCheckState, formData)
    ).resolves.toEqual({
      ok: false,
      code: "RATE_LIMITED",
      error: AUTH_COPY_BY_CODE.RATE_LIMITED,
      requestId: "req-1",
    });

    expect(mocks.checkCustomerEmailAvailability).not.toHaveBeenCalled();
    expect(mocks.logAuthFailureEvent).toHaveBeenCalledWith({
      event: "auth.customer_register.check_email_failed",
      requestId: "req-1",
      reasonCode: "RATE_LIMITED",
    });
  });

  it("remaps unauthorized lookup failures to unexpected error", async () => {
    mocks.checkCustomerEmailAvailability.mockRejectedValueOnce(
      new AppError("blocked", 401, "UNAUTHORIZED")
    );
    mocks.mapAuthActionError.mockReturnValueOnce({
      code: "UNAUTHORIZED",
      message: AUTH_COPY_BY_CODE.UNAUTHORIZED,
    });

    const formData = new FormData();
    formData.set("email", "customer@example.com");

    await expect(
      accountRegisterCheckEmailAction(initialAccountRegisterEmailCheckState, formData)
    ).resolves.toEqual({
      ok: false,
      code: "UNEXPECTED_ERROR",
      error: AUTH_COPY_BY_CODE.UNEXPECTED_ERROR,
      requestId: "req-1",
    });

    expect(mocks.logAuthFailureEvent).toHaveBeenCalledWith({
      event: "auth.customer_register.check_email_failed",
      requestId: "req-1",
      reasonCode: "UNAUTHORIZED",
    });
  });
});
