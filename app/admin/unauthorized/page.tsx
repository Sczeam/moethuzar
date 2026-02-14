import Link from "next/link";
import LogoutButton from "./logout-button";

export default function AdminUnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
      <section className="w-full vintage-panel border-seal-wax/40 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seal-wax">
          Access Restricted
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">You are signed in, but not an admin.</h1>
        <p className="mt-3 text-sm text-charcoal">
          Ask the system owner to map your Supabase user to an active `AdminUser` record and add
          admin role metadata.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
