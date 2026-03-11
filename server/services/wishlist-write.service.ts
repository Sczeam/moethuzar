import { ProductStatus } from "@prisma/client";
import { AppError } from "@/server/errors";
import {
  buildWishlistCreateInput,
  buildWishlistPreferenceUpdate,
  mergeWishlistItems,
} from "@/server/domain/wishlist";
import type {
  WishlistCanonicalItem,
  WishlistMergeCommand,
  WishlistMergeResult,
  WishlistOutboxEventInput,
  WishlistRemoveCommand,
  WishlistRemoveResult,
  WishlistSaveCommand,
  WishlistSaveResult,
  WishlistUpdatePreferencesCommand,
} from "@/server/domain/wishlist-types";
import {
  prismaWishlistRepository,
  type WishlistRepository,
} from "@/server/repositories/wishlist.repository";

function assertWishlistProductCanBeSaved(product: { status: ProductStatus | "DRAFT" | "ACTIVE" | "ARCHIVED" }) {
  if (product.status !== ProductStatus.ACTIVE) {
    throw new AppError("Product is not available to save.", 400, "WISHLIST_PRODUCT_NOT_AVAILABLE");
  }
}

function buildWishlistEvent(event: WishlistOutboxEventInput): WishlistOutboxEventInput {
  return event;
}

function toCreateData(command: WishlistSaveCommand, itemData: ReturnType<typeof buildWishlistCreateInput>) {
  return {
    customerId: command.identity.kind === "customer" ? command.identity.customerId : null,
    guestTokenHash: command.identity.kind === "guest" ? command.identity.guestTokenHash : null,
    productId: command.productId,
    preferredVariantId: itemData.preferredVariantId,
    preferredColorValue: itemData.preferredColorValue,
    preferredSizeValue: itemData.preferredSizeValue,
    sourceSurface: itemData.sourceSurface,
    savedPriceAmount: itemData.savedPriceAmount,
    savedCurrency: itemData.savedCurrency,
    lastInteractedAt: itemData.lastInteractedAt,
  };
}

export type WishlistWriteServiceDependencies = {
  repository: WishlistRepository;
};

const defaultDependencies: WishlistWriteServiceDependencies = {
  repository: prismaWishlistRepository,
};

