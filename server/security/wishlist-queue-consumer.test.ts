import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processWishlistOutboxEventById: vi.fn(),
  logWishlistQueueEventFailure: vi.fn(),
}));

vi.mock("@/server/services/wishlist-projector.service", () => ({
  processWishlistOutboxEventById: mocks.processWishlistOutboxEventById,
}));

vi.mock("@/server/observability/wishlist-events", () => ({
  logWishlistQueueEventFailure: mocks.logWishlistQueueEventFailure,
}));

vi.mock("@vercel/queue", () => ({
  send: vi.fn(async () => ({ messageId: "msg-1" })),
  handleCallback: (handler: (message: unknown) => Promise<void>) => {
    return async (request: Request) => {
      const payload = await request.json();
      try {
        await handler(payload);
        return new Response(null, { status: 202 });
      } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    };
  },
}));

import { POST } from "@/app/api/queues/wishlist-projector/route";

describe("wishlist queue consumer route", () => {
  beforeEach(() => {
    mocks.processWishlistOutboxEventById.mockReset();
    mocks.logWishlistQueueEventFailure.mockReset();
    process.env.WISHLIST_QUEUE_ENABLED = "true";
    process.env.WISHLIST_QUEUE_ALLOW_PREVIEW = "false";
    process.env.VERCEL_ENV = "production";
  });

  it("processes a queue message by outbox id", async () => {
    mocks.processWishlistOutboxEventById.mockResolvedValueOnce({
      status: "processed",
      eventId: "event-1",
    });

    const response = await POST(
      new Request("http://localhost/api/queues/wishlist-projector", {
        method: "POST",
        body: JSON.stringify({
          eventOutboxId: "event-1",
          eventType: "wishlist.item.saved",
          aggregateId: "wishlist-1",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(202);
    expect(mocks.processWishlistOutboxEventById).toHaveBeenCalledWith("event-1");
  });

  it("acknowledges safely when queue processing is disabled", async () => {
    process.env.WISHLIST_QUEUE_ENABLED = "false";

    const response = await POST(
      new Request("http://localhost/api/queues/wishlist-projector", {
        method: "POST",
        body: JSON.stringify({
          eventOutboxId: "event-1",
          eventType: "wishlist.item.saved",
          aggregateId: "wishlist-1",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(202);
    expect(mocks.processWishlistOutboxEventById).not.toHaveBeenCalled();
  });

  it("logs and returns an error response when the consumer fails", async () => {
    mocks.processWishlistOutboxEventById.mockRejectedValueOnce(new Error("projection failed"));

    const response = await POST(
      new Request("http://localhost/api/queues/wishlist-projector", {
        method: "POST",
        body: JSON.stringify({
          eventOutboxId: "event-1",
          eventType: "wishlist.item.saved",
          aggregateId: "wishlist-1",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(500);
    expect(mocks.logWishlistQueueEventFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "wishlist.queue.consumer_failed",
        eventOutboxId: "event-1",
        reasonCode: "projection failed",
      })
    );
  });
});
