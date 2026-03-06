export function getRequestIdFromHeaders(headers: Headers): string {
  const existing = headers.get("x-request-id");
  return existing && existing.trim().length > 0 ? existing : crypto.randomUUID();
}

