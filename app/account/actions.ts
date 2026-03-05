"use server";

import { redirect } from "next/navigation";
import { signOutCurrentSession } from "@/server/auth/auth-service";

export async function accountLogoutAction() {
  await signOutCurrentSession();
  redirect("/account/login");
}

