const ORDER_CODE_REGEX = /^MZT-\d{8}-\d{4}$/;

export function normalizeOrderCode(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return ORDER_CODE_REGEX.test(normalized) ? normalized : null;
}
