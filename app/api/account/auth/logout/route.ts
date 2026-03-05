import { signOutCurrentSession } from "@/server/auth/auth-service";
import { NextResponse } from "next/server";

export async function POST() {
  await signOutCurrentSession();
  return NextResponse.json({ ok: true }, { status: 200 });
}

