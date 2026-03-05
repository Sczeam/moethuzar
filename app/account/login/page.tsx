import AccountLoginForm from "./login-form";
import { sanitizeNextPath } from "@/server/auth/redirect";

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next, "/account");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <AccountLoginForm nextPath={nextPath} />
    </main>
  );
}

