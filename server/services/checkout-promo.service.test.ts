import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";
import { CartStatus } from "@prisma/client";

const { prismaTransactionMock } = vi.hoisted(() => ({
  prismaTransactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaTransactionMock,
  },
}));

import {
  evaluatePromoByCode,
  previewPromoForActiveCart,
  reservePromoUsage,
} from "@/server/services/checkout-promo.service";

function createPromoRule(overrides?: Partial<{
  id: string;
  code: string;
  discountType: "FLAT" | "PERCENT";
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}>) {
  return {
    id: "promo-id",
    code: "SAVE10",
    discountType: "PERCENT" as const,
    value: 10,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
    ...overrides,
  };
}

describe("checkout-promo.service", () => {
  beforeEach(() => {
    prismaTransactionMock.mockReset();
  });

  it("evaluates a valid promo code snapshot", async () => {
    const tx = {
      promoCode: {
        findUnique: vi.fn().mockResolvedValue(createPromoRule()),
      },
    };

    const result = await evaluatePromoByCode(tx as never, " save10 ", 100000, new Date("2026-03-04T00:00:00Z"));

    expect(result.normalizedCode).toBe("SAVE10");
    expect(result.discountType).toBe("PERCENT");
    expect(result.discountAmount).toBe(10000);
    expect(result.subtotalAfterDiscount).toBe(90000);
  });

  it("rejects inactive promo evaluation with deterministic code", async () => {
    const tx = {
      promoCode: {
        findUnique: vi.fn().mockResolvedValue(createPromoRule({ isActive: false })),
      },
    };

    await expect(
      evaluatePromoByCode(tx as never, "SAVE10", 100000, new Date("2026-03-04T00:00:00Z")),
    ).rejects.toMatchObject({
      code: "PROMO_INACTIVE",
      status: 400,
    });
  });

  it("rejects usage limit reached at reserve boundary", async () => {
    const tx = {
      promoCode: {
        updateMany: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    await expect(
      reservePromoUsage(
        tx as never,
        {
          id: "promo-id",
          usageLimit: 10,
          usageCount: 10,
          isActive: true,
          startsAt: null,
          endsAt: null,
        },
        new Date("2026-03-04T00:00:00Z"),
      ),
    ).rejects.toMatchObject({
      code: "PROMO_USAGE_LIMIT_REACHED",
      status: 409,
    });
  });

  it("handles reservation conflict retry path and surfaces usage limit reached", async () => {
    const updateManyMock = vi.fn().mockResolvedValue({ count: 0 });
    const findUniqueMock = vi.fn().mockResolvedValue({
      usageCount: 3,
      usageLimit: 3,
      isActive: true,
      startsAt: null,
      endsAt: null,
    });

    const tx = {
      promoCode: {
        updateMany: updateManyMock,
        findUnique: findUniqueMock,
        update: vi.fn(),
      },
    };

    await expect(
      reservePromoUsage(
        tx as never,
        {
          id: "promo-id",
          usageLimit: 3,
          usageCount: 2,
          isActive: true,
          startsAt: null,
          endsAt: null,
        },
        new Date("2026-03-04T00:00:00Z"),
      ),
    ).rejects.toMatchObject({
      code: "PROMO_USAGE_LIMIT_REACHED",
      status: 409,
    });

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("previews promo for active cart", async () => {
    const tx = {
      cart: {
        findUnique: vi.fn().mockResolvedValue({
          status: CartStatus.ACTIVE,
          items: [{ quantity: 2, price: 50000 }],
        }),
      },
      promoCode: {
        findUnique: vi.fn().mockResolvedValue(createPromoRule()),
      },
    };

    prismaTransactionMock.mockImplementation(async (callback: (client: unknown) => unknown) =>
      callback(tx),
    );

    const result = await previewPromoForActiveCart("guest-token", { promoCode: "save10" });

    expect(result.promoCode).toBe("SAVE10");
    expect(result.discountAmount).toBe(10000);
    expect(result.subtotalBeforeDiscount).toBe(100000);
    expect(result.subtotalAfterDiscount).toBe(90000);
  });

  it("rejects preview when cart is missing", async () => {
    const tx = {
      cart: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      promoCode: {
        findUnique: vi.fn(),
      },
    };

    prismaTransactionMock.mockImplementation(async (callback: (client: unknown) => unknown) =>
      callback(tx),
    );

    await expect(
      previewPromoForActiveCart("guest-token", { promoCode: "save10" }),
    ).rejects.toMatchObject({ code: "CART_NOT_FOUND", status: 404 });
  });
});
