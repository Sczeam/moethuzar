"use server";

import { redirect } from "next/navigation";
import { signOutCurrentSession } from "@/server/auth/auth-service";

export async function adminLogoutAction() {
  await signOutCurrentSession();
  redirect("/admin/login");
}

