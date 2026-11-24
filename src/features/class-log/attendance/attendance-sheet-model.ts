import { addDays, mondayOf } from "../domain/class-log-week";
import type { AttendanceStudent, LessonLogAbsentee, LessonLogPeriod } from "./attendance-model";

/** One cell symbol as on the paper sheet: x có mặt, K vắng không phép, P vắng có phép, "" chưa học. */
export type SheetMark = "x" | "K" | "P" | "";

type SheetPeriod = Pick<LessonLogPeriod, "date" | "eventId" | "happened" | "periodNo" | "subjectId" | "subjectName"> & {
  absentees: readonly Pick<LessonLogAbsentee, "excused" | "studentId">[];
};

export type SheetColumn = { date: string; key: string; periodNo: number; period: SheetPeriod };
export type SheetWeek = { columns: SheetColumn[]; weekStart: string };
export type SheetRow = { absentExcused: number; absentUnexcused: number; marks: SheetMark[]; student: AttendanceStudent };

/** First and last day (yyyy-MM-dd) of the month holding `iso`. */
export function monthRange(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(y ?? 1970, m ?? 1, 0).getDate();
  const prefix = iso.slice(0, 7);
  return { from: `${prefix}-01`, to: `${prefix}-${String(last).padStart(2, "0")}` };
}

/** Mondays of every backend week that overlaps [from, to]. */
export function weekStartsBetween(from: string, to: string) {
  const starts: string[] = [];
  for (let monday = mondayOf(from); monday <= to; monday = addDays(monday, 7)) starts.push(monday);
  return starts;
}

/** Columns = this subject's periods of the class inside [from, to], grouped by week; rows = roster with K/P counts. */
export function buildAttendanceSheet(
  periods: readonly SheetPeriod[],
  students: readonly AttendanceStudent[],
  filter: { from: string; subjectId?: string | null; subjectName: string; to: string },
) {
  const byKey = new Map<string, SheetColumn>();
  for (const p of periods) {
    if (p.date < filter.from || p.date > filter.to) continue;
    if (filter.subjectId && p.subjectId ? p.subjectId !== filter.subjectId : p.subjectName !== filter.subjectName) continue;
    const key = `${p.eventId}:${p.date}:${p.periodNo}`;
    if (!byKey.has(key)) byKey.set(key, { date: p.date, key, period: p, periodNo: p.periodNo });
  }
  const columns = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date) || a.periodNo - b.periodNo);

  const weeks: SheetWeek[] = [];
  for (const column of columns) {
    const weekStart = mondayOf(column.date);
    const last = weeks[weeks.length - 1];
    if (last?.weekStart === weekStart) last.columns.push(column);
    else weeks.push({ columns: [column], weekStart });
  }

  const absent = columns.map((c) => new Map(c.period.absentees.map((a) => [a.studentId, a.excused])));
  const rows: SheetRow[] = students.map((student) => {
    const marks = columns.map((c, i): SheetMark => {
      if (!c.period.happened) return "";
      const excused = absent[i].get(student.id);
      return excused === undefined ? "x" : excused ? "P" : "K";
    });
    return {
      absentExcused: marks.filter((m) => m === "P").length,
      absentUnexcused: marks.filter((m) => m === "K").length,
      marks,
      student,
    };
  });
  return { columns, rows, weeks };
}
