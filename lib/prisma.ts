import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const dbUrl = new URL(rawConnectionString);
if (
  dbUrl.searchParams.get("sslmode") === "require" &&
  !dbUrl.searchParams.has("uselibpqcompat")
) {
  dbUrl.searchParams.set("uselibpqcompat", "true");
}

const sslBypass = process.env.PGSSL_REJECT_UNAUTHORIZED === "false";

const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString: dbUrl.toString(),
    max: 10,
    ssl: sslBypass ? { rejectUnauthorized: false } : undefined,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
