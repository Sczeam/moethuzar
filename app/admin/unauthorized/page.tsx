import Link from "next/link";
import LogoutButton from "./logout-button";

export default function AdminUnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-xl border border-amber-300 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Access Restricted
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">You are signed in, but not an admin.</h1>
        <p className="mt-3 text-sm text-zinc-700">
          Ask the system owner to map your Supabase user to an active `AdminUser` record and add
          admin role metadata.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to Home
          </Link>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
