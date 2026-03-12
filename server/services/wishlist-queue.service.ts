import { Client } from "@upstash/qstash";

export type WishlistProjectionQueueMessage = {
  eventOutboxId: string;
  eventType: string;
  aggregateId: string;
  wishlistItemId?: string;
};

export type WishlistQueueServiceDependencies = {
  publishJson: (
    payload: WishlistProjectionQueueMessage,
    options?: { idempotencyKey?: string }
  ) => Promise<{ messageId: string | null }>;
};

function getWishlistProjectorDestinationUrl() {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is required when wishlist QStash delivery is enabled");
  }

  return new URL("/api/queues/wishlist-projector", baseUrl).toString();
}

function createQstashClient() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error("QSTASH_TOKEN is required when wishlist QStash delivery is enabled");
  }

  return new Client({ token });
}

const defaultDependencies: WishlistQueueServiceDependencies = {
  publishJson: async (payload, options) => {
    const client = createQstashClient();
    const response = await client.publishJSON({
      url: getWishlistProjectorDestinationUrl(),
      body: payload,
      headers: {
        "Upstash-Method": "POST",
      },
      deduplicationId: options?.idempotencyKey,
    });

    return { messageId: response.messageId ?? null };
  },
};

function isPreviewQstashAllowed() {
  return process.env.WISHLIST_QSTASH_ALLOW_PREVIEW === "true";
}

export function isWishlistQstashEnabled() {
  if (process.env.WISHLIST_QSTASH_ENABLED !== "true") {
    return false;
  }

  if (process.env.VERCEL_ENV === "production") {
    return true;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return isPreviewQstashAllowed();
  }

  return false;
}

export async function publishWishlistProjectionEvent(
  message: WishlistProjectionQueueMessage,
  dependencies: WishlistQueueServiceDependencies = defaultDependencies
) {
  if (!isWishlistQstashEnabled()) {
    return { published: false as const, reason: "DISABLED", messageId: null };
  }

  const result = await dependencies.publishJson(message, {
    idempotencyKey: message.eventOutboxId,
  });

  return { published: true as const, reason: null, messageId: result.messageId };
}

