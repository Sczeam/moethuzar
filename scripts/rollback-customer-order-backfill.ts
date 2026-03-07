import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  BACKFILL_CONFIRMATION_TEXT,
  deriveDatabaseIdentity,
  rollbackCustomerOrderBackfill,
} from "../server/ops/customer-order-backfill";

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printUsage() {
  console.log(`
Usage:
  pnpm ops:rollback-customer-order-backfill --run-id <uuid> --confirm "${BACKFILL_CONFIRMATION_TEXT}"

Optional flags:
  --report-dir <path>           Override artifact directory
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    printUsage();
    return;
  }

  const runId = readFlag(argv, "--run-id");
  const confirm = readFlag(argv, "--confirm");
  const reportDir = readFlag(argv, "--report-dir");

  if (!runId) {
    throw new Error("--run-id is required");
  }

  if (confirm !== BACKFILL_CONFIRMATION_TEXT) {
    throw new Error(`Rollback requires --confirm "${BACKFILL_CONFIRMATION_TEXT}"`);
  }

  const db = deriveDatabaseIdentity(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
  console.log("Customer order backfill rollback");
  console.log(`Database host: ${db.host ?? "unknown"}`);
  console.log(`Database name: ${db.database ?? "unknown"}`);
  console.log(`Run ID: ${runId}`);

  const result = await rollbackCustomerOrderBackfill(prisma, {
    runId,
    reportDir,
    confirm,
  });

  console.log("Summary:");
  console.table(result.summary);
  console.log(`Artifact: ${result.artifactPath}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
