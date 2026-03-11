import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isWishlistQueueEnabled,
  publishWishlistProjectionEvent,
  WISHLIST_PROJECTOR_QUEUE_TOPIC,
} from "@/server/services/wishlist-queue.service";

describe("wishlist-queue.service", () => {
  const originalEnv = {
    WISHLIST_QUEUE_ENABLED: process.env.WISHLIST_QUEUE_ENABLED,
    WISHLIST_QUEUE_ALLOW_PREVIEW: process.env.WISHLIST_QUEUE_ALLOW_PREVIEW,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  beforeEach(() => {
    process.env.WISHLIST_QUEUE_ENABLED = originalEnv.WISHLIST_QUEUE_ENABLED;
    process.env.WISHLIST_QUEUE_ALLOW_PREVIEW = originalEnv.WISHLIST_QUEUE_ALLOW_PREVIEW;
    process.env.VERCEL_ENV = originalEnv.VERCEL_ENV;
  });

  it("disables queue publishing outside enabled production/preview environments", async () => {
    process.env.WISHLIST_QUEUE_ENABLED = "false";
    process.env.VERCEL_ENV = "production";

    expect(isWishlistQueueEnabled()).toBe(false);

    const sendMessage = vi.fn();
    const result = await publishWishlistProjectionEvent(
      {
        eventOutboxId: "event-1",
        eventType: "wishlist.item.saved",
        aggregateId: "wishlist-1",
      },
      { sendMessage }
    );

    expect(result).toEqual({ published: false, reason: "DISABLED", messageId: null });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("publishes to the wishlist topic with the outbox id as idempotency key", async () => {
    process.env.WISHLIST_QUEUE_ENABLED = "true";
    process.env.VERCEL_ENV = "production";

    const sendMessage = vi.fn(async () => ({ messageId: "msg-1" }));
    const result = await publishWishlistProjectionEvent(
      {
        eventOutboxId: "event-1",
        eventType: "wishlist.item.saved",
        aggregateId: "wishlist-1",
        wishlistItemId: "wishlist-1",
      },
      { sendMessage }
    );

    expect(result).toEqual({ published: true, reason: null, messageId: "msg-1" });
    expect(sendMessage).toHaveBeenCalledWith(
      WISHLIST_PROJECTOR_QUEUE_TOPIC,
      expect.objectContaining({
        eventOutboxId: "event-1",
        wishlistItemId: "wishlist-1",
      }),
      { idempotencyKey: "event-1" }
    );
  });

  it("keeps preview disabled unless explicitly enabled", () => {
    process.env.WISHLIST_QUEUE_ENABLED = "true";
    process.env.VERCEL_ENV = "preview";
    process.env.WISHLIST_QUEUE_ALLOW_PREVIEW = "false";

    expect(isWishlistQueueEnabled()).toBe(false);

    process.env.WISHLIST_QUEUE_ALLOW_PREVIEW = "true";
    expect(isWishlistQueueEnabled()).toBe(true);
  });
});

