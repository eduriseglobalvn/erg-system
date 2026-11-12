import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import type { AssignmentFilter } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { MetricCard } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { formatTimeLeft, resolveDueMetric, type OverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";

/** The four overview metrics, shared by the desktop and mobile overview so labels and values never drift apart. */
export function OverviewMetrics({
  columns,
  completedAssignments,
  copy,
  gap = 2,
  onOpenFilter,
  openAssignments,
  overdueAssignments,
  unavailable = false,
}: {
  columns: Record<string, string>;
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  gap?: number;
  /** Makes the open / overdue / completed cards open the assignments page on that tab. */
  onOpenFilter?: (filter: AssignmentFilter) => void;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
  /** The load failed: show "—" instead of zeros that look like real numbers. */
  unavailable?: boolean;
}) {
  const total = openAssignments.length + completedAssignments.length;
  const due = resolveDueMetric([...openAssignments, ...completedAssignments]);
  return (
    <Box sx={{ display: "grid", gap, gridTemplateColumns: columns }}>
      <MetricCard icon={<AssignmentRoundedIcon fontSize="small" />} label={copy.stats.open} onClick={onOpenFilter && (() => onOpenFilter("todo"))} value={unavailable ? "—" : openAssignments.length} />
      <MetricCard icon={<ScheduleRoundedIcon fontSize="small" />} label={copy.stats.overdue} onClick={onOpenFilter && (() => onOpenFilter("overdue"))} tone="error" value={unavailable ? "—" : overdueAssignments.length} />
      <MetricCard
        icon={<EventAvailableRoundedIcon fontSize="small" />}
        label={due?.kind === "next" ? copy.stats.nextDue : copy.stats.dueDone}
        onClick={onOpenFilter && (() => onOpenFilter(due?.kind === "due" && due.done < due.total ? "overdue" : "todo"))}
        tone="info"
        value={unavailable || !due ? "—" : due.kind === "next" ? formatTimeLeft(due.msLeft) : `${due.done}/${due.total} · ${Math.round((due.done / due.total) * 100)}%`}
      />
      <MetricCard icon={<CheckCircleRoundedIcon fontSize="small" />} label={copy.stats.completed} onClick={onOpenFilter && (() => onOpenFilter("submitted"))} tone="success" value={unavailable ? "—" : `${completedAssignments.length}/${total}`} />
    </Box>
  );
}

/** Hero CTAs: never a disabled primary next to a live secondary; without a primary the secondary is the contained button. */
export function OverviewHeroActions({
  copy,
  fullWidth = false,
  hero,
  onOpenAssignment,
  onPageChange,
}: {
  copy: DashboardCopy;
  fullWidth?: boolean;
  hero: OverviewHero;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
}) {
  const { primaryAssignmentId } = hero;
  return (
    <Stack direction={fullWidth ? "column" : "row"} spacing={1.25} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {primaryAssignmentId ? (
        <Button fullWidth={fullWidth} onClick={() => onOpenAssignment(primaryAssignmentId)} sx={{ minHeight: 44 }} variant="contained">
          {copy.primaryAction}
        </Button>
      ) : null}
      <Button fullWidth={fullWidth} onClick={() => onPageChange("assignments")} sx={{ minHeight: 44 }} variant={hero.secondaryVariant}>
        {copy.secondaryAction}
      </Button>
    </Stack>
  );
}
