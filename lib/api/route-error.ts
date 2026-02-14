import { AppError } from "@/server/errors";
import { logError } from "@/lib/observability";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type RouteErrorOptions = {
  request: Request;
  route: string;
  details?: Record<string, unknown>;
};

function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

function toErrorPayload(error: unknown) {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        ok: false as const,
        code: "VALIDATION_ERROR",
        error: "Invalid request payload.",
        issues: error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path,
          message: issue.message,
        })),
      },
      logCode: "VALIDATION_ERROR",
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        ok: false as const,
        code: error.code,
        error: error.message,
      },
      logCode: error.code,
    };
  }

  return {
    status: 500,
    body: {
      ok: false as const,
      code: "INTERNAL_ERROR",
      error: "Unexpected server error.",
    },
    logCode: "INTERNAL_ERROR",
  };
}

export function routeErrorResponse(error: unknown, options: RouteErrorOptions) {
  const requestId = getRequestId(options.request);
  const payload = toErrorPayload(error);

  logError({
    event: "api.route_error",
    route: options.route,
    method: options.request.method,
    requestId,
    code: payload.logCode,
    status: payload.status,
    details: options.details ?? null,
  });

  return NextResponse.json(
    {
      ...payload.body,
      requestId,
    },
    {
      status: payload.status,
      headers: {
        "x-request-id": requestId,
      },
    }
  );
}
