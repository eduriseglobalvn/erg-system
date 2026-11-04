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

/** "—" (not "0%") while there is no graded work yet. */
export function formatAverageScore(score: number | null, completedCount: number | null): string {
  if (score === null || (score === 0 && !completedCount)) return "—";
  return `${score}%`;
}
