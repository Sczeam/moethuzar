import { send } from "@vercel/queue";

export const WISHLIST_PROJECTOR_QUEUE_TOPIC = "wishlist-projector";

export type WishlistProjectionQueueMessage = {
  eventOutboxId: string;
  eventType: string;
  aggregateId: string;
  wishlistItemId?: string;
};

type QueueSendOptions = {
  idempotencyKey?: string;
};

export type WishlistQueueServiceDependencies = {
  sendMessage: (
    topicName: string,
    payload: WishlistProjectionQueueMessage,
    options?: QueueSendOptions
  ) => Promise<{ messageId: string | null }>;
};

const defaultDependencies: WishlistQueueServiceDependencies = {
  sendMessage: send,
};

function isPreviewQueueAllowed() {
  return process.env.WISHLIST_QUEUE_ALLOW_PREVIEW === "true";
}

export function isWishlistQueueEnabled() {
  if (process.env.WISHLIST_QUEUE_ENABLED !== "true") {
    return false;
  }

  if (process.env.VERCEL_ENV === "production") {
    return true;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return isPreviewQueueAllowed();
  }

  return false;
}

export async function publishWishlistProjectionEvent(
  message: WishlistProjectionQueueMessage,
  dependencies: WishlistQueueServiceDependencies = defaultDependencies
) {
  if (!isWishlistQueueEnabled()) {
    return { published: false as const, reason: "DISABLED", messageId: null };
  }

  const result = await dependencies.sendMessage(WISHLIST_PROJECTOR_QUEUE_TOPIC, message, {
    idempotencyKey: message.eventOutboxId,
  });

  return { published: true as const, reason: null, messageId: result.messageId };
}

