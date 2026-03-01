# Admin Microcopy QA Matrix (A7.5)

Parent issue: #81  
Sub-issue: #184

## Purpose
Provide a single regression-ready QA source for admin microcopy consistency across Settings, Orders, and Catalog.

## Scope
- Labels and navigation/action wording
- Helper/supporting text
- Validation feedback
- Error and retry copy
- High-risk action confirmation wording

## Source-of-Truth References
- Copy contract baseline: `docs/admin-a7-copy-contract-a7-1.md`
- Validation copy contract: `docs/admin-a7-validation-copy-a7-2.md`
- Error presenter contract: `docs/admin-a7-error-presenter-a7-3.md`
- Orders copy module: `lib/admin/orders-copy.ts`
- Catalog copy module: `lib/admin/catalog-copy.ts`
- Settings copy modules:
  - `lib/admin/settings-copy.ts`
  - `lib/admin/validation-copy.ts`

---

## QA Matrix

| Area | Surface | Copy Type | Source | Acceptance Check | Status |
|---|---|---|---|---|---|
| Settings | Shipping Rules | Section labels + field labels | `lib/admin/settings-copy.ts` | Labels are action-oriented, no backend terms | [ ] |
| Settings | Shipping Rules | Validation text | `lib/admin/validation-copy.ts` | Required/format/length messages reference exact field | [ ] |
| Settings | Shipping Rules | API error fallback + request-id formatting | `lib/admin/error-presenter.ts` | User sees actionable message; request id shown when configured | [ ] |
| Settings | Payment Transfer Methods | Section labels + status text | `lib/admin/settings-copy.ts` | Status and helper copy matches panel behavior | [ ] |
| Settings | Payment Transfer Methods | Validation text | `lib/admin/validation-copy.ts` | All exposed inputs show consistent validation tone | [ ] |
| Settings | Payment Transfer Methods | API error fallback + conflicts | `lib/admin/error-presenter.ts` | Conflict/validation errors are clear and recoverable | [ ] |
| Orders | Order detail navigation/actions | Labels/buttons | `lib/admin/orders-copy.ts` | Buttons and actions use copy constants only | [ ] |
| Orders | Customer/payment/info sections | Helper/section text | `lib/admin/orders-copy.ts` | Payment state wording aligns with order/payment status | [ ] |
| Orders | Action modal | Required/optional note copy | `lib/admin/orders-copy.ts` | Required-note message appears only for required actions | [ ] |
| Orders | Action failures | Error feedback and retry | `lib/admin/error-presenter.ts` + `app/admin/orders/[orderId]/action-feedback.ts` | Retry only for retryable failures; stale-state copy is warning-level | [ ] |
| Catalog | Create/Edit wizard | Step labels + review helper | `lib/admin/catalog-copy.ts` | Step copy is concise and consistent across create/edit | [ ] |
| Catalog | Upload queue | Upload status/errors | `lib/admin/catalog-copy.ts` | Upload errors map to clear recovery guidance | [ ] |
| Catalog | Draft validation | Step-hint + blocking text | `lib/admin/catalog-copy.ts` + `lib/admin/error-presenter.ts` | User is directed to correct step when validation fails | [ ] |
| Catalog | Create/Update/Inventory actions | Success + failure copy | `lib/admin/catalog-copy.ts` | Outcome text names action and target clearly | [ ] |
| Catalog | Category + matrix generation | Validation/fallback copy | `lib/admin/catalog-copy.ts` | Category/matrix errors use consistent tone and include first issue when available | [ ] |

---

## Acceptance Checklist (Voice, Clarity, Consistency)

### Voice and tone
- [ ] Copy is plain-language and action-oriented.
- [ ] Copy avoids implementation/internal jargon.
- [ ] Copy style is consistent between Settings, Orders, and Catalog.

### Action clarity
- [ ] Primary actions are explicit (`Create`, `Update`, `Apply`, `Retry`, etc.).
- [ ] High-risk actions include clear confirmation wording.
- [ ] Success messages state what changed and where relevant include target context.

### Validation clarity
- [ ] Required field messages identify exact field.
- [ ] Format/range/length messages are specific and brief.
- [ ] Validation tone is consistent across modules.

### Error and recovery
- [ ] Fallback errors provide clear next step.
- [ ] Retryable vs non-retryable failures are correctly distinguished.
- [ ] Request-id appears only in configured presenter flows.

### Coverage
- [ ] Settings checks completed.
- [ ] Orders checks completed.
- [ ] Catalog checks completed.

---

## High-Risk Rollout Checklist

### Pre-merge
- [ ] `pnpm -s tsc --noEmit` passes.
- [ ] `pnpm -s lint` passes.
- [ ] QA matrix rows touched by the change are re-verified.
- [ ] PR includes before/after screenshots for changed admin surfaces.

### Post-deploy smoke checks
- [ ] Order action modal: required-note validation and success/failure copy.
- [ ] Payment review transition copy: pending/verified/rejected flows.
- [ ] Catalog publish/save-draft copy and validation step-hints.
- [ ] Settings CRUD success/failure messages for shipping + payment methods.

### Rollback readiness
- [ ] No schema dependency for copy-only changes.
- [ ] Errors observed in production can be correlated by request-id where supported.

---

## PR Validation Note Requirement (A7)
For admin copy-impacting PRs, include this section in PR description:

```md
### Admin Copy QA (A7)
- Modules touched: [Settings / Orders / Catalog]
- QA matrix rows verified: [list row labels]
- Voice/tone checklist: [pass/fail + notes]
- Error/retry validation: [pass/fail + notes]
```
