import { readFileSync, existsSync } from "node:fs";

function fail(message) {
  console.error(`A11Y smoke failed: ${message}`);
  process.exitCode = 1;
}

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    fail(`missing file: ${filePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function assertPattern(filePath, source, regex, label) {
  if (!regex.test(source)) {
    fail(`${filePath} missing ${label}`);
  }
}

const requiredDocs = [
  "docs/admin-a8-qa-matrix.md",
  "docs/admin-a8-rollout-checklist.md",
];

for (const docPath of requiredDocs) {
  if (!existsSync(docPath)) {
    fail(`required doc not found: ${docPath}`);
  }
}

const sidebarSource = assertFile("components/admin/shell/admin-sidebar.tsx");
const ordersDetailSource = assertFile("app/admin/orders/[orderId]/page.tsx");
const catalogSource = assertFile("app/admin/catalog/catalog-client.tsx");
const a11yContractSource = assertFile("lib/admin/a11y-contract.ts");
const stateClaritySource = assertFile("lib/admin/state-clarity.ts");

assertPattern(
  "components/admin/shell/admin-sidebar.tsx",
  sidebarSource,
  /useDialogAccessibility/,
  "shared dialog accessibility hook usage",
);
assertPattern(
  "app/admin/orders/[orderId]/page.tsx",
  ordersDetailSource,
  /useDialogAccessibility/,
  "shared dialog accessibility hook usage",
);
assertPattern(
  "app/admin/catalog/catalog-client.tsx",
  catalogSource,
  /useDialogAccessibility/,
  "shared dialog accessibility hook usage",
);

assertPattern(
  "components/admin/shell/admin-sidebar.tsx",
  sidebarSource,
  /aria-modal="true"/,
  "dialog semantics",
);
assertPattern(
  "app/admin/orders/[orderId]/page.tsx",
  ordersDetailSource,
  /aria-modal="true"/,
  "dialog semantics",
);
assertPattern(
  "app/admin/catalog/catalog-client.tsx",
  catalogSource,
  /aria-modal="true"/,
  "dialog semantics",
);

assertPattern(
  "lib/admin/a11y-contract.ts",
  a11yContractSource,
  /export function adminLiveRegionProps/,
  "adminLiveRegionProps export",
);
assertPattern(
  "lib/admin/a11y-contract.ts",
  a11yContractSource,
  /export function adminFieldA11y/,
  "adminFieldA11y export",
);
assertPattern(
  "lib/admin/state-clarity.ts",
  stateClaritySource,
  /export function adminStateBadgeClass/,
  "admin state badge helper",
);
assertPattern(
  "lib/admin/state-clarity.ts",
  stateClaritySource,
  /export function adminSurfaceNoticeClass/,
  "admin surface notice helper",
);

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

console.log("Admin a11y smoke checks passed.");

