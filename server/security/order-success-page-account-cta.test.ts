import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getPublicOrderByCode: vi.fn(),
  getCustomerSessionUser: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
}));

vi.mock("@/server/services/public-order.service", () => ({
  getPublicOrderByCode: mocks.getPublicOrderByCode,
}));

vi.mock("@/server/auth/customer", () => ({
  getCustomerSessionUser: mocks.getCustomerSessionUser,
}));

vi.mock("@/components/order/live-status", () => ({
  default: ({ orderCode, initialStatus }: { orderCode: string; initialStatus: string }) =>
    React.createElement("div", {
      "data-order-code": orderCode,
      "data-order-status": initialStatus,
    }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

import OrderSuccessPage from "@/app/order/success/[orderCode]/page";

function createOrder() {
  return {
    id: "order-1",
    orderCode: "MZT-20260306-123456ABC123",
    status: "PENDING",
    currency: "MMK",
    subtotalAmount: "100000",
    deliveryFeeAmount: "5000",
    shippingZoneKey: "YANGON",
    shippingZoneLabel: "Yangon",
    shippingEtaLabel: "Same day",
    totalAmount: "105000",
    customerName: "Test Customer",
    customerPhone: "0912345678",
    customerNote: null,
    createdAt: new Date("2026-03-06T00:00:00.000Z"),
    items: [
      {
        id: "item-1",
        productName: "Midnight Bloom Blazer Set",
        variantName: "S / Black",
        sku: "SKU-1",
        unitPrice: "100000",
        quantity: 1,
        lineTotal: "100000",
      },
    ],
  };
}

async function renderPage(searchParamAccount?: string) {
  const element = await OrderSuccessPage({
    params: Promise.resolve({ orderCode: "MZT-20260306-123456ABC123" }),
    searchParams: Promise.resolve(
      searchParamAccount ? { account: searchParamAccount } : {}
    ),
  });

  return renderToStaticMarkup(element);
}

describe("order success page account CTA", () => {
  beforeEach(() => {
    mocks.getPublicOrderByCode.mockReset();
    mocks.getCustomerSessionUser.mockReset();
    mocks.notFound.mockClear();
    mocks.redirect.mockClear();

    mocks.getPublicOrderByCode.mockResolvedValue(createOrder());
    mocks.getCustomerSessionUser.mockResolvedValue(null);
  });

  it("shows my-account CTA for signed-in customers", async () => {
    mocks.getCustomerSessionUser.mockResolvedValueOnce({
      id: "auth-user-1",
      email: "customer@example.com",
    });

    const html = await renderPage();

    expect(html).toContain("Go to My Account");
    expect(html).toContain("signed in as customer@example.com");
    expect(html).not.toContain("Reset Password");
    expect(html).not.toContain("Create Account</a>");
  });

  it("shows sign-in CTA when account was created during checkout", async () => {
    const html = await renderPage("created");

    expect(html).toContain("Your customer account was created during checkout");
    expect(html).toContain("Sign In to Account");
    expect(html).not.toContain("Reset Password");
  });

  it("shows sign-in and reset CTA when email already exists", async () => {
    const html = await renderPage("existing-email");

    expect(html).toContain("An account already exists for this checkout email");
    expect(html).toContain("Sign In");
    expect(html).toContain("Reset Password");
  });

  it("shows create-account CTA when checkout account creation failed", async () => {
    const html = await renderPage("failed");

    expect(html).toContain("account creation did not complete");
    expect(html).toContain("Create Account");
    expect(html).not.toContain("Reset Password");
  });

  it("shows generic create/sign-in CTA for guest success page", async () => {
    const html = await renderPage();

    expect(html).toContain("Want faster checkout next time");
    expect(html).toContain("Create Account");
    expect(html).toContain("Sign In");
  });
});
