import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const {
  promoCodeFindManyMock,
  promoCodeFindUniqueMock,
  promoCodeCreateMock,
  promoCodeUpdateMock,
} = vi.hoisted(() => ({
  promoCodeFindManyMock: vi.fn(),
  promoCodeFindUniqueMock: vi.fn(),
  promoCodeCreateMock: vi.fn(),
  promoCodeUpdateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promoCode: {
      findMany: promoCodeFindManyMock,
      findUnique: promoCodeFindUniqueMock,
      create: promoCodeCreateMock,
      update: promoCodeUpdateMock,
    },
  },
}));

import {
  createAdminPromo,
  getAdminPromoById,
  listAdminPromos,
  toggleAdminPromo,
  updateAdminPromo,
} from "@/server/services/admin-promo-code.service";

function basePromo(overrides?: Partial<{
  id: string;
  code: string;
  label: string | null;
  discountType: "FLAT" | "PERCENT";
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>) {
  return {
    id: "promo-id",
    code: "SAVE10",
    label: "Save 10",
    discountType: "PERCENT" as const,
    value: 10,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
    createdAt: new Date("2026-03-04T00:00:00Z"),
    updatedAt: new Date("2026-03-04T00:00:00Z"),
    ...overrides,
  };
}

describe("admin-promo-code.service", () => {
  beforeEach(() => {
    promoCodeFindManyMock.mockReset();
    promoCodeFindUniqueMock.mockReset();
    promoCodeCreateMock.mockReset();
    promoCodeUpdateMock.mockReset();
  });

  it("maps list results with resolved statuses", async () => {
    const now = new Date("2026-03-04T12:00:00Z");
    promoCodeFindManyMock.mockResolvedValue([
      basePromo({ id: "active", isActive: true }),
      basePromo({ id: "scheduled", startsAt: new Date("2026-03-05T00:00:00Z") }),
      basePromo({ id: "expired", endsAt: new Date("2026-03-03T00:00:00Z") }),
      basePromo({ id: "inactive", isActive: false }),
      basePromo({ id: "exhausted", usageLimit: 5, usageCount: 5 }),
    ]);

    const rows = await listAdminPromos({ now });

    expect(rows.find((row) => row.id === "active")?.status).toBe("ACTIVE");
    expect(rows.find((row) => row.id === "scheduled")?.status).toBe("SCHEDULED");
    expect(rows.find((row) => row.id === "expired")?.status).toBe("EXPIRED");
    expect(rows.find((row) => row.id === "inactive")?.status).toBe("INACTIVE");
    expect(rows.find((row) => row.id === "exhausted")?.status).toBe("EXHAUSTED");
  });

  it("creates promo with normalized code and default active true", async () => {
    promoCodeCreateMock.mockResolvedValue(basePromo());

    await createAdminPromo({
      code: "  save 10 ",
      label: "  Summer ",
      discountType: "PERCENT",
      value: 10,
      minOrderAmount: null,
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      isActive: undefined,
    });

    expect(promoCodeCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: "SAVE10",
        label: "Summer",
        isActive: true,
      }),
    });
  });

  it("preserves active flag on update when omitted", async () => {
    promoCodeFindUniqueMock.mockResolvedValue({ id: "promo-id" });
    promoCodeUpdateMock.mockResolvedValue(basePromo());

    await updateAdminPromo("promo-id", {
      code: "SAVE20",
      label: "",
      discountType: "FLAT",
      value: 20000,
      minOrderAmount: null,
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      isActive: undefined,
    });

    expect(promoCodeUpdateMock).toHaveBeenCalledWith({
      where: { id: "promo-id" },
      data: expect.objectContaining({
        code: "SAVE20",
        isActive: undefined,
      }),
    });
  });

  it("toggles promo active state", async () => {
    promoCodeFindUniqueMock.mockResolvedValue({ id: "promo-id", isActive: true });
    promoCodeUpdateMock.mockResolvedValue(basePromo({ isActive: false }));

    await toggleAdminPromo("promo-id");

    expect(promoCodeUpdateMock).toHaveBeenCalledWith({
      where: { id: "promo-id" },
      data: { isActive: false },
    });
  });

  it("throws not found for missing promo in get/update/toggle", async () => {
    promoCodeFindUniqueMock.mockResolvedValue(null);

    await expect(getAdminPromoById("missing-id")).rejects.toBeInstanceOf(AppError);
    await expect(getAdminPromoById("missing-id")).rejects.toMatchObject({
      code: "PROMO_NOT_FOUND",
      status: 404,
    });

    await expect(
      updateAdminPromo("missing-id", {
        code: "SAVE20",
        label: "",
        discountType: "FLAT",
        value: 20000,
        minOrderAmount: null,
        startsAt: null,
        endsAt: null,
        usageLimit: null,
        isActive: true,
      }),
    ).rejects.toMatchObject({
      code: "PROMO_NOT_FOUND",
      status: 404,
    });

    await expect(toggleAdminPromo("missing-id")).rejects.toMatchObject({
      code: "PROMO_NOT_FOUND",
      status: 404,
    });
  });
});
