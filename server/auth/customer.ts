import { getCurrentSessionUser } from "@/server/auth/auth-service";
import { AppError } from "@/server/errors";

export type CustomerSessionUser = {
  id: string;
  email: string | null;
};

export async function getCustomerSessionUser(request?: Request): Promise<CustomerSessionUser | null> {
  const user = await getCurrentSessionUser(request);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
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

