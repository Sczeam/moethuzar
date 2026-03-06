import type { AuthActionResult } from "@/server/contracts/action-result";

export type AccountForgotPasswordActionState = AuthActionResult;

export const initialAccountForgotPasswordActionState: AccountForgotPasswordActionState = {
  ok: false,
  code: "OK",
  error: "",
  requestId: null,
};

