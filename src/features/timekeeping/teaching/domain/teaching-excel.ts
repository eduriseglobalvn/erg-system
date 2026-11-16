import { toast } from "sonner";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { TeachingExport, TeachingMonthSheet, TeachingPeriodRow, TeachingRole } from "../../api/timekeeping-teaching-api";
import { confirmationText, teachingTitle } from "./teaching-copy";
import { groupByDay, hhmm, monthRange, weekdayVi } from "./teaching-model";

type Cell = string | number;
type Merge = { s: { r: number; c: number }; e: { r: number; c: number } };
export type SheetSpec = { name: string; rows: Cell[][]; merges: Merge[] };

const TOTAL_COLUMNS = ["Tháng", "Ngày", "Thứ", "Tiết", "Trường", "Từ", "Đến", "Lớp", "Cấp", "Môn", "Nội dung giảng dạy", "Giáo viên"];
const MONTH_COLUMNS = ["Stt", "Trường liên kết", "Họ và tên giáo viên", "Môn dạy", "Lớp dạy"];

/** Spreadsheet apps run text starting with = + - @ as a formula. */
const safeText = (value: string | undefined): string => {
  const text = value ?? "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const pad = (row: Cell[], length: number): Cell[] => [...row, ...Array.from({ length: Math.max(0, length - row.length) }, () => "")];
const wide = (r: number, last: number): Merge => ({ s: { r, c: 0 }, e: { r, c: last } });

/** «Total» / «Total TG»: 3 header lines, the 12 columns, one row per period, Tháng/Ngày/Thứ merged per day. */
export function totalSheet(periods: readonly TeachingPeriodRow[], role: TeachingRole): SheetSpec {
  const last = TOTAL_COLUMNS.length - 1;
  const rows: Cell[][] = [
    pad(["CTY TNHH EDURISE GLOBAL"], TOTAL_COLUMNS.length),
    pad(["TRUNG TÂM TIN HỌC ERG"], TOTAL_COLUMNS.length),
    pad([teachingTitle("total", role)], TOTAL_COLUMNS.length),
    TOTAL_COLUMNS,
  ];
  const merges: Merge[] = [wide(0, last), wide(1, last), wide(2, last)];
  const start = rows.length;
  groupByDay(periods).forEach(({ daySpan, row }, i) => {
    const date = row.date ?? "";
    rows.push([
      daySpan > 0 ? Number(date.slice(5, 7)) : "",
      daySpan > 0 ? Number(date.slice(8, 10)) : "",
      daySpan > 0 ? weekdayVi(row.weekday) : "",
      row.periodNo ?? "",
      safeText(row.schoolName),
      hhmm(row.from),
      hhmm(row.to),
      safeText(row.className),
      safeText(row.level),
      safeText(row.subjectName),
      safeText(row.lessonContent),
      safeText(row.teacherName),
    ]);
    if (daySpan > 1) for (const c of [0, 1, 2]) merges.push({ s: { r: start + i, c }, e: { r: start + i + daySpan - 1, c } });
  });
  rows.push(pad([`Tổng cộng · ${periods.length} tiết`], TOTAL_COLUMNS.length));
  merges.push(wide(rows.length - 1, last));
  return { name: role === "ASSISTANT" ? "Total TG" : "Total", rows, merges };
}

/** «Tháng MM» / «TG Tháng MM»: 3 header lines, one column per week (however many the month has), a total row. */
export function monthSheet(sheet: TeachingMonthSheet, role: TeachingRole): SheetSpec {
  const month = sheet.month ?? "";
  const weeks = sheet.weeks ?? [];
  const items = sheet.rows ?? [];
  const width = MONTH_COLUMNS.length + weeks.length + 3;
  const range = monthRange(month);
  const weekSum = (i: number) => items.reduce((sum, r) => sum + (r.weekTotals?.[i] ?? 0), 0);
  const rows: Cell[][] = [
    pad([teachingTitle("month", role)], width),
    pad([`(Từ ngày ${formatDateVi(range.from)} đến ${formatDateVi(range.to)})`], width),
    pad([`Quyền Trưởng phòng ĐT · ${weeks.length} tuần`], width),
    [...MONTH_COLUMNS, ...weeks.map((w) => w.label ?? ""), "Tổng số tiết", "Ghi chú", "GV xác nhận"],
  ];
  items.forEach((r, i) => {
    rows.push([
      i + 1,
      safeText(r.schoolName),
      safeText(r.teacherName),
      safeText(r.subjectName),
      safeText(r.classNames),
      ...weeks.map((_, w) => r.weekTotals?.[w] || ""),
      r.total ?? 0,
      safeText(r.note ?? r.confirmation?.issueNote),
      confirmationText(r.confirmation?.status, r.confirmation?.confirmedAt).label,
    ]);
  });
  rows.push(pad(["Tổng cộng", "", "", "", "", ...weeks.map((_, w) => weekSum(w)), items.reduce((sum, r) => sum + (r.total ?? 0), 0), "Giáo viên (Ký tên)"], width));
  const totalRow = rows.length - 1;
  return {
    name: `${role === "ASSISTANT" ? "TG " : ""}Tháng ${month.slice(5, 7)}`,
    rows,
    merges: [wide(0, width - 1), wide(1, width - 1), wide(2, width - 1), { s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 4 } }, { s: { r: totalRow, c: width - 2 }, e: { r: totalRow, c: width - 1 } }],
  };
}

/** Sheet order: Total, Tháng MM…, then (only when there are assistant periods) Total TG, TG Tháng MM…. Months without rows are skipped. */
export function teachingSheets(data: TeachingExport): SheetSpec[] {
  const months = (list: readonly TeachingMonthSheet[] | undefined, role: TeachingRole) =>
    [...(list ?? [])].filter((m) => m.rows?.length).sort((a, b) => (a.month ?? "").localeCompare(b.month ?? "")).map((m) => monthSheet(m, role));
  const assistant = data.assistantPeriods ?? [];
  return [
    totalSheet(data.mainPeriods ?? [], "MAIN"),
    ...months(data.mainMonths, "MAIN"),
    ...(assistant.length ? [totalSheet(assistant, "ASSISTANT"), ...months(data.assistantMonths, "ASSISTANT")] : []),
  ];
}

/** Builds the workbook in the browser (xlsx is loaded on click) and downloads it. */
export async function saveTeachingExcel(data: TeachingExport, year: number) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  for (const sheet of teachingSheets(data)) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!merges"] = sheet.merges;
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }
  XLSX.writeFile(workbook, `cong-tiet-day-${year}.xlsx`);
}

/** Fetches the year's JSON then downloads the workbook; any failure shows one toast. */
export async function exportTeachingExcel(fetchYear: () => Promise<TeachingExport>, year: number) {
  try {
    await saveTeachingExcel(await fetchYear(), year);
  } catch {
    toast.error("Không xuất được file Excel, thử lại.");
  }
}
