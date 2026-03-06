import ResetPasswordForm from "./reset-password-form";
import { sanitizeNextPath } from "@/server/auth/redirect";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next, "/account");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <ResetPasswordForm nextPath={nextPath} />
    </main>
  );
}

