"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminBreadcrumbs, type BreadcrumbItem } from "@/components/admin/shell/admin-breadcrumbs";
import { AdminSidebar, type AdminNavGroup } from "@/components/admin/shell/admin-sidebar";
import { AdminTopbar } from "@/components/admin/shell/admin-topbar";

const ADMIN_GROUPS: AdminNavGroup[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin" },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    children: [
      { id: "orders-all", label: "Orders", href: "/admin/orders" },
      { id: "orders-returns", label: "Returns & Refunds", href: "/admin/orders" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    href: "/admin/catalog",
    children: [
      { id: "catalog-products", label: "Products", href: "/admin/catalog" },
      { id: "catalog-categories", label: "Categories", href: "/admin/catalog" },
      { id: "catalog-collections", label: "Collections", href: "/admin/catalog" },
      { id: "catalog-inventory", label: "Inventory", href: "/admin/catalog" },
      { id: "catalog-media", label: "Media", href: "/admin/catalog" },
    ],
  },
  {
    id: "storefront",
    label: "Storefront",
    disabled: true,
    children: [
      { id: "sf-home", label: "Homepage Sections", href: "/admin" },
      { id: "sf-nav", label: "Navigation / Menus", href: "/admin" },
      { id: "sf-pages", label: "Pages", href: "/admin" },
      { id: "sf-lookbook", label: "Lookbook / Editorial", href: "/admin" },
    ],
  },
  { id: "discounts", label: "Discounts", disabled: true },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/shipping-rules",
    children: [
      { id: "settings-shipping", label: "Shipping", href: "/admin/shipping-rules" },
      { id: "settings-payments", label: "Payments", href: "/admin/payment-transfer-methods" },
      { id: "settings-staff", label: "Staff & Roles", href: "/admin" },
      { id: "settings-store", label: "Store Details", href: "/admin" },
    ],
  },
];

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname.startsWith("/admin")) {
    return [];
  }

  if (pathname === "/admin") {
    return [{ label: "Dashboard" }];
  }

  if (pathname.startsWith("/admin/orders/")) {
    return [
      { label: "Dashboard", href: "/admin" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Order Detail" },
    ];
  }

  if (pathname.startsWith("/admin/orders")) {
    return [{ label: "Dashboard", href: "/admin" }, { label: "Orders" }];
  }

  if (pathname.startsWith("/admin/catalog")) {
    return [{ label: "Dashboard", href: "/admin" }, { label: "Catalog" }];
  }

  if (pathname.startsWith("/admin/shipping-rules")) {
    return [
      { label: "Dashboard", href: "/admin" },
      { label: "Settings", href: "/admin/shipping-rules" },
      { label: "Shipping" },
    ];
  }

  if (pathname.startsWith("/admin/payment-transfer-methods")) {
    return [
      { label: "Dashboard", href: "/admin" },
      { label: "Settings", href: "/admin/shipping-rules" },
      { label: "Payments" },
    ];
  }

  return [{ label: "Dashboard", href: "/admin" }, { label: "Admin" }];
}

function getPageTitle(pathname: string): { title: string; subtitle?: string } {
  if (pathname === "/admin") {
    return { title: "Dashboard", subtitle: "Overview and quick actions" };
  }

  if (pathname.startsWith("/admin/orders/")) {
    return { title: "Order Detail", subtitle: "Review and update order actions" };
  }

  if (pathname.startsWith("/admin/orders")) {
    return { title: "Orders", subtitle: "Manage statuses, payments, and fulfillment" };
  }

  if (pathname.startsWith("/admin/catalog")) {
    return { title: "Catalog", subtitle: "Products, variants, and media" };
  }

  if (pathname.startsWith("/admin/shipping-rules")) {
    return { title: "Shipping Settings", subtitle: "Manage zones, fees, and fallback safety" };
  }

  if (pathname.startsWith("/admin/payment-transfer-methods")) {
    return { title: "Payment Settings", subtitle: "Manage prepaid transfer methods" };
  }

  return { title: "Admin" };
}

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/admin/unauthorized";

  const pageMeta = useMemo(() => getPageTitle(pathname), [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-parchment lg:grid lg:grid-cols-[18rem_1fr]">
      <AdminSidebar groups={ADMIN_GROUPS} pathname={pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0">
        <AdminTopbar title={pageMeta.title} subtitle={pageMeta.subtitle} onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <AdminBreadcrumbs items={breadcrumbs} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
