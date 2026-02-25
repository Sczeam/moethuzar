import type { AdminModuleDefinition } from "@/components/admin/navigation/nav-types";

export const ADMIN_MODULE_REGISTRY: AdminModuleDefinition[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", order: 10 },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    order: 20,
    children: [
      { id: "orders-all", label: "Orders", href: "/admin/orders", order: 10 },
      {
        id: "orders-returns",
        label: "Returns & Refunds",
        disabled: true,
        featureFlag: "admin_returns_enabled",
        order: 20,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    href: "/admin/catalog",
    order: 30,
    children: [
      { id: "catalog-products", label: "Products", href: "/admin/catalog", order: 10 },
      { id: "catalog-categories", label: "Categories", href: "/admin/catalog", order: 20 },
      { id: "catalog-collections", label: "Collections", href: "/admin/catalog", order: 30 },
      { id: "catalog-inventory", label: "Inventory", href: "/admin/catalog", order: 40 },
      { id: "catalog-media", label: "Media", href: "/admin/catalog", order: 50 },
    ],
  },
  {
    id: "storefront",
    label: "Storefront",
    featureFlag: "admin_storefront_enabled",
    href: "/admin",
    order: 40,
    children: [
      { id: "sf-home", label: "Homepage Sections", href: "/admin", order: 10 },
      { id: "sf-nav", label: "Navigation / Menus", disabled: true, order: 20 },
      { id: "sf-pages", label: "Pages", disabled: true, order: 30 },
      { id: "sf-lookbook", label: "Lookbook / Editorial", disabled: true, order: 40 },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/admin",
    order: 50,
    children: [
      { id: "marketing-promos", label: "Discounts", disabled: true, order: 10 },
      { id: "marketing-seo", label: "SEO", disabled: true, order: 20 },
      { id: "marketing-campaigns", label: "Campaigns", disabled: true, order: 30 },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/admin",
    order: 55,
    children: [
      { id: "reports-sales", label: "Sales Report", disabled: true, order: 10 },
      { id: "reports-products", label: "Product Performance", disabled: true, order: 20 },
    ],
  },
  {
    id: "discounts-legacy",
    label: "Discounts (Legacy)",
    disabled: true,
    featureFlag: "admin_discounts_enabled",
    order: 57,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/shipping-rules",
    order: 60,
    children: [
      { id: "settings-shipping", label: "Shipping", href: "/admin/shipping-rules", order: 10 },
      {
        id: "settings-payments",
        label: "Payments",
        href: "/admin/payment-transfer-methods",
        order: 20,
      },
      {
        id: "settings-staff",
        label: "Staff & Roles",
        disabled: true,
        featureFlag: "admin_staff_and_roles_enabled",
        order: 30,
      },
      {
        id: "settings-store",
        label: "Store Details",
        disabled: true,
        featureFlag: "admin_store_details_enabled",
        order: 40,
      },
    ],
  },
];
