import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BACKFILL_CONFIRMATION_TEXT,
  customerOrderBackfillInternals,
  decideCustomerOrderBackfill,
  rollbackCustomerOrderBackfill,
  runCustomerOrderBackfill,
} from "@/server/ops/customer-order-backfill";

type BackfillPrismaMock = {
  order: {
    findMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    findUnique?: ReturnType<typeof vi.fn>;
    update?: ReturnType<typeof vi.fn>;
  };
  customer: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

async function createTempDir() {
  return mkdtemp(path.join(os.tmpdir(), "customer-order-backfill-"));
}

const cleanupDirs: string[] = [];

afterEach(async () => {
  while (cleanupDirs.length > 0) {
    const dir = cleanupDirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe("decideCustomerOrderBackfill", () => {
  it("returns LINK for an exact active-customer email match", () => {
    const lookup = new Map([
      [
        "customer@example.com",
        [{ id: "customer-1", email: "customer@example.com", deactivatedAt: null }],
      ],
    ]);

    const decision = decideCustomerOrderBackfill(
      {
        id: "order-1",
        orderCode: "MZT-1",
        customerEmail: " Customer@example.com ",
        customerId: null,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
      lookup
    );

    expect(decision).toMatchObject({
      action: "LINK",
      customerId: "customer-1",
      emailMasked: "cu***@e***",
    });
  });

  it("skips blank email, deactivated customer, and already linked orders", () => {
    const blank = decideCustomerOrderBackfill(
      {
        id: "order-1",
        orderCode: "MZT-1",
        customerEmail: "   ",
        customerId: null,
        createdAt: new Date(),
      },
      new Map()
    );
    expect(blank).toEqual({ action: "SKIP", reason: "skippedNoEmail" });

    const deactivated = decideCustomerOrderBackfill(
      {
        id: "order-2",
        orderCode: "MZT-2",
        customerEmail: "customer@example.com",
        customerId: null,
        createdAt: new Date(),
      },
      new Map([
        [
          "customer@example.com",
          [{ id: "customer-1", email: "customer@example.com", deactivatedAt: new Date() }],
        ],
      ])
    );
    expect(deactivated).toEqual({ action: "SKIP", reason: "skippedDeactivatedCustomer" });

    const linked = decideCustomerOrderBackfill(
      {
        id: "order-3",
        orderCode: "MZT-3",
        customerEmail: "customer@example.com",
        customerId: "existing-customer",
        createdAt: new Date(),
      },
      new Map()
    );
    expect(linked).toEqual({ action: "SKIP", reason: "skippedAlreadyLinked" });
  });
});

describe("runCustomerOrderBackfill", () => {
  it("writes a dry-run artifact and does not mutate rows", async () => {
    const reportDir = await createTempDir();
    cleanupDirs.push(reportDir);

    const prisma: BackfillPrismaMock = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "order-1",
            orderCode: "MZT-1",
            customerEmail: "customer@example.com",
            customerId: null,
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
        ]),
        updateMany: vi.fn(),
      },
      customer: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "customer-1",
            email: "customer@example.com",
            deactivatedAt: null,
          },
        ]),
      },
    };

    const result = await runCustomerOrderBackfill(prisma as never, {
      mode: "dry-run",
      reportDir,
      runId: "run-dry",
    });

    expect(result.summary.linked).toBe(1);
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(result.artifactPath).toBe(path.join(reportDir, "dry-run-run-dry.json"));

    const artifact = JSON.parse(await readFile(result.artifactPath as string, "utf8"));
    expect(artifact.kind).toBe("customer-order-backfill-dry-run");
    expect(artifact.summary.linked).toBe(1);
  });

  it("applies only to currently unlinked orders and writes an apply artifact", async () => {
    const reportDir = await createTempDir();
    cleanupDirs.push(reportDir);

    const prisma: BackfillPrismaMock = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "order-1",
            orderCode: "MZT-1",
            customerEmail: "customer@example.com",
            customerId: null,
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
          {
            id: "order-2",
            orderCode: "MZT-2",
            customerEmail: null,
            customerId: null,
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
        ]),
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 }),
      },
      customer: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "customer-1",
            email: "customer@example.com",
            deactivatedAt: null,
          },
        ]),
      },
    };

    const result = await runCustomerOrderBackfill(prisma as never, {
      mode: "apply",
      confirm: BACKFILL_CONFIRMATION_TEXT,
      reportDir,
      runId: "run-apply",
    });

    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        customerId: null,
      },
      data: {
        customerId: "customer-1",
      },
    });
    expect(result.summary.linked).toBe(1);
    expect(result.summary.skippedNoEmail).toBe(1);

    const artifact = JSON.parse(await readFile(result.artifactPath as string, "utf8"));
    expect(artifact.kind).toBe("customer-order-backfill");
    expect(artifact.mutations).toHaveLength(1);
    expect(artifact.mutations[0]).toMatchObject({
      orderId: "order-1",
      previousCustomerId: null,
      newCustomerId: "customer-1",
    });
  });

  it("rejects apply mode without confirmation", async () => {
    const prisma: BackfillPrismaMock = {
      order: { findMany: vi.fn(), updateMany: vi.fn() },
      customer: { findMany: vi.fn() },
    };

    await expect(
      runCustomerOrderBackfill(prisma as never, {
        mode: "apply",
      })
    ).rejects.toThrow(`Apply mode requires --confirm "${BACKFILL_CONFIRMATION_TEXT}"`);
  });
});

describe("rollbackCustomerOrderBackfill", () => {
  it("restores previous customer ids for a run artifact", async () => {
    const reportDir = await createTempDir();
    cleanupDirs.push(reportDir);

    const applyArtifactPath = path.join(reportDir, "apply-run-1.json");
    const payload = {
      kind: "customer-order-backfill",
      runId: "run-1",
      mode: "apply",
      generatedAt: new Date().toISOString(),
      before: new Date().toISOString(),
      summary: {
        scanned: 1,
        eligible: 1,
        linked: 1,
        skippedNoEmail: 0,
        skippedNoCustomerMatch: 0,
        skippedAlreadyLinked: 0,
        skippedDeactivatedCustomer: 0,
        skippedAmbiguous: 0,
        errors: 0,
      },
      db: { host: null, database: null },
      mutations: [
        {
          orderId: "order-1",
          orderCode: "MZT-1",
          previousCustomerId: null,
          newCustomerId: "customer-1",
          emailMasked: "cu***@e***",
          emailHash: "hash",
        },
      ],
    };
    await writeFile(applyArtifactPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: "order-1",
          customerId: "customer-1",
        }),
        update: vi.fn().mockResolvedValue({
          id: "order-1",
          customerId: null,
        }),
      },
    } as {
      order: {
        findUnique: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
      };
    };

    const result = await rollbackCustomerOrderBackfill(prisma as never, {
      runId: "run-1",
      reportDir,
      confirm: BACKFILL_CONFIRMATION_TEXT,
    });

    expect(result.summary.restored).toBe(1);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { customerId: null },
    });
  });
});

describe("customerOrderBackfillInternals", () => {
  it("normalizes and masks email deterministically", () => {
    expect(customerOrderBackfillInternals.normalizeEmail(" Test@Example.com ")).toBe(
      "test@example.com"
    );
    expect(customerOrderBackfillInternals.maskEmail("test@example.com")).toBe("te***@e***");
    expect(customerOrderBackfillInternals.hashEmail("test@example.com")).toHaveLength(64);
  });
});
