# Admin Architecture Reference (OCP-First)

Last updated: 2026-02-24

## Purpose

Define a scalable admin architecture that can grow without repeated shell rewrites.

Primary principle: **Open/Closed Principle (OCP)**  
Supporting principle: **Single Responsibility Principle (SRP)**

---

## 1) Design Goals

- Add new admin modules without changing core shell logic.
- Keep navigation, route registration, and permissions predictable.
- Support phased rollout (hidden/incomplete modules must not confuse users).
- Keep implementation readable for long-term maintenance.

---

## 2) SOLID Mapping (Practical)

### OCP (Primary)

- Admin shell should be open for extension via module registration.
- Core shell should be closed for modification when adding modules.
- New module = new config + routes + pages, not core `if/else` changes.

### SRP (Required)

- `module registry`: defines what exists.
- `navigation builder`: transforms registry to UI menu.
- `access filter`: removes unauthorized/disabled modules.
- `shell renderer`: renders layout only.
- `module pages`: own business behavior only.

### DIP (Optional but recommended)

- Shell depends on `AdminModuleDefinition` abstraction, not concrete pages.

---

## 3) Target IA (Current Scope)

Top-level:

1. Dashboard
2. Orders
3. Catalog
4. Storefront (or Content)
5. Discounts
6. Settings

Secondary (v1):

- Catalog: Products, Categories, Collections, Inventory, Media
- Settings: Shipping, Payments, Staff & Roles, Store Details

Deferred (hidden until real pages exist):

- Reports
- Customers (standalone)
- Marketing integrations

---

## 4) Module Registry Contract

```ts
export type AdminModuleId =
  | "dashboard"
  | "orders"
  | "catalog"
  | "storefront"
  | "discounts"
  | "settings";

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  featureFlag?: string;
  order?: number;
};

export type AdminModuleDefinition = {
  id: AdminModuleId;
  label: string;
  icon?: string;
  order: number;
  enabled: boolean;
  featureFlag?: string;
  primaryHref: string;
  secondaryNav?: AdminNavItem[];
};
```

Rules:

- `order` is explicit; avoid implicit sort.
- `enabled=false` modules are excluded from nav.
- `featureFlag` gates visibility without code deletion.
- All labels use plain language (non-technical operator friendly).

---

## 5) Recommended Folder Structure

```txt
components/admin/
  shell/
    admin-shell.tsx
    admin-sidebar.tsx
    admin-topbar.tsx
    admin-breadcrumbs.tsx
  navigation/
    module-registry.ts
    build-nav.ts
    nav-types.ts
  shared/
    section-card.tsx
    action-bar.tsx
    empty-state.tsx

app/admin/
  layout.tsx
  page.tsx
  orders/
  catalog/
  storefront/
  discounts/
  settings/
```

SRP boundaries:

- `module-registry.ts`: data definitions only.
- `build-nav.ts`: filtering/sorting only.
- `admin-sidebar.tsx`: presentation only.

---

## 6) Route + Page Pattern

- List and create pages must be separate:
  - `.../catalog` (list/manage)
  - `.../catalog/new` (create flow)
  - `.../catalog/[productId]` (edit flow)
- Do not embed full create form under list page.

---

## 7) Feature Flag Strategy

Use flags to avoid dead navigation:

- `admin_reports_enabled`
- `admin_customers_enabled`
- `admin_marketing_integrations_enabled`

If a feature is disabled:

- hide from nav
- direct URL should return safe fallback (not broken page)

---

## 8) Anti-Patterns to Avoid

- Central giant switch that hardcodes every module and subpage.
- Shared “god component” that contains routing + business logic + UI rendering.
- Showing placeholder modules with no actionable page.
- Technical labels (e.g., “variant matrix config”) for non-technical users.

---

## 9) A1 Implementation Checklist

- [ ] Introduce `AdminModuleDefinition` and registry file.
- [ ] Build sidebar from registry (no hardcoded scattered links).
- [ ] Add secondary nav rendering for `Catalog` and `Settings`.
- [ ] Move catalog create flow to separate route if still mixed.
- [ ] Add breadcrumb + page title contract.
- [ ] Ensure labels are plain-language and task-oriented.
- [ ] Hide deferred modules from primary nav.

---

## 10) Definition of Done for A1

- First-time non-technical user can find:
  - Orders
  - Products
  - Shipping
  - Payment methods
  in 2 clicks or less.
- No page mixes list management with full create flow.
- Adding one new module requires:
  - one registry entry
  - module route/page
  - no core-shell rewrite.
