import { StudentDashboardMobileOverview } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-overview";
import { OverviewView } from "@/features/elearning/student-dashboard/components/student-dashboard-content-views";
import type { DashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import type { getDiscussionOverviewPreview } from "@/features/elearning/student-dashboard/utils/discussion-overview";

export function StudentDashboardOverviewSurface({
  announcement,
  assignmentsLoading,
  completedAssignments,
  copy,
  discussionPreview,
  openAssignments,
  overdueAssignments,
  priorityAssignment,
  profile,
  surface,
  onOpenAssignment,
  onPageChange,
}: {
  announcement: StudentTeacherAnnouncement | undefined;
  assignmentsLoading: boolean;
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  discussionPreview: ReturnType<typeof getDiscussionOverviewPreview>;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
  priorityAssignment?: StudentDashboardAssignment;
  profile: StudentDashboardProfile;
  surface: DashboardSurface;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
}) {
  if (surface === "mobile-web") {
    return (
      <StudentDashboardMobileOverview
        announcement={announcement}
        assignmentsLoading={assignmentsLoading}
        completedAssignments={completedAssignments}
        copy={copy}
        openAssignments={openAssignments}
        overdueAssignments={overdueAssignments}
        priorityAssignment={priorityAssignment}
        profile={profile}
        onOpenAssignment={onOpenAssignment}
        onPageChange={onPageChange}
      />
    );
  }

  return (
    <OverviewView
      announcement={announcement}
      assignmentsLoading={assignmentsLoading}
      completedAssignments={completedAssignments}
      copy={copy}
      discussionPreview={discussionPreview}
      openAssignments={openAssignments}
      overdueAssignments={overdueAssignments}
      priorityAssignment={priorityAssignment}
      profile={profile}
      onOpenAssignment={onOpenAssignment}
      onPageChange={onPageChange}
    />
  );
}
