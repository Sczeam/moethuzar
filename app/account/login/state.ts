import type { AuthActionResult } from "@/server/contracts/action-result";

export type AccountLoginActionState = AuthActionResult;

export const initialAccountLoginActionState: AccountLoginActionState = {
  ok: false,
  code: "OK",
  error: "",
  requestId: null,
};
