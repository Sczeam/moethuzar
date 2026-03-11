import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  WishlistProjectionRecord,
  WishlistProjectionSource,
} from "@/server/domain/wishlist-view";

export type WishlistProjectionOutboxEvent = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  availableAt: Date;
  attempts: number;
  processedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WishlistProjectionSourcePage = {
  items: WishlistProjectionSource[];
  nextCursor: string | null;
};

export type WishlistViewListItem = {
  wishlistItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  primaryImageUrl: string | null;
  currentPriceAmount: string;
  savedPriceAmount: string;
  currency: string;
  availabilityState: "AVAILABLE" | "AVAILABLE_WITH_DISCOUNT" | "SOLD_OUT" | "ARCHIVED_PRODUCT";
  preferredVariantAvailabilityState: "NOT_SET" | "AVAILABLE" | "UNAVAILABLE";
  badgeType: "NONE" | "PRICE_DROP" | "LOW_STOCK" | "SOLD_OUT" | "ARCHIVED";
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  lastInteractedAt: Date;
};

export type WishlistViewRepository = {
  findWishlistProjectionSourceByItemId(
    wishlistItemId: string,
    tx?: Prisma.TransactionClient
  ): Promise<WishlistProjectionSource | null>;
  listWishlistProjectionSourcesByItemIds(
    wishlistItemIds: string[],
    tx?: Prisma.TransactionClient
  ): Promise<WishlistProjectionSource[]>;
  listWishlistViewsByIdentity(input: {
    identity:
      | { kind: "customer"; customerId: string }
      | { kind: "guest"; guestTokenHash: string };
    cursor?: { lastInteractedAt: Date; wishlistItemId: string } | null;
    take: number;
  }): Promise<WishlistViewListItem[]>;
  listWishlistProjectionSourcesByProductId(productId: string): Promise<WishlistProjectionSource[]>;
  listWishlistProjectionSourcesByPreferredVariantId(variantId: string): Promise<WishlistProjectionSource[]>;
  findProductIdByVariantId(variantId: string): Promise<string | null>;
  listWishlistProjectionSourcesForRebuild(params?: {
    cursor?: string | null;
    take?: number;
  }): Promise<WishlistProjectionSourcePage>;
  upsertWishlistItemView(record: WishlistProjectionRecord, tx?: Prisma.TransactionClient): Promise<void>;
  deleteWishlistItemView(wishlistItemId: string, tx?: Prisma.TransactionClient): Promise<void>;
  deleteWishlistItemViewsNotInCanonical(tx?: Prisma.TransactionClient): Promise<number>;
  listPendingWishlistOutboxEvents(params?: {
    now?: Date;
    limit?: number;
  }): Promise<WishlistProjectionOutboxEvent[]>;
  markOutboxEventProcessed(eventId: string, processedAt: Date): Promise<void>;
  markOutboxEventFailed(eventId: string, errorMessage: string, nextAttemptAt: Date): Promise<void>;
};

const WISHLIST_OUTBOX_EVENT_TYPES = [
  "wishlist.item.saved",
  "wishlist.item.removed",
  "wishlist.item.preference.updated",
  "wishlist.identity.merged",
] as const;

function mapWishlistProjectionSource(record: {
  id: string;
  customerId: string | null;
  guestTokenHash: string | null;
  productId: string;
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  savedPriceAmount: Prisma.Decimal;
  savedCurrency: string;
  lastInteractedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: Prisma.Decimal;
    currency: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    images: Array<{ url: string }>;
    variants: Array<{
      id: string;
      inventory: number;
      isActive: boolean;
      price: Prisma.Decimal | null;
    }>;
  };
}): WishlistProjectionSource {
  return {
    wishlistItemId: record.id,
    customerId: record.customerId,
    guestTokenHash: record.guestTokenHash,
    productId: record.productId,
    preferredVariantId: record.preferredVariantId,
    preferredColorValue: record.preferredColorValue,
    preferredSizeValue: record.preferredSizeValue,
    savedPriceAmount: record.savedPriceAmount.toFixed(2),
    savedCurrency: record.savedCurrency,
    lastInteractedAt: record.lastInteractedAt,
    product: {
      id: record.product.id,
      name: record.product.name,
      slug: record.product.slug,
      price: record.product.price.toFixed(2),
      currency: record.product.currency,
      status: record.product.status,
      primaryImageUrl: record.product.images[0]?.url ?? null,
      variants: record.product.variants.map((variant) => ({
        id: variant.id,
        inventory: variant.inventory,
        isActive: variant.isActive,
        price: variant.price ? variant.price.toFixed(2) : null,
      })),
    },
  };
}

