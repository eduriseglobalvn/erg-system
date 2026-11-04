import type { AssignmentRun, ClassroomStudent } from "@/domain/school/classroom-types";

export type ReportPeriod = "7" | "30" | "all";

const DAY_MS = 86_400_000;

/** Keeps runs whose due date falls inside the period; runs with an unparsable due label are kept. */
export function filterRunsByPeriod(runs: AssignmentRun[], period: ReportPeriod, now: Date = new Date()): AssignmentRun[] {
  if (period === "all") return runs;
  const since = now.getTime() - Number(period) * DAY_MS;
  return runs.filter((run) => {
    const due = Date.parse(run.dueLabel);
    return Number.isNaN(due) || due >= since;
  });
}

export function buildSubmissionTrend(runs: AssignmentRun[]) {
  return runs.map((run) => ({
    completionRate: Math.round(Math.max(0, Math.min(100, run.completionRate))),
    name: run.title.length > 18 ? `${run.title.slice(0, 17)}…` : run.title,
  }));
}

/** Students flagged "support" with real progress data, weakest first. */
export function studentsNeedingSupport(students: ClassroomStudent[], limit = 8): ClassroomStudent[] {
  return students
    .filter((student) => student.status === "support")
    .sort((left, right) => left.progressRate - right.progressRate)
    .slice(0, limit);
}
