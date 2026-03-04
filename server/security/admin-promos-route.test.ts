import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const {
  requireAdminUserIdMock,
  listAdminPromosMock,
  createAdminPromoMock,
  getAdminPromoByIdMock,
  updateAdminPromoMock,
  toggleAdminPromoMock,
} = vi.hoisted(() => ({
  requireAdminUserIdMock: vi.fn(),
  listAdminPromosMock: vi.fn(),
  createAdminPromoMock: vi.fn(),
  getAdminPromoByIdMock: vi.fn(),
  updateAdminPromoMock: vi.fn(),
  toggleAdminPromoMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUserId: requireAdminUserIdMock,
}));

vi.mock("@/server/services/admin-promo-code.service", () => ({
  listAdminPromos: listAdminPromosMock,
  createAdminPromo: createAdminPromoMock,
  getAdminPromoById: getAdminPromoByIdMock,
  updateAdminPromo: updateAdminPromoMock,
  toggleAdminPromo: toggleAdminPromoMock,
}));

import { GET as listPromosGet, POST as createPromoPost } from "@/app/api/admin/promos/route";
import { GET as promoByIdGet, PATCH as promoByIdPatch } from "@/app/api/admin/promos/[promoId]/route";
import { POST as promoTogglePost } from "@/app/api/admin/promos/[promoId]/toggle/route";

const promoId = "11111111-1111-1111-8111-111111111111";

function validPromoPayload() {
  return {
    code: "SAVE10",
    label: "Save 10",
    discountType: "PERCENT",
    value: 10,
    minOrderAmount: 10000,
    startsAt: null,
    endsAt: null,
    usageLimit: 100,
    isActive: true,
  };
}

describe("admin promos routes", () => {
  beforeEach(() => {
    requireAdminUserIdMock.mockReset();
    listAdminPromosMock.mockReset();
    createAdminPromoMock.mockReset();
    getAdminPromoByIdMock.mockReset();
    updateAdminPromoMock.mockReset();
    toggleAdminPromoMock.mockReset();
  });

  it("lists promos", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    listAdminPromosMock.mockResolvedValueOnce([{ id: promoId, code: "SAVE10", status: "ACTIVE" }]);

    const response = await listPromosGet(new Request("http://localhost:3000/api/admin/promos"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.promos).toHaveLength(1);
  });

  it("creates promo and returns 201", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    createAdminPromoMock.mockResolvedValueOnce({ id: promoId, code: "SAVE10" });

    const response = await createPromoPost(
      new Request("http://localhost:3000/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPromoPayload()),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.promo.code).toBe("SAVE10");
  });

  it("returns validation envelope on invalid create payload", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");

    const response = await createPromoPost(
      new Request("http://localhost:3000/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "A",
          discountType: "PERCENT",
          value: 500,
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("gets promo by id", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    getAdminPromoByIdMock.mockResolvedValueOnce({ id: promoId, code: "SAVE10", status: "ACTIVE" });

    const response = await promoByIdGet(
      new Request(`http://localhost:3000/api/admin/promos/${promoId}`),
      { params: Promise.resolve({ promoId }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.promo.id).toBe(promoId);
  });

  it("updates promo by id", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    updateAdminPromoMock.mockResolvedValueOnce({ id: promoId, code: "SAVE10" });

    const response = await promoByIdPatch(
      new Request(`http://localhost:3000/api/admin/promos/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPromoPayload()),
      }),
      { params: Promise.resolve({ promoId }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.promo.id).toBe(promoId);
  });

  it("toggles promo active state", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    toggleAdminPromoMock.mockResolvedValueOnce({ id: promoId, isActive: false });

    const response = await promoTogglePost(
      new Request(`http://localhost:3000/api/admin/promos/${promoId}/toggle`, {
        method: "POST",
      }),
      { params: Promise.resolve({ promoId }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.promo.isActive).toBe(false);
  });

  it("returns deterministic app error envelope for missing promo", async () => {
    requireAdminUserIdMock.mockResolvedValueOnce("admin-id");
    getAdminPromoByIdMock.mockRejectedValueOnce(new AppError("Promo not found.", 404, "PROMO_NOT_FOUND"));

    const response = await promoByIdGet(
      new Request(`http://localhost:3000/api/admin/promos/${promoId}`),
      { params: Promise.resolve({ promoId }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("PROMO_NOT_FOUND");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});

