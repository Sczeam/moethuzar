# Wishlist QStash Rollout

## Production intent

- `EventOutbox` remains the durable wishlist async ledger.
- Upstash QStash is the production delivery mechanism for wishlist projection work.
- Local replay and rebuild remain available through:
  - `pnpm ops:wishlist-projector`
  - `pnpm ops:wishlist-rebuild-view`

## Required Upstash setup

1. Create an Upstash QStash project and obtain:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`
2. Set the production application base URL:
   - `APP_BASE_URL=https://<your-production-domain>`
3. Set production environment variables:
   - `WISHLIST_QSTASH_ENABLED=true`
   - `WISHLIST_QSTASH_ALLOW_PREVIEW=false`
4. Configure QStash delivery to post to:
   - `https://<your-production-domain>/api/queues/wishlist-projector`

## Preview behavior

- Preview deployments do not publish wishlist QStash traffic by default.
- To allow preview publishing explicitly, set:
  - `WISHLIST_QSTASH_ENABLED=true`
  - `WISHLIST_QSTASH_ALLOW_PREVIEW=true`
- Consumer verification still depends on valid QStash signing headers, so preview should remain disabled unless you intentionally wire a preview callback URL in QStash.

## Local development

- Local development does not require QStash.
- Keep `WISHLIST_QSTASH_ENABLED=false` locally.
- Use:
  - `pnpm ops:wishlist-projector`
  - `pnpm ops:wishlist-rebuild-view`
- Canonical wishlist writes continue to populate `EventOutbox`, so replay and rebuild remain available without any queue integration.

## Failure model

- If QStash publish fails after canonical wishlist write, the write still succeeds.
- Recovery stays available through `EventOutbox` and the local projector/rebuild scripts.
- QStash consumer failures do not remove recovery options.
- Already processed outbox events are a clean no-op if QStash redelivers the same message.

## Rollback

If QStash adaptation causes trouble:

1. Disable or remove the QStash callback URL.
2. Set `WISHLIST_QSTASH_ENABLED=false`.
3. Keep canonical writes and `EventOutbox` intact.
4. Recover with:
   - `pnpm ops:wishlist-projector`
   - `pnpm ops:wishlist-rebuild-view`

