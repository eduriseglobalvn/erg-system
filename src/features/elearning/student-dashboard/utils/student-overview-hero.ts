import { formatDateVi } from "@/domain/formatters/format-date";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export type OverviewHero = {
  description: string;
  /** Assignment the primary CTA opens; null means the primary CTA must not render at all. */
  primaryAssignmentId: string | null;
  /** When there is no primary CTA the secondary one takes over as the page's contained button. */
  secondaryVariant: "contained" | "outlined";
};

export function resolveOverviewHero(
  assignment: StudentDashboardAssignment | undefined,
  copy: Pick<DashboardCopy, "heroAllDone" | "heroDescription" | "heroEmpty">,
): OverviewHero {
  if (!assignment) {
    return { description: copy.heroEmpty, primaryAssignmentId: null, secondaryVariant: "contained" };
  }
  if (assignment.status === "submitted") {
    return { description: copy.heroAllDone, primaryAssignmentId: null, secondaryVariant: "contained" };
  }
  const canStart = Boolean(assignment.quizId);
  return {
    description: copy.heroDescription(assignment.title, formatDateVi(assignment.dueAt)),
    primaryAssignmentId: canStart ? assignment.id : null,
    secondaryVariant: canStart ? "outlined" : "contained",
  };
}

export type DueMetric = { kind: "due"; done: number; total: number } | { kind: "next"; msLeft: number } | null;

/**
 * Replaces the average-score card: how many assignments whose deadline has come were handed in;
 * before any deadline has come, the time left to the nearest one; null without deadlines.
 */
export function resolveDueMetric(assignments: StudentDashboardAssignment[], now = Date.now()): DueMetric {
  const dated = assignments.flatMap((a) => {
    const due = a.dueAt ? Date.parse(a.dueAt) : NaN;
    return Number.isFinite(due) ? [{ a, due }] : [];
  });
  const reached = dated.filter(({ due }) => due <= now);
  if (reached.length) return { kind: "due", done: reached.filter(({ a }) => a.status === "submitted").length, total: reached.length };
  const next = Math.min(...dated.filter(({ a }) => a.status !== "submitted").map(({ due }) => due));
  return Number.isFinite(next) ? { kind: "next", msLeft: next - now } : null;
}

/** "Còn 2 ngày 3 giờ" / "Còn 5 giờ" / "Còn 20 phút". */
export function formatTimeLeft(msLeft: number): string {
  const minutes = Math.max(1, Math.floor(msLeft / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days) return hours ? `Còn ${days} ngày ${hours} giờ` : `Còn ${days} ngày`;
  return hours ? `Còn ${hours} giờ` : `Còn ${minutes} phút`;
}

/** Mean of each handed-in assignment's own percent: the same "latest handed-in attempt per assignment" the server averages. */
export function averageOfScored(assignments: StudentDashboardAssignment[]): { percent: number; count: number } | null {
  const scored = assignments.filter((a) => a.score !== null && a.maxScore);
  if (!scored.length) return null;
  const sum = scored.reduce((total, a) => total + (a.score! / a.maxScore!) * 100, 0);
  return { count: scored.length, percent: Math.round(sum / scored.length) };
}

/** "—" (not "0%") while there is no graded work yet. */
export function formatAverageScore(score: number | null, completedCount: number | null): string {
  if (score === null || (score === 0 && !completedCount)) return "—";
  return `${score}%`;
}
