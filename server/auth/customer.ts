import { resolveCustomerFromSession } from "@/server/auth/customer-identity";
import { AppError } from "@/server/errors";

export type CustomerSessionUser = {
  customerId: string;
  authUserId: string;
  email: string | null;
};

export async function getCustomerSessionUser(request?: Request): Promise<CustomerSessionUser | null> {
  const identity = await resolveCustomerFromSession({
    requestId: request?.headers.get("x-request-id") ?? null,
  });

  if (identity.kind !== "customer") {
    return null;
  }

  return {
    customerId: identity.customerId,
    authUserId: identity.authUserId,
    email: identity.email,
  };
}

export async function requireCustomerSessionUser(
  request?: Request
): Promise<CustomerSessionUser> {
  const user = await getCustomerSessionUser(request);
  if (!user) {
    throw new AppError("Invalid access token.", 401, "UNAUTHORIZED");
  }
  return user;
}

