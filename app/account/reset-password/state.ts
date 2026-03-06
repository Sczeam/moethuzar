import type { AuthActionResult } from "@/server/contracts/action-result";

export type AccountResetPasswordActionState = AuthActionResult;

export const initialAccountResetPasswordActionState: AccountResetPasswordActionState = {
  ok: false,
  code: "OK",
  error: "",
  requestId: null,
};

