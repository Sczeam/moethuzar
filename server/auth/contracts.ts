export type AuthFailureCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type AuthActionError = {
  ok: false;
  code: AuthFailureCode;
  error: string;
};

export type AuthActionSuccess<T extends Record<string, unknown>> = {
  ok: true;
} & T;

export type AuthActionResult<T extends Record<string, unknown>> =
  | AuthActionSuccess<T>
  | AuthActionError;

