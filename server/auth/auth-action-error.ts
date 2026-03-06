import { z } from "zod";
import { AppError } from "@/server/errors";
import type { AuthActionCode } from "@/server/contracts/action-result";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";

type ErrorMapping = {
  code: AuthActionCode;
  message: string;
};

export function mapAuthActionError(error: unknown): ErrorMapping {
  if (error instanceof z.ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: AUTH_COPY_BY_CODE.VALIDATION_ERROR,
    };
  }

  if (error instanceof AppError) {
    const knownCode = error.code as AuthActionCode;
    if (knownCode in AUTH_COPY_BY_CODE) {
      return {
        code: knownCode,
        message: AUTH_COPY_BY_CODE[knownCode],
      };
    }
  }

  return {
    code: "UNEXPECTED_ERROR",
    message: AUTH_COPY_BY_CODE.UNEXPECTED_ERROR,
  };
}

