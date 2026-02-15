import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import type { SearchProductsQueryInput } from "@/lib/validation/search";

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

type SearchFacetItem = {
  value: string;
  count: number;
};

type SearchFacets = {
  categories: SearchFacetItem[];
  colors: SearchFacetItem[];
  sizes: SearchFacetItem[];
};

function toFacetList(counter: Map<string, number>): SearchFacetItem[] {
  return Array.from(counter.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function buildSearchWhere(query: SearchProductsQueryInput) {
  const normalizedQuery = query.q.trim();

  const variantFilters: Array<Record<string, unknown>> = [{ isActive: true }];
  if (query.color) {
    variantFilters.push({ color: { equals: query.color, mode: "insensitive" as const } });
  }
  if (query.size) {
    variantFilters.push({ size: { equals: query.size, mode: "insensitive" as const } });
  }
  if (query.inStock === true) {
    variantFilters.push({ inventory: { gt: 0 } });
  }

  const where: Record<string, unknown> = {
    status: ProductStatus.ACTIVE,
  };

  if (query.category) {
    where.category = {
      slug: { equals: query.category, mode: "insensitive" as const },
    };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  if (variantFilters.length > 1) {
    where.variants = {
      some: {
        AND: variantFilters,
      },
    };
  }

  if (normalizedQuery) {
    where.OR = [
      { name: { contains: normalizedQuery, mode: "insensitive" as const } },
      { slug: { contains: normalizedQuery, mode: "insensitive" as const } },
      { description: { contains: normalizedQuery, mode: "insensitive" as const } },
      { category: { name: { contains: normalizedQuery, mode: "insensitive" as const } } },
      {
        variants: {
          some: {
            isActive: true,
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" as const } },
              { sku: { contains: normalizedQuery, mode: "insensitive" as const } },
              { color: { contains: normalizedQuery, mode: "insensitive" as const } },
              { size: { contains: normalizedQuery, mode: "insensitive" as const } },
            ],
          },
        },
      },
    ];
  }

  return where;
}

function buildSearchOrderBy(query: SearchProductsQueryInput) {
  switch (query.sort) {
    case "price_asc":
      return [{ price: "asc" as const }, { createdAt: "desc" as const }, { id: "asc" as const }];
    case "price_desc":
      return [{ price: "desc" as const }, { createdAt: "desc" as const }, { id: "asc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }, { id: "asc" as const }];
    case "relevance":
    default:
      return [{ createdAt: "desc" as const }, { id: "asc" as const }];
  }
}

export async function searchActiveProducts(query: SearchProductsQueryInput) {
  const normalizedQuery = query.q.trim();

  if (!normalizedQuery) {
    return {
      products: [] as Awaited<ReturnType<typeof listActiveProducts>>,
      total: 0,
      page: 1,
      totalPages: 1,
      facets: {
        categories: [],
        colors: [],
        sizes: [],
      } as SearchFacets,
    };
  }

  const where = buildSearchWhere(query);
  const orderBy = buildSearchOrderBy(query);

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const normalizedPage = Math.min(Math.max(1, query.page), totalPages);
  const skip = (normalizedPage - 1) * query.pageSize;

  const [products, facetSeed] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
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
    }),
    prisma.product.findMany({
      where,
      select: {
        category: { select: { slug: true } },
        variants: {
          where: { isActive: true },
          select: {
            color: true,
            size: true,
          },
        },
      },
    }),
  ]);

  const categoryCounter = new Map<string, number>();
  const colorCounter = new Map<string, number>();
  const sizeCounter = new Map<string, number>();

  for (const product of facetSeed) {
    const categorySlug = product.category.slug;
    categoryCounter.set(categorySlug, (categoryCounter.get(categorySlug) ?? 0) + 1);

    for (const variant of product.variants) {
      if (variant.color) {
        colorCounter.set(variant.color, (colorCounter.get(variant.color) ?? 0) + 1);
      }
      if (variant.size) {
        sizeCounter.set(variant.size, (sizeCounter.get(variant.size) ?? 0) + 1);
      }
    }
  }

  const facets: SearchFacets = {
    categories: toFacetList(categoryCounter),
    colors: toFacetList(colorCounter),
    sizes: toFacetList(sizeCounter),
  };

  return {
    products,
    total,
    page: normalizedPage,
    totalPages,
    facets,
  };
}
