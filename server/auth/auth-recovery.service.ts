import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/server/errors";
import { signInWithEmailPassword } from "@/server/auth/auth-service";

type RegisterInput = {
  email: string;
  password: string;
};

type ForgotPasswordInput = {
  email: string;
  redirectTo: string;
};

type ResetPasswordInput = {
  password: string;
};

function isAlreadyRegisteredError(error: { message?: string } | null): boolean {
  if (!error?.message) {
    return false;
  }
  return /already registered/i.test(error.message);
}

export async function registerWithEmailPassword(input: RegisterInput): Promise<{ userId: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      throw new AppError("EMAIL_ALREADY_REGISTERED", 409, "EMAIL_ALREADY_REGISTERED");
    }
    throw new AppError("Registration failed.", 500, "UNEXPECTED_ERROR");
  }

  if (!data.user) {
    throw new AppError("Registration failed.", 500, "UNEXPECTED_ERROR");
  }

  if (!data.session) {
    try {
      await signInWithEmailPassword({
        email: input.email,
        password: input.password,
      });
    } catch {
      throw new AppError(
        "Email verification required.",
        403,
        "EMAIL_VERIFICATION_REQUIRED"
      );
    }
  }

  return { userId: data.user.id };
}

export async function registerWithEmailPasswordNoSession(
  input: RegisterInput
): Promise<{ userId: string; email: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      throw new AppError("EMAIL_ALREADY_REGISTERED", 409, "EMAIL_ALREADY_REGISTERED");
    }
    throw new AppError("Registration failed.", 500, "UNEXPECTED_ERROR");
  }

  if (!data.user) {
    throw new AppError("Registration failed.", 500, "UNEXPECTED_ERROR");
  }

  // Checkout account intent must not silently authenticate the browsing session.
  if (data.session) {
    await supabase.auth.signOut();
  }

  return {
    userId: data.user.id,
    email: data.user.email?.trim().toLowerCase() ?? input.email.trim().toLowerCase(),
  };
}

export async function sendPasswordReset(input: ForgotPasswordInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });

  if (error) {
    throw new AppError("Password reset request failed.", 500, "UNEXPECTED_ERROR");
  }
}

export async function resetPasswordWithSession(input: ResetPasswordInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("Reset link is invalid or expired.", 401, "UNAUTHORIZED");
  }

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new AppError("Password update failed.", 500, "UNEXPECTED_ERROR");
  }
}

