export type AuthActionCode =
  | "OK"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "EMAIL_ALREADY_REGISTERED"
  | "RESET_LINK_SENT"
  | "RESET_SUCCESS"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "UNEXPECTED_ERROR";

export type AuthActionResult<T = undefined> = {
  ok: boolean;
  code: AuthActionCode;
  error: string;
  requestId: string | null;
  data?: T;
};

export function authActionSuccess<T = undefined>(
  requestId: string | null,
  code: AuthActionCode = "OK",
  data?: T
): AuthActionResult<T> {
  return {
    ok: true,
    code,
    error: "",
    requestId,
    ...(data === undefined ? {} : { data }),
  };
}

export function authActionFailure(
  requestId: string | null,
  code: AuthActionCode,
  error: string
): AuthActionResult {
  return {
    ok: false,
    code,
    error,
    requestId,
  };
}
