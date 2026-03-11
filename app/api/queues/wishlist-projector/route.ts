import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { logWishlistQueueEventFailure } from "@/server/observability/wishlist-events";
import { processWishlistOutboxEventById } from "@/server/services/wishlist-projector.service";
import { isWishlistQstashEnabled, type WishlistProjectionQueueMessage } from "@/server/services/wishlist-queue.service";

export const runtime = "nodejs";

async function wishlistProjectorHandler(request: Request) {
  if (!isWishlistQstashEnabled()) {
    return Response.json({ ok: true, skipped: true }, { status: 202 });
  }

  const message = (await request.json()) as WishlistProjectionQueueMessage;

  try {
    const result = await processWishlistOutboxEventById(message.eventOutboxId);
    return Response.json({ ok: true, status: result.status }, { status: 202 });
  } catch (error) {
    const reasonCode = error instanceof Error ? error.message : "WISHLIST_QSTASH_CONSUMER_FAILED";
    logWishlistQueueEventFailure({
      event: "wishlist.qstash.consumer_failed",
      requestId: null,
      reasonCode,
      eventOutboxId: message.eventOutboxId,
    });
    return Response.json({ ok: false, code: "WISHLIST_QSTASH_CONSUMER_FAILED" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(wishlistProjectorHandler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  url: process.env.APP_BASE_URL
    ? new URL("/api/queues/wishlist-projector", process.env.APP_BASE_URL).toString()
    : undefined,
  clockTolerance: 5,
});

