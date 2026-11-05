const FORMAT = new Intl.NumberFormat("vi-VN", { useGrouping: false, maximumFractionDigits: 6 });

/** Reads what a Vietnamese teacher types ("2,6"); anything that is not a finite number is NaN. */
export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return NaN;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

export function formatDecimal(value: number): string {
  return Number.isFinite(value) ? FORMAT.format(value) : "";
}
