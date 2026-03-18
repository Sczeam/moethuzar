import { sanitizeNextPath } from "@/server/auth/redirect";
import RegisterJourney from "@/app/account/register/register-journey";

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next, "/account");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <RegisterJourney nextPath={nextPath} />
    </main>
  );
}

