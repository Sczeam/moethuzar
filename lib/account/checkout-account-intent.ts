export const CHECKOUT_ACCOUNT_INTENT_HEADER = "x-checkout-account-intent";
export const CHECKOUT_ACCOUNT_INTENT_QUERY_PARAM = "account";

export type CheckoutAccountIntentStatus = "created" | "existing-email" | "failed";

export function parseCheckoutAccountIntentStatus(
  value: string | null | undefined
): CheckoutAccountIntentStatus | null {
  if (value === "created" || value === "existing-email" || value === "failed") {
    return value;
  }

  return null;
}

export function mapCheckoutAccountIntentReasonToStatus(
  reason: string | null | undefined
): CheckoutAccountIntentStatus | null {
  switch (reason) {
    case "ACCOUNT_CREATED":
      return "created";
    case "EMAIL_ALREADY_REGISTERED":
      return "existing-email";
    case "REGISTER_FAILED":
    case "CUSTOMER_UPSERT_FAILED":
      return "failed";
    default:
      return null;
  }
}
