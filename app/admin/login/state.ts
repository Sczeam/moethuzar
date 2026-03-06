export type AdminLoginActionState = {
  ok: boolean;
  error: string;
};

export const initialAdminLoginActionState: AdminLoginActionState = {
  ok: false,
  error: "",
};
