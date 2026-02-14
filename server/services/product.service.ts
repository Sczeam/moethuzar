import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function listActiveProducts() {
  return prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getActiveProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      status: ProductStatus.ACTIVE,
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
