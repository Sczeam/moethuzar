# Admin Microcopy Source-of-Truth Contract (A7.1)

This document defines how admin-facing copy is sourced so wording stays consistent as the admin panel grows.

## Scope
- Shared contract module: `lib/admin/microcopy-contract.ts`
- Current consumers:
  - `lib/admin/settings-copy.ts`
  - `/admin/shipping-rules`
  - `/admin/payment-transfer-methods`

## Contract Rules
- UI components should consume copy objects/constants, not hardcoded inline strings.
- Repeated CRUD wording (create/edit/current sections, loading/empty, form button text, fallback errors) should be generated from the shared copy factory.
- Resource-specific text (for example, health panel labels) remains in feature modules but should reuse the same tone.

## Factory API
- `createResourceCrudCopy(options)` returns a structured copy object for one admin resource.
- Required options:
  - `singular`, `plural`
  - `createVerb`
  - `editSectionVerb`
  - `editSubmitVerb`
  - `createdVerbPast`, `updatedVerbPast`
  - `deletedLabel`, `emptyStateText`

## Voice and Tone
- Keep copy short and action-oriented.
- Use plain language first; avoid backend terms or implementation details.
- Prefer explicit action prompts over generic failure text.

## Extension Guidance
- Add new module copy by composing:
  1. shared microcopy factory for CRUD baseline
  2. module-specific labels and guidance
- Do not modify existing consumer code when adding new module copy blocks; add new constants/modules instead.

## SOLID Mapping
- SRP: copy strategy is isolated from rendering and business logic.
- OCP: new copy surfaces extend via new constants/factory calls without rewriting consumers.
- DIP: UI depends on copy abstractions rather than string literals.
