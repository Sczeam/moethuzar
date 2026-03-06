export type AccountLoginActionState = {
  ok: boolean;
  error: string;
};

export const initialAccountLoginActionState: AccountLoginActionState = {
  ok: false,
  error: "",
};
