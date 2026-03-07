import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { PrismaClient } from "@prisma/client";

export const DEFAULT_B5_CUTOFF = new Date("2026-03-05T00:00:00.000Z");
export const DEFAULT_B5_BATCH_SIZE = 250;
export const BACKFILL_CONFIRMATION_TEXT = "LINK ORDERS";
export const DEFAULT_B5_REPORT_DIR = ".ops-reports/customer-order-backfill";

type BackfillOrderCandidate = {
  id: string;
  orderCode: string;
  customerEmail: string | null;
  customerId: string | null;
  createdAt: Date;
};

type BackfillCustomerCandidate = {
  id: string;
  email: string;
  deactivatedAt: Date | null;
};

export type BackfillOrderMutation = {
  orderId: string;
  orderCode: string;
  previousCustomerId: string | null;
  newCustomerId: string;
  emailMasked: string;
  emailHash: string;
};

export type CustomerOrderBackfillArtifact = {
  kind: "customer-order-backfill";
  runId: string;
  mode: "apply";
  generatedAt: string;
  before: string;
  summary: BackfillSummary;
  db: {
    host: string | null;
    database: string | null;
  };
  mutations: BackfillOrderMutation[];
};

export type CustomerOrderBackfillDryRunArtifact = {
  kind: "customer-order-backfill-dry-run";
  runId: string;
  generatedAt: string;
  before: string;
  summary: BackfillSummary;
  db: {
    host: string | null;
    database: string | null;
  };
  decisions: BackfillDecisionRow[];
};

export type CustomerOrderBackfillRollbackArtifact = {
  kind: "customer-order-backfill-rollback";
  runId: string;
  generatedAt: string;
  summary: RollbackSummary;
  sourceArtifactPath: string;
};

export type BackfillSummary = {
  scanned: number;
  eligible: number;
  linked: number;
  skippedNoEmail: number;
  skippedNoCustomerMatch: number;
  skippedAlreadyLinked: number;
  skippedDeactivatedCustomer: number;
  skippedAmbiguous: number;
  errors: number;
};

export type BackfillDecision =
  | {
      action: "LINK";
      customerId: string;
      emailMasked: string;
      emailHash: string;
    }
  | { action: "SKIP"; reason: keyof Omit<BackfillSummary, "scanned" | "eligible" | "linked"> };

export type BackfillDecisionRow = {
  orderId: string;
  orderCode: string;
  action: BackfillDecision["action"];
  reason: string;
  emailMasked: string | null;
  emailHash: string | null;
  customerId: string | null;
};

export type RunCustomerOrderBackfillOptions = {
  mode: "dry-run" | "apply";
  before?: Date;
  limit?: number;
  orderCode?: string;
  customerEmail?: string;
  batchSize?: number;
  reportDir?: string;
  runId?: string;
  confirm?: string;
};

export type RunCustomerOrderBackfillResult = {
  runId: string;
  mode: "dry-run" | "apply";
  before: string;
  db: {
    host: string | null;
    database: string | null;
  };
  summary: BackfillSummary;
  decisions: BackfillDecisionRow[];
  artifactPath: string | null;
};

export type RollbackCustomerOrderBackfillOptions = {
  runId: string;
  reportDir?: string;
  confirm?: string;
};

export type RollbackSummary = {
  scanned: number;
  restored: number;
  skippedMismatch: number;
  skippedMissingOrder: number;
  errors: number;
};

