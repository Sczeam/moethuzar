import { prisma } from "@/lib/prisma";
import { registerWithEmailPasswordNoSession } from "@/server/auth/auth-recovery.service";

export type CheckoutAccountIntentResult =
  | {
      customerId: string;
      reason: "ACCOUNT_CREATED";
    }
  | {
      customerId: null;
      reason:
        | "DISABLED"
        | "SESSION_CUSTOMER"
        | "MISSING_EMAIL"
        | "EMAIL_ALREADY_REGISTERED"
        | "REGISTER_FAILED"
        | "CUSTOMER_UPSERT_FAILED";
    };

type ResolveCheckoutAccountIntentInput = {
  customerEmail: string | null;
  password: string;
  accountIntentEnabled: boolean;
  resolvedCustomerId: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

export async function resolveCheckoutAccountIntentCustomer(
  input: ResolveCheckoutAccountIntentInput
): Promise<CheckoutAccountIntentResult> {
  if (!input.accountIntentEnabled) {
    return { customerId: null, reason: "DISABLED" };
  }

  if (input.resolvedCustomerId) {
    return {
      customerId: null,
      reason: "SESSION_CUSTOMER",
    };
  }

  const email = normalizeEmail(input.customerEmail);
  if (!email) {
    return { customerId: null, reason: "MISSING_EMAIL" };
  }

  try {
    const created = await registerWithEmailPasswordNoSession({
      email,
      password: input.password,
    });

    const customer = await prisma.customer.upsert({
      where: { authUserId: created.userId },
      update: {
        email: created.email,
        deactivatedAt: null,
      },
      create: {
        authUserId: created.userId,
        email: created.email,
      },
      select: {
        id: true,
      },
    });

    return {
      customerId: customer.id,
      reason: "ACCOUNT_CREATED",
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : null;

    if (code === "EMAIL_ALREADY_REGISTERED") {
      return { customerId: null, reason: "EMAIL_ALREADY_REGISTERED" };
    }

    if (code === "P2002") {
      return { customerId: null, reason: "CUSTOMER_UPSERT_FAILED" };
    }

    return { customerId: null, reason: "REGISTER_FAILED" };
  }
}

