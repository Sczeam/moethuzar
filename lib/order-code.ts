const ORDER_CODE_REGEXES = [
  /^MZT-\d{8}-\d{4}$/,
  /^MZT-\d{8}-\d{6}[A-F0-9]{6}$/,
] as const;

export const ORDER_CODE_EXAMPLES = [
  "MZT-20260214-0001",
  "MZT-20260216-003554D4A42F",
] as const;

export function normalizeOrderCode(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return ORDER_CODE_REGEXES.some((regex) => regex.test(normalized)) ? normalized : null;
}
