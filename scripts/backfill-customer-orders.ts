import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  BACKFILL_CONFIRMATION_TEXT,
  DEFAULT_B5_CUTOFF,
  deriveDatabaseIdentity,
  runCustomerOrderBackfill,
} from "../server/ops/customer-order-backfill";

type ParsedArgs = {
  mode: "dry-run" | "apply";
  before?: Date;
  limit?: number;
  orderCode?: string;
  customerEmail?: string;
  reportDir?: string;
  confirm?: string;
};

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function hasFlag(args: string[], flag: string) {
  return args.includes(flag);
}

function parseArgs(argv: string[]): ParsedArgs {
  const mode = hasFlag(argv, "--apply") ? "apply" : "dry-run";
  const beforeValue = readFlag(argv, "--before");
  const limitValue = readFlag(argv, "--limit");

  return {
    mode,
    before: beforeValue ? new Date(beforeValue) : undefined,
    limit: limitValue ? Number(limitValue) : undefined,
    orderCode: readFlag(argv, "--order-code"),
    customerEmail: readFlag(argv, "--customer-email"),
    reportDir: readFlag(argv, "--report-dir"),
    confirm: readFlag(argv, "--confirm"),
  };
}

function printUsage() {
  console.log(`
Usage:
  pnpm ops:backfill-customer-orders --dry-run
  pnpm ops:backfill-customer-orders --apply --confirm "${BACKFILL_CONFIRMATION_TEXT}"

Optional flags:
  --before <ISO-8601 date>      Override the default cutoff (${DEFAULT_B5_CUTOFF.toISOString()})
  --limit <number>              Limit scanned unlinked orders
  --order-code <order code>     Target a single order code
  --customer-email <email>      Target a single normalized customer email
  --report-dir <path>           Override artifact output directory
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasFlag(argv, "--help")) {
    printUsage();
    return;
  }

  const args = parseArgs(argv);
  if (args.before && Number.isNaN(args.before.valueOf())) {
    throw new Error("--before must be a valid ISO-8601 date");
  }

  if (typeof args.limit === "number" && (!Number.isInteger(args.limit) || args.limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  const db = deriveDatabaseIdentity(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
  console.log("Customer order backfill");
  console.log(`Mode: ${args.mode}`);
  console.log(`Database host: ${db.host ?? "unknown"}`);
  console.log(`Database name: ${db.database ?? "unknown"}`);
  console.log(`Cutoff: ${(args.before ?? DEFAULT_B5_CUTOFF).toISOString()}`);

  if (args.mode === "apply" && args.confirm !== BACKFILL_CONFIRMATION_TEXT) {
    throw new Error(`Apply mode requires --confirm "${BACKFILL_CONFIRMATION_TEXT}"`);
  }

  const result = await runCustomerOrderBackfill(prisma, args);

  console.log("Summary:");
  console.table(result.summary);
  if (result.artifactPath) {
    console.log(`Artifact: ${result.artifactPath}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
