const FORMAT = new Intl.NumberFormat("vi-VN", { useGrouping: false, maximumFractionDigits: 6 });

/** Reads what a Vietnamese teacher types ("2,6"); anything that is not a finite number is NaN. */
export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  // Plain decimals only; "1.000" is ambiguous (Vietnamese thousands separator), so it is rejected too ("0.125" is not).
  if (!/^-?(\d+([.,]\d+)?|[.,]\d+)$/.test(trimmed) || /^-?[1-9]\d{0,2}\.\d{3}$/.test(trimmed)) return NaN;
  return Number(trimmed.replace(",", ".")) || 0;
}

export function formatDecimal(value: number): string {
  return Number.isFinite(value) ? FORMAT.format(value || 0) : "";
}
