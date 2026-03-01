# Admin Settings Rollout Checklist (A6.5)

## Pre-release

- Verify admin pages load:
  - `/admin/shipping-rules`
  - `/admin/payment-transfer-methods`
- Verify health panels render and warnings are meaningful.
- Verify create/edit/delete flows in both modules.
- Verify guardrails:
  - fallback shipping safety
  - last-active payment method safety
- Verify API endpoints return expected success/error contracts.

## Operational Smoke (Release Day)

1. Create one temporary shipping rule and delete it.
2. Edit current fallback rule ETA and revert it.
3. Create one temporary payment method and delete it.
4. Edit one existing payment method label and revert it.
5. Confirm checkout quote still resolves for Yangon + fallback location.
6. Confirm prepaid transfer options still render on checkout.

## Rollback / Recovery

If shipping becomes unavailable:
- Ensure at least one **active fallback** rule exists (`OTHER_MYANMAR`).
- Re-activate required key zones:
  - `YANGON`, `MANDALAY`, `PYINMANA`, `NAY_PYI_DAW`, `OTHER_MYANMAR`

If prepaid becomes unavailable:
- Ensure at least one payment transfer method is active.
- Prefer enabling one BANK + one WALLET method for resilience.

If admin forms fail after deploy:
- Check API response for `code` and `requestId`.
- Validate env + DB reachability.
- Re-run smoke checks after fix.

## Ownership

- Product/ops owner: validates business rules and copy clarity.
- Engineer on-call: validates API and guardrails.
- Final sign-off requires both.
