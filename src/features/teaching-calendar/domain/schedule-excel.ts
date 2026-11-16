import { toast } from "sonner";

import type { TeachingOverviewGrid } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { buildOverviewRows } from "./overview-model";
import { addDaysToDate, dayLabel, weekdayName } from "./schedule-copy";
import { WEEKDAYS, type GridRow } from "./schedule-grid-model";

type Cell = string | number;
type Merge = { s: { r: number; c: number }; e: { r: number; c: number } };
export type SheetSpec = { merges: Merge[]; name: string; rows: Cell[][] };

type Line = { assistantName?: string | null; className?: string | null; roomName?: string | null; teacherName?: string | null };
/** Mot hang Thu / Buoi / Tiet / Gio cua mot truong, dung chung cho bang tong va luoi xep lich. */
type SheetRow = { date: string; items: readonly Line[]; note: string; periodNo: number; session: string; time: string; weekday: number };

export const SHEET_HEADERS = ["Thứ", "Buổi", "Tiết", "Giờ", "Lớp", "Phòng", "Giáo viên", "Trợ giảng", "Ghi chú"] as const;

/** Spreadsheet apps run text starting with = + - @ as a formula. */
export const safeText = (value: string | null | undefined): string => {
  const text = value ?? "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

/** Ten sheet <= 31 ky tu, bo `[]:*?/\`, khong trung (khong phan biet hoa thuong). */
export function sheetName(raw: string, used: Set<string>): string {
  const base = raw.replace(/[[\]:*?\/\\]/g, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "").slice(0, 31).trim() || "Trường";
  let name = base;
  for (let n = 2; used.has(name.toLowerCase()); n += 1) {
    const suffix = ` (${n})`;
    name = `${base.slice(0, 31 - suffix.length).trim()}${suffix}`;
  }
  used.add(name.toLowerCase());
  return name;
}

const join = (items: readonly Line[], pick: (item: Line) => string | null | undefined) => items.map(pick).filter(Boolean).join(" / ");

/** Layout nhu man hinh: Thu va Buoi gop o (!merges), moi truong mot sheet. */
function buildSheet(name: string, title: string, list: readonly SheetRow[]): SheetSpec {
  const rows: Cell[][] = [[safeText(title)], [...SHEET_HEADERS]];
  const merges: Merge[] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: SHEET_HEADERS.length - 1 } }];
  const first = rows.length;
  const span = (c: number, from: number, to: number) => { if (to > from) merges.push({ s: { r: first + from, c }, e: { r: first + to, c } }); };
  let dayStart = 0;
  let sessionStart = 0;
  list.forEach((row, i) => {
    const newDay = i === 0 || list[i - 1].weekday !== row.weekday;
    const newSession = newDay || list[i - 1].session !== row.session;
    if (newDay && i > 0) span(0, dayStart, i - 1);
    if (newSession && i > 0) span(1, sessionStart, i - 1);
    if (newDay) dayStart = i;
    if (newSession) sessionStart = i;
    rows.push([
      newDay ? `${weekdayName(row.weekday)} ${row.date}`.trim() : "",
      newSession ? (row.session === "MORNING" ? "Sáng" : "Chiều") : "",
      row.periodNo,
      row.time,
      safeText(join(row.items, (item) => item.className)),
      safeText(join(row.items, (item) => item.roomName)),
      safeText(join(row.items, (item) => item.teacherName)),
      safeText(join(row.items, (item) => (item.assistantName ? `TG ${item.assistantName}` : ""))),
      safeText(row.note),
    ]);
  });
  if (list.length) { span(0, dayStart, list.length - 1); span(1, sessionStart, list.length - 1); }
  return { merges, name, rows };
}

const timeOf = (slot: { endTime?: string | null; startTime?: string | null }) => (slot.startTime ? `${slot.startTime}–${slot.endTime ?? ""}` : "");
const dateOf = (weekStart: string, weekday: number) => dayLabel(addDaysToDate(weekStart, weekday - 1)).split(", ")[1] ?? "";

/** Bang tong: mot sheet moi truong dang hien tren man hinh (4 cot Lop/Phong/GV/Tro giang + Ghi chu). */
export function overviewSheets(grid: TeachingOverviewGrid): SheetSpec[] {
  const rows = buildOverviewRows(grid);
  const used = new Set<string>();
  return grid.schools.map((school) => buildSheet(
    sheetName(school.schoolName ?? "", used),
    `${school.schoolName ?? ""} · ${school.periodCount} tiết`,
    rows.map((row) => ({
      date: dateOf(grid.weekStart, row.weekday), items: row.cells.get(school.schoolId) ?? [],
      note: [row.holiday, row.note].filter(Boolean).join(" · "), periodNo: row.slot.periodNo, session: row.slot.session, time: timeOf(row.slot), weekday: row.weekday,
    })),
  ));
}

/** Trang xep lich: ban nhap dang co trong bo nho cua mot truong, cung layout (mot sheet). */
export function scheduleSheet(input: { rows: readonly GridRow[]; schoolName: string; template: TeachingPeriodTemplate; weekStart: string }): SheetSpec {
  const slots = [...input.template.slots].filter((slot) => slot.startTime).sort((a, b) => a.periodNo - b.periodNo);
  const list = WEEKDAYS.flatMap((weekday) => slots.map((slot): SheetRow => ({
    date: dateOf(input.weekStart, weekday),
    items: input.rows.filter((row) => row.weekday === weekday && row.periodNo === slot.periodNo).map((row) => ({ ...row, roomName: row.roomName ?? row.newRoomName })),
    note: input.rows.filter((row) => row.weekday === weekday && row.periodNo === slot.periodNo).map((row) => row.note?.trim()).filter(Boolean).join(" · "),
    periodNo: slot.periodNo, session: slot.session, time: timeOf(slot), weekday,
  })));
  return buildSheet(sheetName(input.schoolName, new Set()), input.schoolName ? `${input.schoolName} · ${input.rows.length} tiết` : `${input.rows.length} tiết`, list);
}

/** Builds the workbook in the browser (xlsx is loaded on click), no styling, and downloads it. */
export async function saveSheets(sheets: readonly SheetSpec[], fileName: string) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!merges"] = sheet.merges;
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }
  XLSX.writeFile(workbook, fileName);
}

export async function exportSheets(build: () => SheetSpec[], fileName: string) {
  try {
    await saveSheets(build(), fileName);
  } catch {
    toast.error("Không xuất được file Excel, thử lại.");
  }
}

export const overviewFileName = (weekStart: string) => `thoi-khoa-bieu-tuan-${weekStart}.xlsx`;
