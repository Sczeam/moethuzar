import { handleCallback } from "@vercel/queue";
import { logWishlistQueueEventFailure } from "@/server/observability/wishlist-events";
import { processWishlistOutboxEventById } from "@/server/services/wishlist-projector.service";
import { isWishlistQueueEnabled, type WishlistProjectionQueueMessage } from "@/server/services/wishlist-queue.service";

export const runtime = "nodejs";

const RETRY_AFTER_SECONDS = 60;

export const POST = handleCallback<WishlistProjectionQueueMessage>(
  async (message) => {
    if (!isWishlistQueueEnabled()) {
      return;
    }

    try {
      await processWishlistOutboxEventById(message.eventOutboxId);
    } catch (error) {
      const reasonCode = error instanceof Error ? error.message : "WISHLIST_QUEUE_CONSUMER_FAILED";
      logWishlistQueueEventFailure({
        event: "wishlist.queue.consumer_failed",
        requestId: null,
        reasonCode,
        eventOutboxId: message.eventOutboxId,
      });
      throw error;
    }
  },
  {
    retry: () => ({ afterSeconds: RETRY_AFTER_SECONDS }),
  }
);

