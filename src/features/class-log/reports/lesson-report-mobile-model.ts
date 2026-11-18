import type { ClassLogPeriod, ClassLogWeek } from "../api/class-log-api";
import { classLogText } from "../domain/class-log-copy";
import { shortDateVi, weekdayVi } from "../domain/class-log-week";

/** The consecutive periods of one timetable event on one day ("Tiết 1–2"): what a teacher reports in one go. */
export type PeriodGroup = {
  key: string;
  date: string;
  className: string;
  subjectName: string;
  periods: ClassLogPeriod[];
  confirmed: boolean;
  late: boolean;
  /** No period of this event has happened yet: reportable, but attendance is not available. */
  upcoming: boolean;
};

export type DayDot = "ok" | "late" | "miss" | "none";

/**
 * Periods grouped by event and day, in time order. A group keeps all its periods; one with none
 * happened yet is `upcoming` (reportable, no attendance).
 */
export function groupPeriods(week: ClassLogWeek): PeriodGroup[] {
  const groups = new Map<string, PeriodGroup>();
  for (const day of [...week.days].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const p of [...day.periods].sort((a, b) => a.periodNo - b.periodNo)) {
      const key = `${p.eventId}|${p.date}`;
      const group = groups.get(key) ?? { key, date: p.date, className: p.className, subjectName: p.subjectName, periods: [], confirmed: true, late: false, upcoming: true };
      group.upcoming &&= !p.happened;
      group.periods.push(p);
      group.confirmed &&= p.status === "CONFIRMED";
      group.late ||= p.late;
      groups.set(key, group);
    }
  }
  return [...groups.values()];
}

/** The dot under a day of the strip: something waiting wins, then late, then done. */
export function dayDot(groups: ReadonlyArray<PeriodGroup>, date: string): DayDot {
  const day = groups.filter((g) => g.date === date && !g.upcoming);
  if (day.length === 0) return "none";
  if (day.some((g) => !g.confirmed)) return "miss";
  return day.some((g) => g.late) ? "late" : "ok";
}

export const periodSpan = (g: PeriodGroup) => {
  const first = g.periods[0]?.periodNo ?? 0;
  const last = g.periods[g.periods.length - 1]?.periodNo ?? first;
  return first === last ? `Tiết ${first}` : `Tiết ${first}–${last}`;
};

/** "T5 12/11 · Tiết 1–2" (weekday as T2…T7, CN). */
export function whenText(g: PeriodGroup) {
  const name = weekdayVi(g.date);
  return `${name === "Chủ nhật" ? "CN" : `T${name.slice(-1)}`} ${shortDateVi(g.date)} · ${periodSpan(g)}`;
}

/** One line per period: "T10 · Bài 7 · …". */
export const lessonLines = (g: PeriodGroup) =>
  g.periods.map((p) => `T${p.actualPeriod} · ${p.lessonTitle || classLogText.noLesson}`);

/** "T12–13" for the save button of the sheet: `start` is the first actual period, `count` the periods of the slot. */
export const actualSpan = (start: number, count: number) => (count <= 1 ? `T${start}` : `T${start}–${start + count - 1}`);

/** Row tapped in the framework list: the picked span starts there but never runs past the last lesson. */
export const clampStart = (tapped: number, count: number, last: number) => Math.max(1, Math.min(tapped, last - count + 1));