function mapWishlistViewListItem(record: {
  wishlistItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  primaryImageUrl: string | null;
  currentPriceAmount: Prisma.Decimal;
  savedPriceAmount: Prisma.Decimal;
  currency: string;
  availabilityState: "AVAILABLE" | "AVAILABLE_WITH_DISCOUNT" | "SOLD_OUT" | "ARCHIVED_PRODUCT";
  preferredVariantAvailabilityState: "NOT_SET" | "AVAILABLE" | "UNAVAILABLE";
  badgeType: "NONE" | "PRICE_DROP" | "LOW_STOCK" | "SOLD_OUT" | "ARCHIVED";
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  lastInteractedAt: Date;
}): WishlistViewListItem {
  return {
    ...record,
    currentPriceAmount: record.currentPriceAmount.toFixed(2),
    savedPriceAmount: record.savedPriceAmount.toFixed(2),
  };
}

function projectionSourceSelect() {
  return {
    id: true,
    customerId: true,
    guestTokenHash: true,
    productId: true,
    preferredVariantId: true,
    preferredColorValue: true,
    preferredSizeValue: true,
    savedPriceAmount: true,
    savedCurrency: true,
    lastInteractedAt: true,
    product: {
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        status: true,
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { url: true },
        },
        variants: {
          select: {
            id: true,
            inventory: true,
            isActive: true,
            price: true,
          },
        },
      },
    },
  } satisfies Prisma.WishlistItemSelect;
}

