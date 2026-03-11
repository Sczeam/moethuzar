import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  WishlistCanonicalItem,
  WishlistIdentity,
  WishlistOutboxEventInput,
  WishlistProductSnapshot,
} from "@/server/domain/wishlist-types";

export type WishlistRepository = {
  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  findItemByIdentityAndProduct(
    tx: Prisma.TransactionClient,
    identity: WishlistIdentity,
    productId: string
  ): Promise<WishlistCanonicalItem | null>;
  findItemByIdForIdentity(
    tx: Prisma.TransactionClient,
    identity: WishlistIdentity,
    wishlistItemId: string
  ): Promise<WishlistCanonicalItem | null>;
  getProductSnapshotForSave(
    tx: Prisma.TransactionClient,
    productId: string,
    preferredVariantId?: string | null
  ): Promise<WishlistProductSnapshot | null>;
  createWishlistItem(
    tx: Prisma.TransactionClient,
    data: Prisma.WishlistItemUncheckedCreateInput
  ): Promise<WishlistCanonicalItem>;
  updateWishlistItem(
    tx: Prisma.TransactionClient,
    wishlistItemId: string,
    data: Prisma.WishlistItemUncheckedUpdateInput
  ): Promise<WishlistCanonicalItem>;
  deleteWishlistItem(tx: Prisma.TransactionClient, wishlistItemId: string): Promise<void>;
  listGuestItems(tx: Prisma.TransactionClient, guestTokenHash: string): Promise<WishlistCanonicalItem[]>;
  listCustomerItemsByProductIds(
    tx: Prisma.TransactionClient,
    customerId: string,
    productIds: string[]
  ): Promise<WishlistCanonicalItem[]>;
  listItemsByIdentityAndProductIds(
    identity: WishlistIdentity,
    productIds: string[]
  ): Promise<WishlistCanonicalItem[]>;
  insertOutboxEvent(
    tx: Prisma.TransactionClient,
    event: WishlistOutboxEventInput
  ): Promise<{ id: string; eventType: string; aggregateId: string; payload: Record<string, unknown> }>;
};

function mapWishlistItem(record: {
  id: string;
  customerId: string | null;
  guestTokenHash: string | null;
  productId: string;
  preferredVariantId: string | null;
  preferredColorValue: string | null;
  preferredSizeValue: string | null;
  sourceSurface: string | null;
  savedPriceAmount: Prisma.Decimal;
  savedCurrency: string;
  lastInteractedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): WishlistCanonicalItem {
  return {
    ...record,
    savedPriceAmount: record.savedPriceAmount.toFixed(2),
  };
}

function whereForIdentity(identity: WishlistIdentity): Prisma.WishlistItemWhereInput {
  return identity.kind === "customer"
    ? { customerId: identity.customerId }
    : { guestTokenHash: identity.guestTokenHash };
}

function toProductSnapshot(record: {
  id: string;
  status: ProductStatus;
  price: Prisma.Decimal;
  currency: string;
  variants: Array<{
    id: string;
    productId: string;
    isActive: boolean;
    color: string | null;
    size: string | null;
    price: Prisma.Decimal | null;
  }>;
}): WishlistProductSnapshot {
  const preferredVariant = record.variants[0] ?? null;
  return {
    id: record.id,
    status: record.status,
    price: record.price.toFixed(2),
    currency: record.currency,
    preferredVariant: preferredVariant
      ? {
          id: preferredVariant.id,
          productId: preferredVariant.productId,
          isActive: preferredVariant.isActive,
          color: preferredVariant.color,
          size: preferredVariant.size,
          price: preferredVariant.price ? preferredVariant.price.toFixed(2) : null,
        }
      : null,
  };
}

function baseSelect() {
  return {
    id: true,
    customerId: true,
    guestTokenHash: true,
    productId: true,
    preferredVariantId: true,
    preferredColorValue: true,
    preferredSizeValue: true,
    sourceSurface: true,
    savedPriceAmount: true,
    savedCurrency: true,
    lastInteractedAt: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.WishlistItemSelect;
}

export const prismaWishlistRepository: WishlistRepository = {
  async transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => callback(tx));
  },

  async findItemByIdentityAndProduct(tx, identity, productId) {
    const row = await tx.wishlistItem.findUnique({
      where:
        identity.kind === "customer"
          ? { customerId_productId: { customerId: identity.customerId, productId } }
          : { guestTokenHash_productId: { guestTokenHash: identity.guestTokenHash, productId } },
      select: baseSelect(),
    });

    return row ? mapWishlistItem(row) : null;
  },

  async findItemByIdForIdentity(tx, identity, wishlistItemId) {
    const row = await tx.wishlistItem.findFirst({
      where: {
        id: wishlistItemId,
        ...whereForIdentity(identity),
      },
      select: baseSelect(),
    });

    return row ? mapWishlistItem(row) : null;
  },

  async getProductSnapshotForSave(tx, productId, preferredVariantId) {
    const row = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        price: true,
        currency: true,
        variants: preferredVariantId
          ? {
              where: { id: preferredVariantId },
              take: 1,
              select: {
                id: true,
                productId: true,
                isActive: true,
                color: true,
                size: true,
                price: true,
              },
            }
          : false,
      },
    });

    if (!row) {
      return null;
    }

    return toProductSnapshot({ ...row, variants: Array.isArray(row.variants) ? row.variants : [] });
  },

  async createWishlistItem(tx, data) {
    const row = await tx.wishlistItem.create({
      data,
      select: baseSelect(),
    });
    return mapWishlistItem(row);
  },

  async updateWishlistItem(tx, wishlistItemId, data) {
    const row = await tx.wishlistItem.update({
      where: { id: wishlistItemId },
      data,
      select: baseSelect(),
    });
    return mapWishlistItem(row);
  },

  async deleteWishlistItem(tx, wishlistItemId) {
    await tx.wishlistItem.delete({ where: { id: wishlistItemId } });
  },

  async listGuestItems(tx, guestTokenHash) {
    const rows = await tx.wishlistItem.findMany({
      where: { guestTokenHash },
      orderBy: [{ lastInteractedAt: "desc" }, { id: "desc" }],
      select: baseSelect(),
    });

    return rows.map(mapWishlistItem);
  },

  async listCustomerItemsByProductIds(tx, customerId, productIds) {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await tx.wishlistItem.findMany({
      where: {
        customerId,
        productId: { in: productIds },
      },
      select: baseSelect(),
    });

    return rows.map(mapWishlistItem);
  },

  async listItemsByIdentityAndProductIds(identity, productIds) {
    if (productIds.length === 0) {
      return [];
    }

    const rows = await prisma.wishlistItem.findMany({
      where: {
        ...whereForIdentity(identity),
        productId: { in: productIds },
      },
      select: baseSelect(),
    });

    return rows.map(mapWishlistItem);
  },

  async insertOutboxEvent(tx, event) {
    const row = await tx.eventOutbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload as Prisma.InputJsonValue,
        availableAt: event.availableAt ?? new Date(),
      },
      select: {
        id: true,
        eventType: true,
        aggregateId: true,
        payload: true,
      },
    });

    return {
      id: row.id,
      eventType: row.eventType,
      aggregateId: row.aggregateId,
      payload: row.payload as Record<string, unknown>,
    };
  },
};
