import { todayInput } from "@/domain/formatters/format-date";
import type { DayStatus, MonthDayView } from "../../api/timekeeping-types";

export type GridCell = { date: string | null; status?: DayStatus; today?: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

/** Cells of a Monday-first calendar: null pads before day 1 and after the last day so the count is a multiple of 7. */
export function monthGridCells(period: string, days: readonly MonthDayView[], today: string = todayInput()): GridCell[] {
  const [year, month] = period.split("-").map(Number);
  const length = new Date(year, month, 0).getDate();
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const byDate = new Map(days.map((day) => [day.date, day.status]));
  const cells: GridCell[] = Array.from({ length: lead }, () => ({ date: null }));
  for (let d = 1; d <= length; d += 1) {
    const date = `${period}-${pad(d)}`;
    cells.push({ date, status: byDate.get(date), today: date === today });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

/** Missing-punch chip text by which punch is missing. */
export const MISSING_TITLE = { IN: "Thiếu giờ vào", OUT: "Thiếu giờ ra" } as const;

/** Latest MISSING_PUNCH day. Only an approved explanation changes the day; one still pending leaves it MISSING_PUNCH, so callers check pending requests before offering "Giải trình". */
export function firstIssue(days: readonly MonthDayView[]): MonthDayView | null {
  return days.filter((day) => day.status === "MISSING_PUNCH" && day.date).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0] ?? null;
}

/** 0.5 -> "0,5" (Vietnamese decimal comma). */
export const unitsVi = (value: number | null | undefined) => String(value ?? 0).replace(".", ",");

/** "2026-10" -> "Tháng 10/2026". */
export const monthLabel = (period: string) => `Tháng ${period.slice(5, 7)}/${period.slice(0, 4)}`;

/** Period shifted by `delta` months. */
export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** "14/10" from yyyy-MM-dd. */
export const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
