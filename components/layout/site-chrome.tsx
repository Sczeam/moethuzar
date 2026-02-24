"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <main id="main-content" className="min-h-dvh">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-[calc(100vh-16rem)]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
