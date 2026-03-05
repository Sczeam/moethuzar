function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/")) {
    return false;
  }

  // Block protocol-relative URLs (e.g. //evil.com)
  if (value.startsWith("//")) {
    return false;
  }

  return true;
}

export function sanitizeNextPath(nextPath: string | null | undefined, fallback: string): string {
  if (!nextPath) {
    return fallback;
  }

  const candidate = nextPath.trim();
  if (!candidate) {
    return fallback;
  }

  return isSafeInternalPath(candidate) ? candidate : fallback;
}