export async function saveWishlistItem(
  command: WishlistSaveCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistSaveResult> {
  const now = command.now ?? new Date();

  return dependencies.repository.transaction(async (tx) => {
    const product = await dependencies.repository.getProductSnapshotForSave(
      tx,
      command.productId,
      command.preferredVariantId ?? null
    );

    if (!product) {
      throw new AppError("Product not found.", 404, "WISHLIST_PRODUCT_NOT_FOUND");
    }

    assertWishlistProductCanBeSaved(product);

    if (command.preferredVariantId && !product.preferredVariant) {
      throw new AppError("Preferred variant not found for product.", 400, "WISHLIST_VARIANT_NOT_FOUND");
    }

    if (product.preferredVariant && !product.preferredVariant.isActive) {
      throw new AppError("Preferred variant is not active.", 400, "WISHLIST_VARIANT_NOT_ACTIVE");
    }

    const existing = await dependencies.repository.findItemByIdentityAndProduct(
      tx,
      command.identity,
      command.productId
    );

    const itemData = buildWishlistCreateInput({
      existing,
      product,
      preferredVariantId: command.preferredVariantId,
      preferredColorValue: command.preferredColorValue,
      preferredSizeValue: command.preferredSizeValue,
      sourceSurface: command.sourceSurface,
      now,
    });

    const item = existing
      ? await dependencies.repository.updateWishlistItem(tx, existing.id, itemData)
      : await dependencies.repository.createWishlistItem(tx, toCreateData(command, itemData));

    await dependencies.repository.insertOutboxEvent(
      tx,
      buildWishlistEvent({
        aggregateType: "wishlist.item",
        aggregateId: item.id,
        eventType: "wishlist.item.saved",
        payload: {
          wishlistItemId: item.id,
          productId: item.productId,
          customerId: item.customerId,
          guestTokenHash: item.guestTokenHash,
          preferredVariantId: item.preferredVariantId,
          preferredColorValue: item.preferredColorValue,
          preferredSizeValue: item.preferredSizeValue,
          sourceSurface: item.sourceSurface,
          savedPriceAmount: item.savedPriceAmount,
          savedCurrency: item.savedCurrency,
          lastInteractedAt: item.lastInteractedAt.toISOString(),
          created: !existing,
        },
      })
    );

    return {
      item,
      created: !existing,
    };
  });
}

export async function removeWishlistItem(
  command: WishlistRemoveCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistRemoveResult> {
  return dependencies.repository.transaction(async (tx) => {
    const existing = await dependencies.repository.findItemByIdentityAndProduct(
      tx,
      command.identity,
      command.productId
    );

    if (!existing) {
      return {
        removed: false,
        removedItemId: null,
      };
    }

    await dependencies.repository.insertOutboxEvent(
      tx,
      buildWishlistEvent({
        aggregateType: "wishlist.item",
        aggregateId: existing.id,
        eventType: "wishlist.item.removed",
        payload: {
          wishlistItemId: existing.id,
          productId: existing.productId,
          customerId: existing.customerId,
          guestTokenHash: existing.guestTokenHash,
        },
      })
    );

    await dependencies.repository.deleteWishlistItem(tx, existing.id);

    return {
      removed: true,
      removedItemId: existing.id,
    };
  });
}

export async function updateWishlistPreferences(
  command: WishlistUpdatePreferencesCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistCanonicalItem> {
  const now = command.now ?? new Date();

  return dependencies.repository.transaction(async (tx) => {
    const existing = await dependencies.repository.findItemByIdForIdentity(
      tx,
      command.identity,
      command.wishlistItemId
    );

    if (!existing) {
      throw new AppError("Wishlist item not found.", 404, "WISHLIST_ITEM_NOT_FOUND");
    }

    if (command.preferredVariantId) {
      const product = await dependencies.repository.getProductSnapshotForSave(
        tx,
        existing.productId,
        command.preferredVariantId
      );
      if (!product?.preferredVariant) {
        throw new AppError("Preferred variant not found for product.", 400, "WISHLIST_VARIANT_NOT_FOUND");
      }
      if (!product.preferredVariant.isActive) {
        throw new AppError("Preferred variant is not active.", 400, "WISHLIST_VARIANT_NOT_ACTIVE");
      }
    }

    const updateData = buildWishlistPreferenceUpdate({
      existing,
      preferredVariantId: command.preferredVariantId,
      preferredColorValue: command.preferredColorValue,
      preferredSizeValue: command.preferredSizeValue,
      sourceSurface: command.sourceSurface,
      now,
    });

    const updated = await dependencies.repository.updateWishlistItem(tx, existing.id, updateData);

    await dependencies.repository.insertOutboxEvent(
      tx,
      buildWishlistEvent({
        aggregateType: "wishlist.item",
        aggregateId: updated.id,
        eventType: "wishlist.item.preference.updated",
        payload: {
          wishlistItemId: updated.id,
          productId: updated.productId,
          preferredVariantId: updated.preferredVariantId,
          preferredColorValue: updated.preferredColorValue,
          preferredSizeValue: updated.preferredSizeValue,
          sourceSurface: updated.sourceSurface,
          lastInteractedAt: updated.lastInteractedAt.toISOString(),
        },
      })
    );

    return updated;
  });
}

export async function mergeGuestWishlistIntoCustomer(
  command: WishlistMergeCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistMergeResult> {
  const now = command.now ?? new Date();

  return dependencies.repository.transaction(async (tx) => {
    const guestItems = await dependencies.repository.listGuestItems(tx, command.guestTokenHash);
    if (guestItems.length === 0) {
      return { mergedCount: 0, transferredCount: 0, deduplicatedCount: 0 };
    }

    const customerItems = await dependencies.repository.listCustomerItemsByProductIds(
      tx,
      command.customerId,
      guestItems.map((item) => item.productId)
    );
    const customerByProductId = new Map(customerItems.map((item) => [item.productId, item]));

    let transferredCount = 0;
    let deduplicatedCount = 0;
    const mergedItemIds = new Set<string>();
    const removedGuestItemIds: string[] = [];

    for (const guestItem of guestItems) {
      const existingCustomerItem = customerByProductId.get(guestItem.productId);

      if (!existingCustomerItem) {
        const transferred = await dependencies.repository.updateWishlistItem(tx, guestItem.id, {
          customerId: command.customerId,
          guestTokenHash: null,
          lastInteractedAt: guestItem.lastInteractedAt > now ? guestItem.lastInteractedAt : now,
        });
        customerByProductId.set(guestItem.productId, transferred);
        transferredCount += 1;
        mergedItemIds.add(transferred.id);
        continue;
      }

      const mergedData = mergeWishlistItems({
        customerItem: existingCustomerItem,
        guestItem,
      });

      const updatedCustomer = await dependencies.repository.updateWishlistItem(
        tx,
        existingCustomerItem.id,
        mergedData
      );
      await dependencies.repository.deleteWishlistItem(tx, guestItem.id);

      customerByProductId.set(guestItem.productId, updatedCustomer);
      deduplicatedCount += 1;
      mergedItemIds.add(updatedCustomer.id);
      removedGuestItemIds.push(guestItem.id);
    }

    const mergedCount = transferredCount + deduplicatedCount;
    if (mergedCount > 0) {
      await dependencies.repository.insertOutboxEvent(
        tx,
        buildWishlistEvent({
          aggregateType: "wishlist.identity",
          aggregateId: command.customerId,
          eventType: "wishlist.identity.merged",
          payload: {
            customerId: command.customerId,
            guestTokenHash: command.guestTokenHash,
            mergedCount,
            transferredCount,
            deduplicatedCount,
            mergedItemIds: Array.from(mergedItemIds),
            removedGuestItemIds,
            mergedAt: now.toISOString(),
          },
        })
      );
    }

    return {
      mergedCount,
      transferredCount,
      deduplicatedCount,
    };
  });
}
