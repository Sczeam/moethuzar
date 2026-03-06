import type { AuthActionResult } from "@/server/contracts/action-result";

export type AccountRegisterActionState = AuthActionResult;

export const initialAccountRegisterActionState: AccountRegisterActionState = {
  ok: false,
  code: "OK",
  error: "",
  requestId: null,
};

