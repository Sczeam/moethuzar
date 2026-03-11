import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processWishlistOutboxEventById: vi.fn(),
  logWishlistQueueEventFailure: vi.fn(),
  verifyMode: "pass" as "pass" | "reject",
}));

vi.mock("@/server/services/wishlist-projector.service", () => ({
  processWishlistOutboxEventById: mocks.processWishlistOutboxEventById,
}));

vi.mock("@/server/observability/wishlist-events", () => ({
  logWishlistQueueEventFailure: mocks.logWishlistQueueEventFailure,
}));

vi.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: (handler: (request: Request) => Promise<Response>) => {
    return async (request: Request) => {
      if (mocks.verifyMode === "reject") {
        return new Response(JSON.stringify({ error: "invalid signature" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      return handler(request);
    };
  },
}));

import { POST } from "@/app/api/queues/wishlist-projector/route";

describe("wishlist queue consumer route", () => {
  beforeEach(() => {
    mocks.processWishlistOutboxEventById.mockReset();
    mocks.logWishlistQueueEventFailure.mockReset();
    mocks.verifyMode = "pass";
    process.env.WISHLIST_QSTASH_ENABLED = "true";
    process.env.WISHLIST_QSTASH_ALLOW_PREVIEW = "false";
    process.env.VERCEL_ENV = "production";
    process.env.QSTASH_CURRENT_SIGNING_KEY = "current-key";
    process.env.QSTASH_NEXT_SIGNING_KEY = "next-key";
    process.env.APP_BASE_URL = "https://moethuzar.vercel.app";
  });

  it("processes a qstash message by outbox id", async () => {
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

  it("acknowledges safely when qstash processing is disabled", async () => {
    process.env.WISHLIST_QSTASH_ENABLED = "false";

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

  it("rejects invalid qstash signatures", async () => {
    mocks.verifyMode = "reject";

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

    expect(response.status).toBe(401);
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
        event: "wishlist.qstash.consumer_failed",
        eventOutboxId: "event-1",
        reasonCode: "projection failed",
      })
    );
  });
});
