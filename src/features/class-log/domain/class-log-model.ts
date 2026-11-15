import type { ClassLogDay, ClassLogPeriod, ClassLogWeek } from "../api/class-log-api";
import { dayMeta } from "./class-log-copy";
import { shortDateVi, weekDates, weekdayVi } from "./class-log-week";

export type DayRow = { kind: "day"; date: string; weekday: string; shortDate: string; meta: string; empty: boolean };
export type PeriodRow = { kind: "period"; period: ClassLogPeriod; key: string };
export type TeacherRow = DayRow | PeriodRow;

/** Monday to Saturday (Sunday only when it has periods), each day with its own heading even when the timetable is empty. */
export function buildDays(week: ClassLogWeek): ClassLogDay[] {
  const byDate = new Map(week.days.map((day) => [day.date, day]));
  const includeSunday = week.days.some((day) => weekdayVi(day.date) === "Chủ nhật" && day.periods.length > 0);
  return weekDates(week.weekStart, includeSunday).map((date) => byDate.get(date) ?? { date, session: null, periods: [] });
}

export function buildTeacherRows(week: ClassLogWeek): TeacherRow[] {
  return buildDays(week).flatMap<TeacherRow>((day) => {
    const periods = [...day.periods].sort((a, b) => a.periodNo - b.periodNo);
    const heading: DayRow = {
      kind: "day", date: day.date, weekday: weekdayVi(day.date), shortDate: shortDateVi(day.date),
      meta: dayMeta(day.session, periods.length), empty: periods.length === 0,
    };
    return [heading, ...periods.map<PeriodRow>((period) => ({ kind: "period", period, key: `${period.eventId}|${period.date}|${period.periodNo}` }))];
  });
}

/** Weekly figures of the class book (display only): absence counts and the periods nobody signed. */
export function summarizeClassWeek(week: ClassLogWeek) {
  const periods = week.days.flatMap((d) => d.periods);
  const absences = periods.flatMap((p) => p.absentees);
  const excused = absences.filter((a) => a.excused).length;
  const unsigned = periods.filter((p) => p.happened && p.status !== "CONFIRMED");
  return {
    absenceText: absences.length === 0 ? "Không" : `${absences.length} lượt · ${excused}P; ${absences.length - excused}K`,
    unsignedText: unsigned.length === 0 ? "0" : `${unsigned.length} (${[...new Set(unsigned.map((p) => p.subjectName))].join(", ")})`,
    unsignedCount: unsigned.length,
  };
}
