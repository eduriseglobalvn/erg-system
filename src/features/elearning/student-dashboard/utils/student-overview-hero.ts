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

/** Mean of each handed-in assignment's own percent: the same "latest handed-in attempt per assignment" the server averages. */
export function averageOfScored(assignments: StudentDashboardAssignment[]): { percent: number; count: number } | null {
  const scored = assignments.filter((a) => a.score !== null && a.maxScore);
  if (!scored.length) return null;
  const sum = scored.reduce((total, a) => total + (a.score! / a.maxScore!) * 100, 0);
  return { count: scored.length, percent: Math.round(sum / scored.length) };
}
