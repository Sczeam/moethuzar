import { getSupabaseClient } from "@/lib/supabase";
import { AppError } from "@/server/errors";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from "@/lib/constants/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
});

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Invalid login payload.",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        error: error.message,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    { ok: false, code: "INTERNAL_ERROR", error: "Unexpected server error." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session || !data.user) {
      throw new AppError("Invalid email or password.", 401, "UNAUTHORIZED");
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { authUserId: data.user.id },
      select: { id: true, email: true, fullName: true, isActive: true, role: true },
    });

    if (!adminUser || !adminUser.isActive) {
      throw new AppError("Admin account is not allowed.", 403, "FORBIDDEN");
    }

    const response = NextResponse.json(
      {
        ok: true,
        adminUser,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: ADMIN_ACCESS_TOKEN_COOKIE,
      value: data.session.access_token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.session.expires_in,
    });

    response.cookies.set({
      name: ADMIN_REFRESH_TOKEN_COOKIE,
      value: data.session.refresh_token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
