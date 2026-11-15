import type { MyTeachingMonth, TeachingPeriodRow, TeachingRow } from "../../api/timekeeping-teaching-api";
import { requestErrorText } from "../../components/requests/request-model";

const pad = (n: number) => String(n).padStart(2, "0");

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Last day (yyyy-MM-dd) of a yyyy-MM month. */
export function monthEnd(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${month}-${pad(new Date(year, m, 0).getDate())}`;
}

/** Whole-month range as `{from, to}` ISO dates. */
export const monthRange = (month: string) => ({ from: `${month}-01`, to: monthEnd(month) });

/** The month is over once `today` (yyyy-MM-dd, local) is past its last day. */
export const monthEnded = (month: string, today: string) => today > monthEnd(month);

/** Calendar year range (the board filters by «Năm»). */
export const yearRange = (year: number) => ({ from: `${year}-01-01`, to: `${year}-12-31` });

/** Months (yyyy-MM) of `year` that have started by `today`. */
export function yearMonths(year: number, today: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`).filter((month) => `${month}-01` <= today);
}

/** Monday (yyyy-MM-dd) of the week of `date`, computed in UTC so DST never shifts it. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const WEEKDAY = ["", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "CN"];
/** ISO weekday 1..7 as the board writes it: Hai ... Bảy, CN. */
export const weekdayVi = (weekday: number | undefined) => WEEKDAY[weekday ?? 0] ?? "";

/** "Thứ 5" style heading used by the missing-report card. */
export const weekdayLong = (weekday: number) => (weekday === 7 ? "Chủ nhật" : `Thứ ${weekday + 1}`);

export type DayCell = { row: TeachingPeriodRow; daySpan: number };

/** Total-sheet rows with the Tháng/Ngày/Thứ merge: `daySpan` on the first row of a day, 0 on the rest (same date, consecutive). */
export function groupByDay(rows: readonly TeachingPeriodRow[]): DayCell[] {
  const cells: DayCell[] = rows.map((row) => ({ row, daySpan: 0 }));
  let head = -1;
  cells.forEach((cell, i) => {
    if (head >= 0 && cells[head].row.date === cell.row.date) cells[head].daySpan += 1;
    else {
      head = i;
      cell.daySpan = 1;
    }
  });
  return cells;
}

export type RowGroup = { key: string; title: string; rows: TeachingRow[] };

/** "Trường · môn · cấp" groups of the Công của tôi table, in first-seen order. */
export function groupTeachingRows(rows: readonly TeachingRow[]): RowGroup[] {
  const groups = new Map<string, RowGroup>();
  for (const row of rows) {
    const title = [row.schoolName, row.subjectName, row.level].filter(Boolean).join(" · ");
    const group = groups.get(title) ?? { key: title, title, rows: [] };
    group.rows.push(row);
    groups.set(title, group);
  }
  return [...groups.values()];
}

/** Index (0-based) of the week holding `date`, or -1. */
export const weekIndexOf = (weeks: readonly { from?: string; to?: string }[], date: string) =>
  weeks.findIndex((week) => week.from !== undefined && week.to !== undefined && week.from <= date && date <= week.to);

/** Class names with a period still missing its report, per week: `Set` of `${weekIndex}|${className}`. */
export function missingCells(data: Pick<MyTeachingMonth, "weeks" | "missingReports">): Set<string> {
  const cells = new Set<string>();
  for (const miss of data.missingReports ?? []) cells.add(`${weekIndexOf(data.weeks ?? [], miss.date ?? "")}|${miss.className}`);
  return cells;
}

/** Sum of every row's week column (`weekTotals[index]`), for the "Cộng" row and the mobile week list. */
export const columnTotal = (rows: readonly TeachingRow[], index: number) => rows.reduce((sum, row) => sum + (row.weekTotals?.[index] ?? 0), 0);

/** "Tiết 1–2" or "Tiết 3" from the first period and how many follow. */
export const periodRangeLabel = (start: number | undefined, count: number | undefined) =>
  !start ? "" : count && count > 1 ? `Tiết ${start}–${start + count - 1}` : `Tiết ${start}`;

/** "07:00:00" -> "07:00". */
export const hhmm = (time: string | undefined) => (time ?? "").slice(0, 5);

/** dd/MM from yyyy-MM-dd. */
export const dayMonthVi = (date: string | undefined) => (date ? `${date.slice(8, 10)}/${date.slice(5, 7)}` : "");

/** Backend codes of the teaching endpoints -> the text 6.12 of the plan fixes; anything else falls back to the shared request text. */
const ERROR_TEXT: Record<string, string> = {
  TOTAL_CHANGED: "Số tiết vừa thay đổi, kiểm tra lại trước khi xác nhận.",
  STALE_VERSION: "Dữ liệu vừa được người khác sửa, đã tải lại.",
  MONTH_CLOSED: "Tháng đã chốt, không sửa được.",
  MONTH_NOT_ENDED: "Tháng chưa kết thúc, chưa xác nhận được.",
  NO_TEACHING_PERIODS: "Không có tiết dạy trong tháng này.",
  NOT_ALL_CONFIRMED: "Chưa đủ giáo viên xác nhận, chưa chốt được.",
  NOTE_REQUIRED: "Nhập ghi chú sai sót.",
};
/** Codes after which the page must reload its data. */
export const RELOAD_CODES = ["TOTAL_CHANGED", "STALE_VERSION", "MONTH_CLOSED", "NOT_ALL_CONFIRMED"];

export const errorCodeOf = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
};

export function teachingErrorText(error: unknown): string {
  const code = errorCodeOf(error);
  return (code && ERROR_TEXT[code]) || requestErrorText(error);
}

/** State of the teacher's month: drives the banner and the confirmation card. */
export type MyMonthState = "COLLECTING" | "AWAITING" | "ISSUE" | "CONFIRMED" | "CLOSED";

export function myMonthState(data: Pick<MyTeachingMonth, "status" | "confirmation">, month: string, today: string): MyMonthState {
  if (data.status === "CLOSED") return "CLOSED";
  const status = data.confirmation?.status;
  if (status === "CONFIRMED") return "CONFIRMED";
  if (!monthEnded(month, today)) return "COLLECTING";
  return status === "ISSUE_REPORTED" ? "ISSUE" : "AWAITING";
}

/** The "Tiết dạy" tab only exists for someone who has (or had) teaching periods that month. */
export const hasTeaching = (data: MyTeachingMonth | undefined) =>
  Boolean(data && ((data.total ?? 0) > 0 || (data.assistantTotal ?? 0) > 0 || data.rows?.length || data.assistantRows?.length || data.cancelled?.length));
