# A5.5 Media Upload UX QA Matrix

Last updated: 2026-02-28
Scope: #156 (Parent #79)

## Automated Checks
- [x] `pnpm -s typecheck`
- [x] `pnpm -s lint` (one pre-existing unrelated warning in `app/admin/orders/[orderId]/page.tsx:223`)

## Desktop Functional Checks
- [ ] Single file upload success
- [ ] Multiple upload success
- [ ] Mixed batch (valid + invalid files) behavior
- [ ] Retry single failed upload
- [ ] Retry all failed uploads
- [ ] Clear completed uploads
- [ ] Remove queued/failed/done upload row
- [ ] Block remove on actively uploading row

## Mobile Functional Checks
- [ ] Drag reorder works by dragging on the image itself
- [ ] Reorder fallback buttons work (`Move Up`, `Move Down`, `Set Primary`)
- [ ] Remove badge (`x`) works and does not trigger accidental drag
- [ ] Tap targets remain usable on narrow screens

## Reorder Integrity Checks
- [ ] Primary image is always index `0`
- [ ] Reorder survives step transitions (`Compose -> Generate -> Compose`)
- [ ] Reorder survives save draft
- [ ] Published payload keeps expected image order

## Error Message Checks
- [ ] Unsupported type shows per-file clear message
- [ ] Oversized file shows per-file clear message with size context
- [ ] Valid files continue upload even when invalid files are present in same batch

## Responsive Layout Checks
- [ ] No overflow in thumbnail rows at mobile width
- [ ] Queue and row actions remain readable at mobile/tablet widths
- [ ] No overlap or clipping with admin shell

## Notes
- This phase also includes a UX fix requested during QA:
  - Image reordering is now initiated by dragging the whole image area (desktop + mobile), not a small dedicated drag badge.
