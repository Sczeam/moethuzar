import "dotenv/config";
import { prisma } from "../lib/prisma";
import { rebuildWishlistItemViews } from "../server/services/wishlist-projector.service";

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

async function main() {
  const argv = process.argv.slice(2);
  const batchSizeValue = readFlag(argv, "--batch-size");
  const batchSize = batchSizeValue ? Number(batchSizeValue) : undefined;

  if (typeof batchSize === "number" && (!Number.isInteger(batchSize) || batchSize <= 0)) {
    throw new Error("--batch-size must be a positive integer");
  }

  const result = await rebuildWishlistItemViews({ batchSize });

  console.log("Wishlist view rebuild complete");
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
