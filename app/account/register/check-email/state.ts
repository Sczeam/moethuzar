import type { AuthActionResult } from "@/server/contracts/action-result";

export type AccountRegisterEmailCheckState = AuthActionResult<{
  status: "available" | "exists";
  email: string;
}>;

export const initialAccountRegisterEmailCheckState: AccountRegisterEmailCheckState = {
  ok: false,
  code: "OK",
  error: "",
  requestId: null,
};
