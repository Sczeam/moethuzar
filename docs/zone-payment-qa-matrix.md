# Zone Payment QA Matrix

Last updated: 2026-02-21

## Scope

- Zone policy:
  - Yangon -> `COD`
  - Non-Yangon -> `PREPAID_TRANSFER` + payment proof required
- Surfaces:
  - Storefront checkout
  - Order success + tracking
  - Admin orders list + order detail + payment review actions

## Environments

- Local: `http://localhost:3000`
- Preview/Production: Vercel deployment URL
- Database: Supabase Postgres (shared environment in current setup)

## Critical Test Matrix

| ID | Flow | Device | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ZP-01 | Yangon COD happy path | Desktop | Active cart with stock | Checkout with Yangon address, place order | Order created; `paymentMethod=COD`, `paymentStatus=NOT_REQUIRED`; success page loads |
| ZP-02 | Yangon COD policy enforcement | Desktop | Active cart with stock | Force payload `paymentMethod=PREPAID_TRANSFER` | API rejects with `INVALID_PAYMENT_METHOD_FOR_ZONE` |
| ZP-03 | Non-Yangon prepaid happy path | Desktop | Active cart with stock | Choose non-Yangon address, select transfer method, upload proof, place order | Order created; `paymentMethod=PREPAID_TRANSFER`, `paymentStatus=PENDING_REVIEW` |
| ZP-04 | Non-Yangon proof required | Desktop | Non-Yangon quote loaded | Attempt place order without proof | API/UI rejects with payment proof required error |
| ZP-05 | Invalid upload type | Desktop | Non-Yangon quote loaded | Upload unsupported mime file | Upload fails with `INVALID_FILE_TYPE` |
| ZP-06 | Oversized upload | Desktop | Non-Yangon quote loaded | Upload file > 8MB | Upload fails with `FILE_TOO_LARGE` |
| ZP-07 | Signed upload fallback | Desktop | Non-Yangon quote loaded | Simulate signed PUT fail; upload proof | Fallback endpoint succeeds; proof URL stored |
| ZP-08 | Admin sees pending payment | Desktop | At least 1 pending prepaid order | Open `/admin/orders`, filter payment status `PENDING_REVIEW` | Target order visible quickly with payment badge |
| ZP-09 | Verify payment | Desktop | Pending prepaid order exists | Open order detail, click `Approve Payment` | `paymentStatus=VERIFIED`, review history note recorded |
| ZP-10 | Reject payment | Desktop | Pending prepaid order exists | Open order detail, click `Reject Payment` | `paymentStatus=REJECTED`, review history note recorded |
| ZP-11 | Block repeated review | Desktop | Order already VERIFIED or REJECTED | Try second review action via API | API rejects with `PAYMENT_REVIEW_NOT_PENDING` |
| ZP-12 | Tracking visibility | Mobile | Existing prepaid order code | Open `/order/track`, query order code | Customer sees current order/payment state without server error |
| ZP-13 | Regression COD still works | Mobile | Yangon order flow | Place Yangon COD order end-to-end | No regression from prepaid additions |
| ZP-14 | Admin list CSV export | Desktop | Payment-status filtered list | Export CSV with payment filter | CSV includes payment columns and filtered rows |

## Edge Cases

- Missing transfer method code in prepaid reference -> rejected with transfer method error.
- Inactive transfer method selected (stale UI state) -> server rejects.
- Cart converted/expired before payment proof upload -> upload route returns `CART_NOT_FOUND`.

## Pass Criteria

- All critical IDs (`ZP-01` to `ZP-14`) pass on desktop and at least one mobile browser.
- No new `500` errors on checkout/order/admin payment review routes.
- No regressions in existing COD and order status progression.
