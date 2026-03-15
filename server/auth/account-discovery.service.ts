import { prisma } from "@/lib/prisma";

export type AccountEmailAvailability =
  | {
      status: "available";
      normalizedEmail: string;
    }
  | {
      status: "exists";
      normalizedEmail: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function checkCustomerEmailAvailability(
  email: string
): Promise<AccountEmailAvailability> {
  const normalizedEmail = normalizeEmail(email);

  const customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (customer) {
    return {
      status: "exists",
      normalizedEmail,
    };
  }

  return {
    status: "available",
    normalizedEmail,
  };
}
