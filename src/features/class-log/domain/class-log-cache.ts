import type { ClassLogPeriod, ClassLogWeek } from "../api/class-log-api";

type PeriodId = Pick<ClassLogPeriod, "eventId" | "date" | "periodNo">;

export const periodKey = (p: PeriodId) => `${p.eventId}|${p.date}|${p.periodNo}`;

export function findPeriod(week: ClassLogWeek | undefined, key: string) {
  return week?.days.flatMap((day) => day.periods).find((p) => periodKey(p) === key);
}

/** The week with one saved period swapped in (new version, new lesson title), everything else untouched. */
export function replacePeriod(week: ClassLogWeek, saved: ClassLogPeriod): ClassLogWeek {
  const key = periodKey(saved);
  return { ...week, days: week.days.map((day) => ({ ...day, periods: day.periods.map((p) => (periodKey(p) === key ? saved : p)) })) };
}
