type NextRedirectError = {
  digest?: string;
};

export function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as NextRedirectError).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

