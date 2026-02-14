export type SiteNavItem = {
  href: string;
  label: string;
};

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/cart", label: "Cart" },
  { href: "/order/track", label: "Track Order" },
];