function mapOutboxEvent(record: {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.JsonValue;
  availableAt: Date;
  attempts: number;
  processedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WishlistProjectionOutboxEvent {
  return {
    ...record,
    payload: record.payload as Record<string, unknown>,
  };
}

function toViewCreateInput(record: WishlistProjectionRecord): Prisma.WishlistItemViewUncheckedCreateInput {
  return {
    wishlistItemId: record.wishlistItemId,
    customerId: record.customerId,
    guestTokenHash: record.guestTokenHash,
    productId: record.productId,
    preferredVariantId: record.preferredVariantId,
    preferredColorValue: record.preferredColorValue,
    preferredSizeValue: record.preferredSizeValue,
    productName: record.productName,
    productSlug: record.productSlug,
    primaryImageUrl: record.primaryImageUrl,
    currentPriceAmount: record.currentPriceAmount,
    savedPriceAmount: record.savedPriceAmount,
    currency: record.currency,
    availabilityState: record.availabilityState,
    preferredVariantAvailabilityState: record.preferredVariantAvailabilityState,
    badgeType: record.badgeType,
    lastInteractedAt: record.lastInteractedAt,
    projectedAt: record.projectedAt,
  };
}

function getClient(tx?: Prisma.TransactionClient) {
  return tx ?? prisma;
}

export const prismaWishlistViewRepository: WishlistViewRepository = {
  async findWishlistProjectionSourceByItemId(wishlistItemId, tx) {
    const row = await getClient(tx).wishlistItem.findUnique({
      where: { id: wishlistItemId },
      select: projectionSourceSelect(),
    });

    return row ? mapWishlistProjectionSource(row) : null;
  },

  async listWishlistProjectionSourcesByItemIds(wishlistItemIds, tx) {
    if (wishlistItemIds.length === 0) {
      return [];
    }

    const rows = await getClient(tx).wishlistItem.findMany({
      where: { id: { in: wishlistItemIds } },
      select: projectionSourceSelect(),
    });

    return rows.map(mapWishlistProjectionSource);
  },

  async listWishlistViewsByIdentity({ identity, cursor, take }) {
    const rows = await prisma.wishlistItemView.findMany({
      where: {
        ...(identity.kind === "customer"
          ? { customerId: identity.customerId }
          : { guestTokenHash: identity.guestTokenHash }),
        ...(cursor
          ? {
              OR: [
                { lastInteractedAt: { lt: cursor.lastInteractedAt } },
                {
                  AND: [
                    { lastInteractedAt: cursor.lastInteractedAt },
                    { wishlistItemId: { lt: cursor.wishlistItemId } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: [{ lastInteractedAt: "desc" }, { wishlistItemId: "desc" }],
      take,
      select: {
        wishlistItemId: true,
        productId: true,
        productName: true,
        productSlug: true,
        primaryImageUrl: true,
        currentPriceAmount: true,
        savedPriceAmount: true,
        currency: true,
        availabilityState: true,
        preferredVariantAvailabilityState: true,
        badgeType: true,
        preferredVariantId: true,
        preferredColorValue: true,
        preferredSizeValue: true,
        lastInteractedAt: true,
      },
    });

    return rows.map(mapWishlistViewListItem);
  },

  async listWishlistProjectionSourcesByProductId(productId) {
    const rows = await prisma.wishlistItem.findMany({
      where: { productId },
      select: projectionSourceSelect(),
    });

    return rows.map(mapWishlistProjectionSource);
  },

  async listWishlistProjectionSourcesByPreferredVariantId(variantId) {
    const rows = await prisma.wishlistItem.findMany({
      where: { preferredVariantId: variantId },
      select: projectionSourceSelect(),
    });

    return rows.map(mapWishlistProjectionSource);
  },

  async findProductIdByVariantId(variantId) {
    const row = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });

    return row?.productId ?? null;
  },

  async listWishlistProjectionSourcesForRebuild(params) {
    const take = Math.min(Math.max(params?.take ?? 100, 1), 500);
    const rows = await prisma.wishlistItem.findMany({
      ...(params?.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1,
          }
        : {}),
      orderBy: { id: "asc" },
      take: take + 1,
      select: projectionSourceSelect(),
    });

    const page = rows.slice(0, take).map(mapWishlistProjectionSource);
    return {
      items: page,
      nextCursor: rows.length > take ? page[page.length - 1]?.wishlistItemId ?? null : null,
    };
  },

  async upsertWishlistItemView(record, tx) {
    const client = getClient(tx);
    const data = toViewCreateInput(record);
    await client.wishlistItemView.upsert({
      where: { wishlistItemId: record.wishlistItemId },
      create: data,
      update: data,
    });
  },

  async deleteWishlistItemView(wishlistItemId, tx) {
    await getClient(tx).wishlistItemView.deleteMany({ where: { wishlistItemId } });
  },

  async deleteWishlistItemViewsNotInCanonical(tx) {
    const result = await getClient(tx).$executeRaw`
      DELETE FROM "WishlistItemView" AS view
      WHERE NOT EXISTS (
        SELECT 1
        FROM "WishlistItem" AS item
        WHERE item."id" = view."wishlistItemId"
      )
    `;
    return Number(result);
  },

  async listPendingWishlistOutboxEvents(params) {
    const rows = await prisma.eventOutbox.findMany({
      where: {
        processedAt: null,
        availableAt: { lte: params?.now ?? new Date() },
        eventType: { in: [...WISHLIST_OUTBOX_EVENT_TYPES] },
      },
      orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
      take: Math.min(Math.max(params?.limit ?? 50, 1), 200),
    });

    return rows.map(mapOutboxEvent);
  },

  async markOutboxEventProcessed(eventId, processedAt) {
    await prisma.eventOutbox.update({
      where: { id: eventId },
      data: {
        processedAt,
        lastError: null,
      },
    });
  },

  async markOutboxEventFailed(eventId, errorMessage, nextAttemptAt) {
    await prisma.eventOutbox.update({
      where: { id: eventId },
      data: {
        attempts: { increment: 1 },
        lastError: errorMessage,
        availableAt: nextAttemptAt,
      },
    });
  },
};
