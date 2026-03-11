import { redirect } from "next/navigation";
import { getCustomerSessionUser } from "@/server/auth/customer";
import { accountLogoutAction } from "@/app/account/actions";
import Link from "next/link";

export default async function AccountPage() {
  const sessionUser = await getCustomerSessionUser();

  if (!sessionUser) {
    redirect("/account/login?next=/account");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <section className="vintage-panel p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.12em] text-charcoal/80">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-3 text-sm text-charcoal">
          Signed in as <span className="font-semibold text-ink">{sessionUser.email ?? "Unknown email"}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/orders" className="btn-primary">
            My Orders
          </Link>
          <Link href="/account/wishlist" className="btn-secondary">
            My Favourites
          </Link>
          <Link href="/order/track" className="btn-secondary">
            Track Order
          </Link>
          <form action={accountLogoutAction}>
            <button type="submit" className="btn-secondary">
              Logout
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
