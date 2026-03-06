import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { LEGAL_TERMS_VERSION } from "@/lib/constants/legal";

const mocks = vi.hoisted(() => ({
  resolveCartSession: vi.fn(),
  attachCartCookie: vi.fn(),
  createOrderFromCart: vi.fn(),
  resolveCustomerFromSession: vi.fn(),
  resolveCheckoutAccountIntentCustomer: vi.fn(),
}));

vi.mock("@/lib/cart-session", () => ({
  resolveCartSession: mocks.resolveCartSession,
  attachCartCookie: mocks.attachCartCookie,
}));

vi.mock("@/server/services/order.service", () => ({
  createOrderFromCart: mocks.createOrderFromCart,
}));

vi.mock("@/server/auth/customer-identity", () => ({
  resolveCustomerFromSession: mocks.resolveCustomerFromSession,
}));

vi.mock("@/server/services/checkout-account-intent.service", () => ({
  resolveCheckoutAccountIntentCustomer: mocks.resolveCheckoutAccountIntentCustomer,
}));

import { POST as checkoutPost } from "@/app/api/checkout/route";

const checkoutResponseSchema = z.object({
  ok: z.literal(true),
  order: z.object({
    id: z.string(),
    orderCode: z.string(),
    status: z.string(),
  }),
});

function createPayload(extra?: Record<string, unknown>) {
  return {
    country: "Myanmar",
    customerName: "Test Customer",
    customerPhone: "0912345678",
    customerEmail: "",
    customerNote: "",
    stateRegion: "Yangon Region",
    townshipCity: "Sanchaung",
    addressLine1: "No. 1, Test Street",
    addressLine2: "",
    postalCode: "",
    termsAccepted: true,
    termsVersion: LEGAL_TERMS_VERSION,
    ...extra,
  };
}

function createOrderResult() {
  return {
    id: "order-1",
    orderCode: "MZT-20260305-010101ABC123",
    status: "PENDING",
    paymentMethod: "COD",
    paymentStatus: "NOT_REQUIRED",
    paymentProofUrl: null,
    paymentReference: null,
    paymentSubmittedAt: null,
    paymentVerifiedAt: null,
    promoCode: null,
    promoDiscountType: null,
    promoDiscountValue: null,
    discountAmount: "0.00",
    subtotalBeforeDiscount: "200.00",
    subtotalAfterDiscount: "200.00",
    currency: "MMK",
    subtotalAmount: "200.00",
    deliveryFeeAmount: "0.00",
    totalAmount: "200.00",
    customerName: "Test Customer",
    customerPhone: "0912345678",
    customerEmail: null,
    customerNote: null,
    shippingZoneKey: "YANGON",
    shippingZoneLabel: "Yangon",
    shippingEtaLabel: "Same day",
    createdAt: new Date("2026-03-05T01:00:00.000Z"),
    items: [],
    address: null,
  };
}

describe("checkout route customer linking", () => {
  beforeEach(() => {
    mocks.resolveCartSession.mockReset();
    mocks.attachCartCookie.mockReset();
    mocks.createOrderFromCart.mockReset();
    mocks.resolveCustomerFromSession.mockReset();
    mocks.resolveCheckoutAccountIntentCustomer.mockReset();

    mocks.resolveCartSession.mockReturnValue({ token: "guest-token" });
    mocks.createOrderFromCart.mockResolvedValue(createOrderResult());
    mocks.resolveCheckoutAccountIntentCustomer.mockResolvedValue({
      customerId: null,
      reason: "DISABLED",
    });
  });

  it("passes resolved customer id to createOrderFromCart for signed-in checkout", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "customer",
      customerId: "f9ed219d-56ef-4865-bebe-4bf5ff0f17b0",
      authUserId: "auth-1",
      email: "customer@example.com",
    });

    const response = await checkoutPost(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": "8c40c6f6-ebac-4d68-8402-cd2eb53f39bc",
        },
        body: JSON.stringify(createPayload()),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createOrderFromCart).toHaveBeenCalledWith(
      "guest-token",
      expect.any(Object),
      {
        idempotencyKey: "8c40c6f6-ebac-4d68-8402-cd2eb53f39bc",
        customerId: "f9ed219d-56ef-4865-bebe-4bf5ff0f17b0",
      }
    );

    const parsed = checkoutResponseSchema.safeParse(await response.json());
    expect(parsed.success).toBe(true);
  });

  it("keeps customerId null for guest checkout and ignores injected customerId payload", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });

    const response = await checkoutPost(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          createPayload({
            customerId: "malicious-injected-id",
          })
        ),
      })
    );

    expect(response.status).toBe(201);
    const [, passedInput, options] = mocks.createOrderFromCart.mock.calls[0];
    expect(options).toEqual({
      idempotencyKey: undefined,
      customerId: null,
    });
    expect(passedInput).not.toHaveProperty("customerId");
  });

  it("creates order with account-intent customer id for guest checkout when registration succeeds", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });
    mocks.resolveCheckoutAccountIntentCustomer.mockResolvedValueOnce({
      customerId: "1f51934f-0f7f-4706-bd8c-1257f38ca5f7",
      reason: "ACCOUNT_CREATED",
    });

    const response = await checkoutPost(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          createPayload({
            customerEmail: "customer@example.com",
            accountIntent: {
              enabled: true,
              password: "password123",
              confirmPassword: "password123",
            },
          })
        ),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createOrderFromCart).toHaveBeenCalledWith(
      "guest-token",
      expect.any(Object),
      expect.objectContaining({
        customerId: "1f51934f-0f7f-4706-bd8c-1257f38ca5f7",
      })
    );
  });

  it("keeps checkout successful when account-intent registration degrades", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });
    mocks.resolveCheckoutAccountIntentCustomer.mockResolvedValueOnce({
      customerId: null,
      reason: "EMAIL_ALREADY_REGISTERED",
    });

    const response = await checkoutPost(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          createPayload({
            customerEmail: "existing@example.com",
            accountIntent: {
              enabled: true,
              password: "password123",
              confirmPassword: "password123",
            },
          })
        ),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createOrderFromCart).toHaveBeenCalledWith(
      "guest-token",
      expect.any(Object),
      expect.objectContaining({
        customerId: null,
      })
    );
  });

  it("returns validation error when account-intent is enabled without customer email", async () => {
    mocks.resolveCustomerFromSession.mockResolvedValueOnce({
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    });

    const response = await checkoutPost(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          createPayload({
            accountIntent: {
              enabled: true,
              password: "password123",
              confirmPassword: "password123",
            },
          })
        ),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.resolveCheckoutAccountIntentCustomer).not.toHaveBeenCalled();
    expect(mocks.createOrderFromCart).not.toHaveBeenCalled();
  });
});

