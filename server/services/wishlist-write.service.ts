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
import { logWishlistQueueEventFailure } from "@/server/observability/wishlist-events";
import { publishWishlistProjectionEvent } from "@/server/services/wishlist-queue.service";

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

type WishlistProjectionPublishEvent = {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function createOrResolveExistingWishlistItem(params: {
  tx: Parameters<WishlistRepository["findItemByIdentityAndProduct"]>[0];
  command: WishlistSaveCommand;
  existing: WishlistCanonicalItem | null;
  itemData: ReturnType<typeof buildWishlistCreateInput>;
  repository: WishlistRepository;
}): Promise<{ item: WishlistCanonicalItem; created: boolean }> {
  if (params.existing) {
    const item = await params.repository.updateWishlistItem(params.tx, params.existing.id, params.itemData);
    return { item, created: false };
  }

  try {
    const item = await params.repository.createWishlistItem(
      params.tx,
      toCreateData(params.command, params.itemData)
    );
    return { item, created: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const concurrentExisting = await params.repository.findItemByIdentityAndProduct(
      params.tx,
      params.command.identity,
      params.command.productId
    );
    if (!concurrentExisting) {
      throw error;
    }

    const item = await params.repository.updateWishlistItem(
      params.tx,
      concurrentExisting.id,
      params.itemData
    );
    return { item, created: false };
  }
}

async function transferOrDeduplicateGuestItem(params: {
  tx: Parameters<WishlistRepository["findItemByIdentityAndProduct"]>[0];
  guestItem: WishlistCanonicalItem;
  customerId: string;
  customerByProductId: Map<string, WishlistCanonicalItem>;
  now: Date;
  repository: WishlistRepository;
}): Promise<"transferred" | "deduplicated"> {
  try {
    const transferred = await params.repository.updateWishlistItem(params.tx, params.guestItem.id, {
      customerId: params.customerId,
      guestTokenHash: null,
      lastInteractedAt:
        params.guestItem.lastInteractedAt > params.now ? params.guestItem.lastInteractedAt : params.now,
    });
    params.customerByProductId.set(params.guestItem.productId, transferred);
    return "transferred";
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const [concurrentCustomerItem] = await params.repository.listCustomerItemsByProductIds(
      params.tx,
      params.customerId,
      [params.guestItem.productId]
    );
    if (!concurrentCustomerItem) {
      throw error;
    }

    const mergedData = mergeWishlistItems({
      customerItem: concurrentCustomerItem,
      guestItem: params.guestItem,
    });

    const updatedCustomer = await params.repository.updateWishlistItem(
      params.tx,
      concurrentCustomerItem.id,
      mergedData
    );
    await params.repository.deleteWishlistItem(params.tx, params.guestItem.id);
    params.customerByProductId.set(params.guestItem.productId, updatedCustomer);
    return "deduplicated";
  }
}

function toProjectionQueueMessage(event: WishlistProjectionPublishEvent) {
  return {
    eventOutboxId: event.id,
    eventType: event.eventType,
    aggregateId: event.aggregateId,
    wishlistItemId:
      typeof event.payload.wishlistItemId === "string" ? event.payload.wishlistItemId : undefined,
  };
}

async function publishProjectionEventsAfterCommit(
  events: WishlistProjectionPublishEvent[],
  context: { requestId?: string | null; customerId?: string | null }
) {
  for (const event of events) {
    try {
      await publishWishlistProjectionEvent(toProjectionQueueMessage(event));
    } catch (error) {
      logWishlistQueueEventFailure({
        event: "wishlist.queue.publish_failed",
        requestId: context.requestId ?? null,
        customerId: context.customerId ?? null,
        reasonCode: error instanceof Error ? error.message : "WISHLIST_QUEUE_PUBLISH_FAILED",
        eventOutboxId: event.id,
      });
    }
  }
}

export async function saveWishlistItem(
  command: WishlistSaveCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistSaveResult> {
  const now = command.now ?? new Date();

  const transactionResult = await dependencies.repository.transaction(async (tx) => {
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

    const { item, created } = await createOrResolveExistingWishlistItem({
      tx,
      command,
      existing,
      itemData,
      repository: dependencies.repository,
    });

    const outboxEvent = await dependencies.repository.insertOutboxEvent(
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
          created,
        },
      })
    );

    return {
      item,
      created,
      outboxEvents: [outboxEvent],
    };
  });

  await publishProjectionEventsAfterCommit(transactionResult.outboxEvents, {
    customerId: command.identity.kind === "customer" ? command.identity.customerId : null,
  });

  return {
    item: transactionResult.item,
    created: transactionResult.created,
  };
}

