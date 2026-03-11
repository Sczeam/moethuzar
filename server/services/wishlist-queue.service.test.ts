import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isWishlistQstashEnabled,
  publishWishlistProjectionEvent,
} from "@/server/services/wishlist-queue.service";

describe("wishlist-queue.service", () => {
  const originalEnv = {
    WISHLIST_QSTASH_ENABLED: process.env.WISHLIST_QSTASH_ENABLED,
    WISHLIST_QSTASH_ALLOW_PREVIEW: process.env.WISHLIST_QSTASH_ALLOW_PREVIEW,
    VERCEL_ENV: process.env.VERCEL_ENV,
    APP_BASE_URL: process.env.APP_BASE_URL,
  };

  beforeEach(() => {
    process.env.WISHLIST_QSTASH_ENABLED = originalEnv.WISHLIST_QSTASH_ENABLED;
    process.env.WISHLIST_QSTASH_ALLOW_PREVIEW = originalEnv.WISHLIST_QSTASH_ALLOW_PREVIEW;
    process.env.VERCEL_ENV = originalEnv.VERCEL_ENV;
    process.env.APP_BASE_URL = originalEnv.APP_BASE_URL;
  });

  it("disables qstash publishing outside enabled production/preview environments", async () => {
    process.env.WISHLIST_QSTASH_ENABLED = "false";
    process.env.VERCEL_ENV = "production";

    expect(isWishlistQstashEnabled()).toBe(false);

    const publishJson = vi.fn();
    const result = await publishWishlistProjectionEvent(
      {
        eventOutboxId: "event-1",
        eventType: "wishlist.item.saved",
        aggregateId: "wishlist-1",
      },
      { publishJson }
    );

    expect(result).toEqual({ published: false, reason: "DISABLED", messageId: null });
    expect(publishJson).not.toHaveBeenCalled();
  });

  it("publishes to qstash with the outbox id as deduplication key", async () => {
    process.env.WISHLIST_QSTASH_ENABLED = "true";
    process.env.VERCEL_ENV = "production";
    process.env.APP_BASE_URL = "https://moethuzar.vercel.app";

    const publishJson = vi.fn(async () => ({ messageId: "msg-1" }));
    const result = await publishWishlistProjectionEvent(
      {
        eventOutboxId: "event-1",
        eventType: "wishlist.item.saved",
        aggregateId: "wishlist-1",
        wishlistItemId: "wishlist-1",
      },
      { publishJson }
    );

    expect(result).toEqual({ published: true, reason: null, messageId: "msg-1" });
    expect(publishJson).toHaveBeenCalledWith(
      expect.objectContaining({
        eventOutboxId: "event-1",
        wishlistItemId: "wishlist-1",
      }),
      { idempotencyKey: "event-1" }
    );
  });

  it("keeps preview disabled unless explicitly enabled", () => {
    process.env.WISHLIST_QSTASH_ENABLED = "true";
    process.env.VERCEL_ENV = "preview";
    process.env.WISHLIST_QSTASH_ALLOW_PREVIEW = "false";

    expect(isWishlistQstashEnabled()).toBe(false);

    process.env.WISHLIST_QSTASH_ALLOW_PREVIEW = "true";
    expect(isWishlistQstashEnabled()).toBe(true);
  });
});

