"use client";

import { adminLogoutAction } from "@/app/admin/unauthorized/actions";

export default function LogoutButton() {
  return (
    <form action={adminLogoutAction}>
      <button type="submit" className="btn-secondary">
        Logout
      </button>
    </form>
  );
}
