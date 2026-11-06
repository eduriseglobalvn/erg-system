const QUICK_ASSIGN_DUE_DAYS = 7;
const pad = (n: number) => String(n).padStart(2, "0");

/** yyyy-MM-dd in the LOCAL timezone (never UTC). */
export function toLocalDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Default due date for a quick assignment: today + 7 days, local calendar date. */
export function defaultQuickAssignDueInput(now: Date = new Date()): string {
  const due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + QUICK_ASSIGN_DUE_DAYS);
  return toLocalDateInput(due);
}

/** yyyy-MM-dd -> ISO instant at the end of that local day; null when invalid. */
export function dueInputToIso(input: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 0);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
