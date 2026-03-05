import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/server/errors";

export type AuthSessionUser = {
  id: string;
  email: string | null;
};

type EmailPasswordCredentials = {
  email: string;
  password: string;
};

function toAuthSessionUser(user: { id: string; email?: string | null }): AuthSessionUser {
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function signInWithEmailPassword(
  credentials: EmailPasswordCredentials
): Promise<AuthSessionUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error || !data.session || !data.user) {
    throw new AppError("Invalid email or password.", 401, "UNAUTHORIZED");
  }

  return toAuthSessionUser(data.user);
}

export async function signOutCurrentSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getCurrentSessionUser(request?: Request): Promise<AuthSessionUser | null> {
  const supabase = await createClient();
  const authorization = request?.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const { data, error } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return toAuthSessionUser(data.user);
}

