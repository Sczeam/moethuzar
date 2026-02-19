export type SiteNavItem = {
  href: string;
  label: string;
};

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/#latest-products", label: "Shop" },
  { href: "/search", label: "Search" },
  { href: "/cart", label: "Cart" },
  { href: "/order/track", label: "Track Order" },
];
