import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const dbUrl = new URL(connectionString);
  if (
    dbUrl.searchParams.get("sslmode") === "require" &&
    !dbUrl.searchParams.has("uselibpqcompat")
  ) {
    dbUrl.searchParams.set("uselibpqcompat", "true");
  }

  const sslBypass = process.env.PGSSL_REJECT_UNAUTHORIZED === "false";
  const pool = new Pool({
    connectionString: dbUrl.toString(),
    max: 5,
    ssl: sslBypass ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const categories = [
    { name: "T-Shirts", slug: "t-shirts" },
    { name: "Hoodies", slug: "hoodies" },
    { name: "Pants", slug: "pants" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  const tshirtCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "t-shirts" },
  });

  const hoodieCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "hoodies" },
  });

  await prisma.product.upsert({
    where: { slug: "essential-tee-black" },
    update: {
      name: "Essential Tee - Black",
      price: "29.00",
      status: ProductStatus.ACTIVE,
      categoryId: tshirtCategory.id,
      images: {
        deleteMany: {},
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            alt: "Essential Tee in black",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        deleteMany: {},
        create: [
          {
            sku: "TEE-BLK-S",
            name: "Black / S",
            color: "Black",
            size: "S",
            price: "29.00",
            inventory: 24,
            isActive: true,
            sortOrder: 1,
          },
          {
            sku: "TEE-BLK-M",
            name: "Black / M",
            color: "Black",
            size: "M",
            price: "29.00",
            inventory: 30,
            isActive: true,
            sortOrder: 2,
          },
          {
            sku: "TEE-BLK-L",
            name: "Black / L",
            color: "Black",
            size: "L",
            price: "29.00",
            inventory: 18,
            isActive: true,
            sortOrder: 3,
          },
        ],
      },
    },
    create: {
      name: "Essential Tee - Black",
      slug: "essential-tee-black",
      description: "Heavyweight cotton tee with relaxed fit.",
      price: "29.00",
      status: ProductStatus.ACTIVE,
      categoryId: tshirtCategory.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            alt: "Essential Tee in black",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "TEE-BLK-S",
            name: "Black / S",
            color: "Black",
            size: "S",
            price: "29.00",
            inventory: 24,
            isActive: true,
            sortOrder: 1,
          },
          {
            sku: "TEE-BLK-M",
            name: "Black / M",
            color: "Black",
            size: "M",
            price: "29.00",
            inventory: 30,
            isActive: true,
            sortOrder: 2,
          },
          {
            sku: "TEE-BLK-L",
            name: "Black / L",
            color: "Black",
            size: "L",
            price: "29.00",
            inventory: 18,
            isActive: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "core-hoodie-sand" },
    update: {
      name: "Core Hoodie - Sand",
      price: "45.00",
      status: ProductStatus.ACTIVE,
      categoryId: hoodieCategory.id,
      images: {
        deleteMany: {},
        create: [
          {
            url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
            alt: "Core Hoodie in sand",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        deleteMany: {},
        create: [
          {
            sku: "HOD-SND-M",
            name: "Sand / M",
            color: "Sand",
            size: "M",
            price: "45.00",
            inventory: 14,
            isActive: true,
            sortOrder: 1,
          },
          {
            sku: "HOD-SND-L",
            name: "Sand / L",
            color: "Sand",
            size: "L",
            price: "45.00",
            inventory: 10,
            isActive: true,
            sortOrder: 2,
          },
        ],
      },
    },
    create: {
      name: "Core Hoodie - Sand",
      slug: "core-hoodie-sand",
      description: "Brushed fleece hoodie for daily wear.",
      price: "45.00",
      status: ProductStatus.ACTIVE,
      categoryId: hoodieCategory.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
            alt: "Core Hoodie in sand",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "HOD-SND-M",
            name: "Sand / M",
            color: "Sand",
            size: "M",
            price: "45.00",
            inventory: 14,
            isActive: true,
            sortOrder: 1,
          },
          {
            sku: "HOD-SND-L",
            name: "Sand / L",
            color: "Sand",
            size: "L",
            price: "45.00",
            inventory: 10,
            isActive: true,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
