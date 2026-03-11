import { AppError } from "@/server/errors";
import { deriveWishlistProjection } from "@/server/domain/wishlist-view";
import {
  prismaWishlistViewRepository,
  type WishlistProjectionOutboxEvent,
  type WishlistViewRepository,
} from "@/server/repositories/wishlist-view.repository";

const WISHLIST_PROJECTOR_RETRY_DELAY_MS = 60_000;
const DEFAULT_WISHLIST_PROJECTOR_BATCH_SIZE = 50;
const DEFAULT_WISHLIST_REBUILD_BATCH_SIZE = 100;

export type WishlistProjectorDependencies = {
  repository: WishlistViewRepository;
};

const defaultDependencies: WishlistProjectorDependencies = {
  repository: prismaWishlistViewRepository,
};

export type WishlistProjectorRunResult = {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  failureEventIds: string[];
};

export type WishlistRebuildResult = {
  rebuiltCount: number;
  deletedOrphanCount: number;
};

function getProjectionWishlistItemId(event: WishlistProjectionOutboxEvent): string {
  return typeof event.payload.wishlistItemId === "string" ? event.payload.wishlistItemId : event.aggregateId;
}

function getMergeEventIds(event: WishlistProjectionOutboxEvent, key: "mergedItemIds" | "removedGuestItemIds"): string[] {
  const value = event.payload[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

async function projectWishlistItemById(
  wishlistItemId: string,
  dependencies: WishlistProjectorDependencies,
  projectedAt: Date
): Promise<void> {
  const source = await dependencies.repository.findWishlistProjectionSourceByItemId(wishlistItemId);
  if (!source) {
    await dependencies.repository.deleteWishlistItemView(wishlistItemId);
    return;
  }

  const projection = deriveWishlistProjection(source, projectedAt);
  await dependencies.repository.upsertWishlistItemView(projection);
}

async function handleWishlistOutboxEvent(
  event: WishlistProjectionOutboxEvent,
  dependencies: WishlistProjectorDependencies,
  processedAt: Date
): Promise<void> {
  switch (event.eventType) {
    case "wishlist.item.saved":
    case "wishlist.item.preference.updated": {
      await projectWishlistItemById(getProjectionWishlistItemId(event), dependencies, processedAt);
      return;
    }
    case "wishlist.item.removed": {
      await dependencies.repository.deleteWishlistItemView(getProjectionWishlistItemId(event));
      return;
    }
    case "wishlist.identity.merged": {
      const mergedItemIds = getMergeEventIds(event, "mergedItemIds");
      const removedGuestItemIds = getMergeEventIds(event, "removedGuestItemIds");
      for (const wishlistItemId of mergedItemIds) {
        await projectWishlistItemById(wishlistItemId, dependencies, processedAt);
      }
      for (const wishlistItemId of removedGuestItemIds) {
        await dependencies.repository.deleteWishlistItemView(wishlistItemId);
      }
      return;
    }
    default:
      throw new AppError(`Unsupported wishlist projector event: ${event.eventType}`, 500, "WISHLIST_PROJECTOR_EVENT_UNSUPPORTED");
  }
}

export async function processPendingWishlistOutboxEvents(
  params?: { now?: Date; limit?: number },
  dependencies: WishlistProjectorDependencies = defaultDependencies
): Promise<WishlistProjectorRunResult> {
  const now = params?.now ?? new Date();
  const events = await dependencies.repository.listPendingWishlistOutboxEvents({
    now,
    limit: params?.limit ?? DEFAULT_WISHLIST_PROJECTOR_BATCH_SIZE,
  });

  const failureEventIds: string[] = [];
  let succeededCount = 0;

  for (const event of events) {
    try {
      await handleWishlistOutboxEvent(event, dependencies, now);
      await dependencies.repository.markOutboxEventProcessed(event.id, now);
      succeededCount += 1;
    } catch (error) {
      failureEventIds.push(event.id);
      const message = error instanceof Error ? error.message : "Unexpected projector error";
      await dependencies.repository.markOutboxEventFailed(
        event.id,
        message,
        new Date(now.getTime() + WISHLIST_PROJECTOR_RETRY_DELAY_MS)
      );
    }
  }

  return {
    processedCount: events.length,
    succeededCount,
    failedCount: failureEventIds.length,
    failureEventIds,
  };
}

export async function rebuildWishlistItemViews(
  params?: { now?: Date; batchSize?: number },
  dependencies: WishlistProjectorDependencies = defaultDependencies
): Promise<WishlistRebuildResult> {
  const now = params?.now ?? new Date();
  const batchSize = Math.min(Math.max(params?.batchSize ?? DEFAULT_WISHLIST_REBUILD_BATCH_SIZE, 1), 500);

  let cursor: string | null = null;
  let rebuiltCount = 0;

  while (true) {
    const page = await dependencies.repository.listWishlistProjectionSourcesForRebuild({
      cursor,
      take: batchSize,
    });

    for (const source of page.items) {
      await dependencies.repository.upsertWishlistItemView(deriveWishlistProjection(source, now));
      rebuiltCount += 1;
    }

    if (!page.nextCursor) {
      break;
    }

    cursor = page.nextCursor;
  }

  const deletedOrphanCount = await dependencies.repository.deleteWishlistItemViewsNotInCanonical();
  return { rebuiltCount, deletedOrphanCount };
}

export async function projectCatalogProductUpdated(
  productId: string,
  dependencies: WishlistProjectorDependencies = defaultDependencies,
  projectedAt = new Date()
): Promise<number> {
  const sources = await dependencies.repository.listWishlistProjectionSourcesByProductId(productId);
  for (const source of sources) {
    await dependencies.repository.upsertWishlistItemView(deriveWishlistProjection(source, projectedAt));
  }
  return sources.length;
}

export async function projectCatalogVariantStockChanged(
  variantId: string,
  dependencies: WishlistProjectorDependencies = defaultDependencies,
  projectedAt = new Date()
): Promise<number> {
  const sources = await dependencies.repository.listWishlistProjectionSourcesByPreferredVariantId(variantId);
  for (const source of sources) {
    await dependencies.repository.upsertWishlistItemView(deriveWishlistProjection(source, projectedAt));
  }
  return sources.length;
}

export async function projectPromotionEffectivePriceChanged(
  productId: string,
  dependencies: WishlistProjectorDependencies = defaultDependencies,
  projectedAt = new Date()
): Promise<number> {
  const sources = await dependencies.repository.listWishlistProjectionSourcesByProductId(productId);
  for (const source of sources) {
    await dependencies.repository.upsertWishlistItemView(deriveWishlistProjection(source, projectedAt));
  }
  return sources.length;
}
