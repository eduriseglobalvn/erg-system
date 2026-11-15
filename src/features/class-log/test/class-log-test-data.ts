import type { ClassLogPeriod, ClassLogWeek } from "../api/class-log-api";

export function period(over: Partial<ClassLogPeriod> = {}): ClassLogPeriod {
  return {
    eventId: "e1", date: "2026-11-09", periodNo: 1, classId: "c1", className: "6A1", subjectName: "Tin học IC3", subjectId: null, teacherName: null, ppctPeriod: 10, actualPeriod: 10,
    lessonTitle: "Bài 7", absentees: [], comment: null, status: "PENDING", late: false, happened: true, version: 0, ...over,
  };
}

export function week(periods: ClassLogPeriod[], stats: ClassLogWeek["stats"] = { taught: 0, confirmed: 0, pending: 0 }): ClassLogWeek {
  const dates = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];
  return {
    weekStart: "2026-11-09", weekEnd: "2026-11-15", weekNo: 10, stats, lagChip: null,
    days: dates.map((date) => ({ date, session: "AFTERNOON", periods: periods.filter((p) => p.date === date) })),
  };
}
