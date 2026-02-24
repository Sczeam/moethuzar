"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { buildAdminSidebarGroups } from "@/components/admin/navigation/build-nav";
import { ADMIN_MODULE_REGISTRY } from "@/components/admin/navigation/module-registry";
import { AdminBreadcrumbs, type BreadcrumbItem } from "@/components/admin/shell/admin-breadcrumbs";
import { AdminSidebar } from "@/components/admin/shell/admin-sidebar";
import { AdminTopbar } from "@/components/admin/shell/admin-topbar";

const ADMIN_FEATURE_FLAGS = {
  adminStorefrontEnabled: false,
  adminDiscountsEnabled: false,
  adminReturnsEnabled: false,
  adminStaffAndRolesEnabled: false,
  adminStoreDetailsEnabled: false,
} as const;

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
    if (pathname.startsWith("/admin/catalog/new")) {
      return [
        { label: "Dashboard", href: "/admin" },
        { label: "Catalog", href: "/admin/catalog" },
        { label: "Products", href: "/admin/catalog" },
        { label: "Create Product" },
      ];
    }

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
    if (pathname.startsWith("/admin/catalog/new")) {
      return { title: "Create Product", subtitle: "Add a new product to catalog" };
    }

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
  const mobileNavId = useId();

  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/admin/unauthorized";

  const pageMeta = useMemo(() => getPageTitle(pathname), [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const navGroups = useMemo(
    () =>
      buildAdminSidebarGroups({
        modules: ADMIN_MODULE_REGISTRY,
        featureFlags: {
          admin_storefront_enabled: ADMIN_FEATURE_FLAGS.adminStorefrontEnabled,
          admin_discounts_enabled: ADMIN_FEATURE_FLAGS.adminDiscountsEnabled,
          admin_returns_enabled: ADMIN_FEATURE_FLAGS.adminReturnsEnabled,
          admin_staff_and_roles_enabled: ADMIN_FEATURE_FLAGS.adminStaffAndRolesEnabled,
          admin_store_details_enabled: ADMIN_FEATURE_FLAGS.adminStoreDetailsEnabled,
        },
      }),
    [],
  );

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-parchment lg:grid lg:grid-cols-[18rem_1fr]">
      <AdminSidebar
        groups={navGroups}
        pathname={pathname}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobilePanelId={mobileNavId}
      />
      <div className="min-w-0">
        <AdminTopbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onOpenSidebar={() => setSidebarOpen(true)}
          mobileNavControlsId={mobileNavId}
          isSidebarOpen={sidebarOpen}
        />
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <AdminBreadcrumbs items={breadcrumbs} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
