import { prisma } from "@/lib/prisma";
import { logError, logWarn } from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";

export type ResolveCustomerFromSessionInput = {
  requestId?: string | null;
};

export type ResolveCustomerFromAuthUserInput = {
  authUserId: string;
  email: string | null | undefined;
  requestId?: string | null;
};

export type ResolvedCustomerIdentity =
  | {
      kind: "customer";
      customerId: string;
      authUserId: string;
      email: string;
    }
  | {
      kind: "guest";
      customerId: null;
      authUserId: null;
      email: null;
      reason:
        | "NO_SESSION"
        | "AUTH_LOOKUP_FAILED"
        | "MISSING_EMAIL"
        | "IDENTITY_CONFLICT"
        | "CUSTOMER_LOOKUP_FAILED";
    };

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function upsertCustomerIdentity(authUserId: string, email: string) {
  try {
    return await prisma.customer.upsert({
      where: { authUserId },
      update: { email, deactivatedAt: null },
      create: { authUserId, email },
      select: {
        id: true,
        authUserId: true,
        email: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const byAuthId = await prisma.customer.findUnique({
      where: { authUserId },
      select: { id: true, authUserId: true, email: true },
    });
    if (byAuthId) {
      return byAuthId;
    }

    const byEmail = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, authUserId: true, email: true },
    });
    if (!byEmail) {
      return null;
    }

    if (byEmail.authUserId !== authUserId) {
      return "IDENTITY_CONFLICT" as const;
    }

    return byEmail;
  }
}

export async function resolveCustomerFromAuthUser(
  input: ResolveCustomerFromAuthUserInput
): Promise<ResolvedCustomerIdentity> {
  const email = normalizeEmail(input.email);

  if (!email) {
    logWarn({
      event: "customer_identity.missing_email",
      requestId: input.requestId ?? null,
      authUserId: input.authUserId,
    });
    return {
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "MISSING_EMAIL",
    };
  }

  try {
    const customer = await upsertCustomerIdentity(input.authUserId, email);

    if (customer === "IDENTITY_CONFLICT") {
      logWarn({
        event: "customer_identity.conflict",
        requestId: input.requestId ?? null,
        authUserId: input.authUserId,
      });
      return {
        kind: "guest",
        customerId: null,
        authUserId: null,
        email: null,
        reason: "IDENTITY_CONFLICT",
      };
    }

    if (!customer) {
      logWarn({
        event: "customer_identity.lookup_failed",
        requestId: input.requestId ?? null,
        authUserId: input.authUserId,
      });
      return {
        kind: "guest",
        customerId: null,
        authUserId: null,
        email: null,
        reason: "CUSTOMER_LOOKUP_FAILED",
      };
    }

    return {
      kind: "customer",
      customerId: customer.id,
      authUserId: customer.authUserId,
      email: customer.email,
    };
  } catch (error) {
    logError({
      event: "customer_identity.resolution_failed",
      requestId: input.requestId ?? null,
      authUserId: input.authUserId,
      code:
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code ?? null
          : null,
    });

    return {
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "CUSTOMER_LOOKUP_FAILED",
    };
  }
}

export async function resolveCustomerFromSession(
  input: ResolveCustomerFromSessionInput = {}
): Promise<ResolvedCustomerIdentity> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    logWarn({
      event: "customer_identity.auth_lookup_failed",
      requestId: input.requestId ?? null,
      error: error.message,
    });
    return {
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "AUTH_LOOKUP_FAILED",
    };
  }

  if (!data.user) {
    return {
      kind: "guest",
      customerId: null,
      authUserId: null,
      email: null,
      reason: "NO_SESSION",
    };
  }

  return resolveCustomerFromAuthUser({
    authUserId: data.user.id,
    email: data.user.email,
    requestId: input.requestId ?? null,
  });
}
