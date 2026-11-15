import { formatDateVi } from "@/domain/formatters/format-date";

import { shortDateVi, weekdayVi } from "../domain/class-log-week";
import type { LessonReportMatrix, LessonReportRow } from "./lesson-report-api";

export type ReportState = LessonReportRow["cells"][number]["state"];

export const reportText = {
  title: "Theo dõi báo giảng",
  states: { ON_TIME: "Đúng hạn", LATE: "Muộn", MISSING: "Chưa báo", NONE: "Không có tiết" } satisfies Record<ReportState, string>,
  marks: { ON_TIME: "✓", LATE: "Muộn", MISSING: "Chưa", NONE: "–" } satisfies Record<ReportState, string>,
  pickHint: "Chọn một ô trong bảng để xem chi tiết.",
  loadError: "Không tải được dữ liệu. Thử lại",
  empty: "Tuần này chưa có tiết nào đã dạy.",
} as const;

export const remindLabel = (n: number) => `Nhắc ${n} giáo viên`;

/** "Tuần 09 – 13/11": Monday's day number to the last day of the grid. */
export function weekTitle(days: ReadonlyArray<string>) {
  const first = days[0];
  const last = days[days.length - 1];
  return first && last ? `Tuần ${first.slice(8, 10)} – ${shortDateVi(last)}` : "";
}

/** "T2 09/11", "CN 15/11". */
export function dayHead(iso: string) {
  const name = weekdayVi(iso);
  return `${name === "Chủ nhật" ? "CN" : `T${name.slice(-1)}`} ${shortDateVi(iso)}`;
}

/** Figures of the rows on screen; periods are counted per cell, as the backend counts them. */
export function summarize(rows: ReadonlyArray<LessonReportRow>) {
  const sum = { periods: 0, onTime: 0, late: 0, missing: 0, teachers: rows.length, schools: 0, lateTeachers: 0, missingTeachers: 0 };
  const schools = new Set<string>();
  for (const row of rows) {
    row.schoolName.split(", ").filter(Boolean).forEach((s) => schools.add(s));
    sum.lateTeachers += row.cells.some((c) => c.state === "LATE") ? 1 : 0;
    sum.missingTeachers += row.cells.some((c) => c.state === "MISSING") ? 1 : 0;
    for (const cell of row.cells) {
      sum.periods += cell.periods;
      if (cell.state === "ON_TIME") sum.onTime += cell.periods;
      if (cell.state === "LATE") sum.late += cell.periods;
      if (cell.state === "MISSING") sum.missing += cell.periods;
    }
  }
  sum.schools = schools.size;
  return { ...sum, onTimePercent: sum.periods === 0 ? 0 : Math.round((sum.onTime / sum.periods) * 100) };
}

/** Share of days with a reported class log that were on time; null when the teacher has no reportable day. */
export function rowRate(row: LessonReportRow) {
  const counted = row.cells.filter((c) => c.state !== "NONE");
  return counted.length === 0 ? null : Math.round((counted.filter((c) => c.state === "ON_TIME").length / counted.length) * 100);
}

/** Colour band of the «Đúng hạn» column: under 70% red, under 100% amber, otherwise green. */
export const rateTone = (percent: number): "good" | "warn" | "bad" => (percent < 70 ? "bad" : percent < 100 ? "warn" : "good");

/** «Nhắc N giáo viên»: the teachers with at least one day not reported. */
export const remindTargets = (rows: ReadonlyArray<LessonReportRow>) => rows.filter((r) => r.cells.some((c) => c.state === "MISSING")).map((r) => r.teacherId);

/** "Quá hạn 1 ngày 9 giờ": the deadline of a day is 23:59 of that day. */
export function overdueText(date: string, now: Date) {
  const [y, m, d] = date.split("-").map(Number);
  const deadline = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 1).getTime();
  const hours = Math.max(0, Math.floor((now.getTime() - deadline) / 3_600_000));
  const days = Math.floor(hours / 24);
  return `Quá hạn ${[days ? `${days} ngày` : "", hours % 24 || !days ? `${hours % 24} giờ` : ""].filter(Boolean).join(" ")}`;
}

/** The line of the side panel that explains a cell. */
export function cellNote(state: ReportState, periods: number, date: string, now: Date) {
  if (periods === 0) return reportText.states.NONE;
  if (state === "MISSING") return `${periods} tiết chưa xác nhận · ${overdueText(date, now)}`;
  if (state === "LATE") return `${periods} tiết, có tiết xác nhận sau ngày dạy`;
  if (state === "ON_TIME") return `${periods} tiết đã xác nhận đúng hạn`;
  return `${periods} tiết chưa xác nhận · còn hạn đến 23:59 ${formatDateVi(date)}`;
}

/** Spreadsheet apps run text starting with = + - @ as a formula. */
const safe = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);

export const sheetRows = (matrix: LessonReportMatrix, rows: ReadonlyArray<LessonReportRow>): (string | number)[][] => [
  ["Giáo viên", "Trường", ...matrix.days.map(dayHead), "Đúng hạn"],
  ...rows.map((r) => [safe(r.teacherName), safe(r.schoolName), ...r.cells.map((c) => (c.periods ? `${reportText.states[c.state]} (${c.periods})` : reportText.states.NONE)), rowRate(r) === null ? "" : `${rowRate(r)}%`]),
];