export type RollbackCustomerOrderBackfillResult = {
  runId: string;
  summary: RollbackSummary;
  artifactPath: string;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function maskEmail(email: string): string {
  const [localPart, domain = ""] = email.split("@");
  const visibleLocal = localPart.length <= 2 ? localPart[0] ?? "*" : localPart.slice(0, 2);
  const visibleDomain = domain.length > 0 ? domain[0] : "*";
  return `${visibleLocal}***@${visibleDomain}***`;
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

export function deriveDatabaseIdentity(url: string | undefined) {
  if (!url) {
    return { host: null, database: null };
  }

  try {
    const parsed = new URL(url);
    return {
      host: parsed.host || null,
      database: parsed.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return { host: null, database: null };
  }
}

export function decideCustomerOrderBackfill(
  order: BackfillOrderCandidate,
  customerLookup: Map<string, BackfillCustomerCandidate[]>
): BackfillDecision {
  if (order.customerId) {
    return { action: "SKIP", reason: "skippedAlreadyLinked" };
  }

  const normalizedEmail = normalizeEmail(order.customerEmail);
  if (!normalizedEmail) {
    return { action: "SKIP", reason: "skippedNoEmail" };
  }

  const candidates = customerLookup.get(normalizedEmail) ?? [];
  if (candidates.length === 0) {
    return { action: "SKIP", reason: "skippedNoCustomerMatch" };
  }

  if (candidates.length > 1) {
    return { action: "SKIP", reason: "skippedAmbiguous" };
  }

  const customer = candidates[0];
  if (customer.deactivatedAt) {
    return { action: "SKIP", reason: "skippedDeactivatedCustomer" };
  }

  return {
    action: "LINK",
    customerId: customer.id,
    emailMasked: maskEmail(normalizedEmail),
    emailHash: hashEmail(normalizedEmail),
  };
}

function createInitialSummary(): BackfillSummary {
  return {
    scanned: 0,
    eligible: 0,
    linked: 0,
    skippedNoEmail: 0,
    skippedNoCustomerMatch: 0,
    skippedAlreadyLinked: 0,
    skippedDeactivatedCustomer: 0,
    skippedAmbiguous: 0,
    errors: 0,
  };
}

function buildArtifactPath(reportDir: string, runId: string, kind: "apply" | "dry-run" | "rollback") {
  return path.join(reportDir, `${kind}-${runId}.json`);
}

async function ensureReportDir(reportDir: string) {
  await mkdir(reportDir, { recursive: true });
}

async function writeJsonFile(filePath: string, payload: unknown) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function fetchOrderCandidates(
  prisma: PrismaClient,
  options: Required<Pick<RunCustomerOrderBackfillOptions, "batchSize">> & {
    before: Date;
    limit?: number;
    orderCode?: string;
    customerEmail?: string;
  }
) {
  return prisma.order.findMany({
    where: {
      customerId: null,
      createdAt: { lt: options.before },
      ...(options.orderCode ? { orderCode: options.orderCode } : {}),
      ...(options.customerEmail
        ? { customerEmail: normalizeEmail(options.customerEmail) }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(options.limit ?? options.batchSize, options.batchSize),
    select: {
      id: true,
      orderCode: true,
      customerEmail: true,
      customerId: true,
      createdAt: true,
    },
  });
}

async function applyMutations(prisma: PrismaClient, mutations: BackfillOrderMutation[]) {
  const results = {
    linked: 0,
    errors: 0,
    skippedMismatch: 0,
  };

  for (const mutation of mutations) {
    try {
      const writeResult = await prisma.order.updateMany({
        where: {
          id: mutation.orderId,
          customerId: mutation.previousCustomerId,
        },
        data: {
          customerId: mutation.newCustomerId,
        },
      });

      if (writeResult.count === 1) {
        results.linked += 1;
      } else {
        results.skippedMismatch += 1;
      }
    } catch {
      results.errors += 1;
    }
  }

  return results;
}

async function fetchCustomerLookup(prisma: PrismaClient, emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, BackfillCustomerCandidate[]>();
  }

  const rows = await prisma.customer.findMany({
    where: {
      email: {
        in: emails,
      },
    },
    select: {
      id: true,
      email: true,
      deactivatedAt: true,
    },
  });

  const lookup = new Map<string, BackfillCustomerCandidate[]>();
  for (const row of rows) {
    const key = normalizeEmail(row.email);
    if (!key) {
      continue;
    }
    const existing = lookup.get(key) ?? [];
    existing.push(row);
    lookup.set(key, existing);
  }
  return lookup;
}

export async function runCustomerOrderBackfill(
  prisma: PrismaClient,
  options: RunCustomerOrderBackfillOptions
): Promise<RunCustomerOrderBackfillResult> {
  const before = options.before ?? DEFAULT_B5_CUTOFF;
  const batchSize = options.batchSize ?? DEFAULT_B5_BATCH_SIZE;
  const reportDir = options.reportDir ?? DEFAULT_B5_REPORT_DIR;
  const runId = options.runId ?? randomUUID();

  if (options.mode === "apply" && options.confirm !== BACKFILL_CONFIRMATION_TEXT) {
    throw new Error(`Apply mode requires --confirm "${BACKFILL_CONFIRMATION_TEXT}"`);
  }

  await ensureReportDir(reportDir);

  const summary = createInitialSummary();
  const decisions: BackfillDecisionRow[] = [];
  const mutations: BackfillOrderMutation[] = [];
  const db = deriveDatabaseIdentity(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

  const orders = await fetchOrderCandidates(prisma, {
    before,
    limit: options.limit,
    orderCode: options.orderCode,
    customerEmail: options.customerEmail,
    batchSize,
  });

  summary.scanned = orders.length;
  summary.eligible = orders.length;

  const normalizedEmails = Array.from(
    new Set(
      orders
        .map((order) => normalizeEmail(order.customerEmail))
        .filter((value): value is string => Boolean(value))
    )
  );

  const customerLookup = await fetchCustomerLookup(prisma, normalizedEmails);

  for (const order of orders) {
    const decision = decideCustomerOrderBackfill(order, customerLookup);

    if (decision.action === "LINK") {
      summary.linked += 1;
      decisions.push({
        orderId: order.id,
        orderCode: order.orderCode,
        action: "LINK",
        reason: "matched_exact_email",
        emailMasked: decision.emailMasked,
        emailHash: decision.emailHash,
        customerId: decision.customerId,
      });

      mutations.push({
        orderId: order.id,
        orderCode: order.orderCode,
        previousCustomerId: order.customerId,
        newCustomerId: decision.customerId,
        emailMasked: decision.emailMasked,
        emailHash: decision.emailHash,
      });
      continue;
    }

    summary[decision.reason] += 1;
    decisions.push({
      orderId: order.id,
      orderCode: order.orderCode,
      action: "SKIP",
      reason: decision.reason,
      emailMasked: normalizeEmail(order.customerEmail)
        ? maskEmail(normalizeEmail(order.customerEmail) as string)
        : null,
      emailHash: normalizeEmail(order.customerEmail)
        ? hashEmail(normalizeEmail(order.customerEmail) as string)
        : null,
      customerId: null,
    });
  }

  if (options.mode === "apply" && mutations.length > 0) {
    const applyResult = await applyMutations(prisma, mutations);
    summary.linked = applyResult.linked;
    summary.skippedAlreadyLinked += applyResult.skippedMismatch;
    summary.errors += applyResult.errors;
  }

  let artifactPath: string | null = null;
  if (options.mode === "apply") {
    artifactPath = buildArtifactPath(reportDir, runId, "apply");
    const artifact: CustomerOrderBackfillArtifact = {
      kind: "customer-order-backfill",
      runId,
      mode: "apply",
      generatedAt: new Date().toISOString(),
      before: before.toISOString(),
      summary,
      db,
      mutations,
    };
    await writeJsonFile(artifactPath, artifact);
  } else {
    artifactPath = buildArtifactPath(reportDir, runId, "dry-run");
    const artifact: CustomerOrderBackfillDryRunArtifact = {
      kind: "customer-order-backfill-dry-run",
      runId,
      generatedAt: new Date().toISOString(),
      before: before.toISOString(),
      db,
      summary,
      decisions,
    };
    await writeJsonFile(artifactPath, artifact);
  }

  return {
    runId,
    mode: options.mode,
    before: before.toISOString(),
    db,
    summary,
    decisions,
    artifactPath,
  };
}

export async function rollbackCustomerOrderBackfill(
  prisma: PrismaClient,
  options: RollbackCustomerOrderBackfillOptions
): Promise<RollbackCustomerOrderBackfillResult> {
  const reportDir = options.reportDir ?? DEFAULT_B5_REPORT_DIR;
  if (options.confirm !== BACKFILL_CONFIRMATION_TEXT) {
    throw new Error(`Rollback requires --confirm "${BACKFILL_CONFIRMATION_TEXT}"`);
  }

  const artifactPath = buildArtifactPath(reportDir, options.runId, "apply");
  const raw = await readFile(artifactPath, "utf8");
  const applyArtifact = JSON.parse(raw) as CustomerOrderBackfillArtifact;

  const summary: RollbackSummary = {
    scanned: applyArtifact.mutations.length,
    restored: 0,
    skippedMismatch: 0,
    skippedMissingOrder: 0,
    errors: 0,
  };

  for (const mutation of applyArtifact.mutations) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: mutation.orderId },
        select: { id: true, customerId: true },
      });

      if (!order) {
        summary.skippedMissingOrder += 1;
        continue;
      }

      if (order.customerId !== mutation.newCustomerId) {
        summary.skippedMismatch += 1;
        continue;
      }

      await prisma.order.update({
        where: { id: mutation.orderId },
        data: { customerId: mutation.previousCustomerId },
      });
      summary.restored += 1;
    } catch {
      summary.errors += 1;
    }
  }

  const rollbackArtifactPath = buildArtifactPath(reportDir, options.runId, "rollback");
  const rollbackArtifact: CustomerOrderBackfillRollbackArtifact = {
    kind: "customer-order-backfill-rollback",
    runId: options.runId,
    generatedAt: new Date().toISOString(),
    summary,
    sourceArtifactPath: artifactPath,
  };
  await writeJsonFile(rollbackArtifactPath, rollbackArtifact);

  return {
    runId: options.runId,
    summary,
    artifactPath: rollbackArtifactPath,
  };
}

export const customerOrderBackfillInternals = {
  normalizeEmail,
  maskEmail,
  hashEmail,
  fetchOrderCandidates,
  fetchCustomerLookup,
  applyMutations,
};