export async function removeWishlistItem(
  command: WishlistRemoveCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistRemoveResult> {
  const transactionResult = await dependencies.repository.transaction(async (tx) => {
    const existing = await dependencies.repository.findItemByIdentityAndProduct(
      tx,
      command.identity,
      command.productId
    );

    if (!existing) {
      return {
        removed: false,
        removedItemId: null,
        outboxEvents: [] as WishlistProjectionPublishEvent[],
      };
    }

    const outboxEvent = await dependencies.repository.insertOutboxEvent(
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
      outboxEvents: [outboxEvent],
    };
  });

  await publishProjectionEventsAfterCommit(transactionResult.outboxEvents, {
    customerId: command.identity.kind === "customer" ? command.identity.customerId : null,
  });

  return {
    removed: transactionResult.removed,
    removedItemId: transactionResult.removedItemId,
  };
}

export async function updateWishlistPreferences(
  command: WishlistUpdatePreferencesCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistCanonicalItem> {
  const now = command.now ?? new Date();

  const transactionResult = await dependencies.repository.transaction(async (tx) => {
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

    const outboxEvent = await dependencies.repository.insertOutboxEvent(
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

    return { item: updated, outboxEvents: [outboxEvent] };
  });

  await publishProjectionEventsAfterCommit(transactionResult.outboxEvents, {
    customerId: command.identity.kind === "customer" ? command.identity.customerId : null,
  });

  return transactionResult.item;
}

export async function mergeGuestWishlistIntoCustomer(
  command: WishlistMergeCommand,
  dependencies: WishlistWriteServiceDependencies = defaultDependencies
): Promise<WishlistMergeResult> {
  const now = command.now ?? new Date();

  const transactionResult = await dependencies.repository.transaction(async (tx) => {
    const guestItems = await dependencies.repository.listGuestItems(tx, command.guestTokenHash);
    if (guestItems.length === 0) {
      return {
        mergedCount: 0,
        transferredCount: 0,
        deduplicatedCount: 0,
        outboxEvents: [] as WishlistProjectionPublishEvent[],
      };
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
        const result = await transferOrDeduplicateGuestItem({
          tx,
          guestItem,
          customerId: command.customerId,
          customerByProductId,
          now,
          repository: dependencies.repository,
        });
        const resolvedCustomerItem = customerByProductId.get(guestItem.productId);
        if (!resolvedCustomerItem) {
          throw new AppError("Wishlist merge failed to resolve customer item.", 500, "WISHLIST_MERGE_FAILED");
        }
        if (result === "transferred") {
          transferredCount += 1;
        } else {
          deduplicatedCount += 1;
          removedGuestItemIds.push(guestItem.id);
        }
        mergedItemIds.add(resolvedCustomerItem.id);
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
    const outboxEvents: WishlistProjectionPublishEvent[] = [];
    if (mergedCount > 0) {
      const outboxEvent = await dependencies.repository.insertOutboxEvent(
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
      outboxEvents.push(outboxEvent);
    }

    return {
      mergedCount,
      transferredCount,
      deduplicatedCount,
      outboxEvents,
    };
  });

  await publishProjectionEventsAfterCommit(transactionResult.outboxEvents, {
    customerId: command.customerId,
  });

  return {
    mergedCount: transactionResult.mergedCount,
    transferredCount: transactionResult.transferredCount,
    deduplicatedCount: transactionResult.deduplicatedCount,
  };
}
