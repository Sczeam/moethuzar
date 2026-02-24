import Link from "next/link";

const QUICK_ACTIONS = [
  { label: "Open Orders", href: "/admin/orders", description: "Review new and active orders" },
  { label: "Open Products", href: "/admin/catalog", description: "Manage product list and stock" },
  { label: "Create Product", href: "/admin/catalog/new", description: "Start a new product draft" },
  { label: "Shipping Settings", href: "/admin/shipping-rules", description: "Edit zones and fees" },
  {
    label: "Payment Settings",
    href: "/admin/payment-transfer-methods",
    description: "Manage prepaid transfer accounts",
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <main className="vintage-shell space-y-6">
      <section className="vintage-panel p-5">
        <h1 className="text-2xl font-semibold text-ink">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-charcoal">
          Use quick actions below to complete common daily tasks in one click.
        </p>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} href={action.href} className="rounded-none border border-sepia-border p-4 hover:bg-parchment">
              <p className="text-sm font-semibold text-ink">{action.label}</p>
              <p className="mt-1 text-xs text-charcoal">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
