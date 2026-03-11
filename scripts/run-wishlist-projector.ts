import "dotenv/config";
import { prisma } from "../lib/prisma";
import { logInfo } from "../lib/observability";
import { processPendingWishlistOutboxEvents } from "../server/services/wishlist-projector.service";

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

async function main() {
  const argv = process.argv.slice(2);
  const limitValue = readFlag(argv, "--limit");
  const limit = limitValue ? Number(limitValue) : undefined;

  if (typeof limit === "number" && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  logInfo({
    event: "wishlist.replay.started",
    limit: limit ?? null,
  });
  const result = await processPendingWishlistOutboxEvents({ limit });
  logInfo({
    event: "wishlist.replay.completed",
    processedCount: result.processedCount,
    succeededCount: result.succeededCount,
    failedCount: result.failedCount,
  });

  console.log("Wishlist projector run complete");
  console.table(result);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
