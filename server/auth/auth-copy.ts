import type { AuthActionCode } from "@/server/contracts/action-result";

export const AUTH_COPY_BY_CODE: Record<AuthActionCode, string> = {
  OK: "",
  VALIDATION_ERROR: "Please check the required fields and try again.",
  UNAUTHORIZED: "Invalid email or password.",
  RATE_LIMITED: "Too many attempts. Please wait and try again.",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists. Sign in instead.",
  RESET_LINK_SENT: "If the email exists, a reset link has been sent.",
  RESET_SUCCESS: "Password updated successfully.",
  EMAIL_VERIFICATION_REQUIRED:
    "Your account was created. Please verify your email before signing in.",
  UNEXPECTED_ERROR: "Unexpected server error. Please try again.",
};

