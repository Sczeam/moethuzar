# Wishlist Queue Rollout

## Production intent

- `EventOutbox` remains the durable wishlist async ledger.
- Vercel Queues is the production delivery mechanism for wishlist projection work.
- Local replay and rebuild remain available through:
  - `pnpm ops:wishlist-projector`
  - `pnpm ops:wishlist-rebuild-view`

## Required Vercel setup

1. Enable Vercel Queues for the project.
2. Create a queue/topic named `wishlist-projector`.
3. Ensure the deployment includes `vercel.json` trigger configuration.
4. Set production environment variables:
   - `WISHLIST_QUEUE_ENABLED=true`
   - `WISHLIST_QUEUE_ALLOW_PREVIEW=false`

## Preview behavior

- Preview deployments do not publish or consume wishlist queue traffic by default.
- To allow preview queue processing explicitly, set:
  - `WISHLIST_QUEUE_ENABLED=true`
  - `WISHLIST_QUEUE_ALLOW_PREVIEW=true`

## Failure model

- If queue publish fails after canonical wishlist write, the write still succeeds.
- Recovery stays available through `EventOutbox` and the local projector/rebuild scripts.
- Queue consumer failures do not remove recovery options.

## Rollback

If queue adaptation causes trouble:

1. Disable the trigger in `vercel.json` or stop queue consumption in Vercel.
2. Set `WISHLIST_QUEUE_ENABLED=false`.
3. Keep canonical writes and `EventOutbox` intact.
4. Recover with:
   - `pnpm ops:wishlist-projector`
   - `pnpm ops:wishlist-rebuild-view`

