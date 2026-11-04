import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { OverviewHeroActions, OverviewMetrics } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-shared";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { resolveOverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const surfaceSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${ergEnterpriseTokens.radius.lg}px`,
  boxShadow: "none",
} as const;

const clampSx = { display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 } as const;

export function StudentDashboardMobileOverview({
  announcement,
  assignmentsFailed,
  assignmentsLoading,
  completedAssignments,
  copy,
  openAssignments,
  overdueAssignments,
  priorityAssignment,
  profile,
  onOpenAssignment,
  onPageChange,
}: {
  announcement: StudentTeacherAnnouncement | undefined;
  assignmentsFailed: boolean;
  assignmentsLoading: boolean;
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
  priorityAssignment?: StudentDashboardAssignment;
  profile: StudentDashboardProfile;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
}) {
  const hero = resolveOverviewHero(priorityAssignment, copy);
  const activeAssignment = priorityAssignment && priorityAssignment.status !== "submitted" ? priorityAssignment : undefined;

  return (
    <Stack spacing={1.5}>
      <Paper sx={{ ...surfaceSx, overflow: "hidden", p: 2, position: "relative" }}>
        <Box aria-hidden sx={{ bgcolor: "primary.main", bottom: 0, left: 0, position: "absolute", top: 0, width: 4 }} />
        <Chip color="primary" label={copy.heroEyebrow} size="small" variant="outlined" />
        <Typography variant="h3" sx={{ mt: 1.25 }}>
          {copy.heroTitle(profile.name.trim() || copy.learnerFallbackName)}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ ...clampSx, mt: 0.75 }}>
          {hero.description}
        </Typography>

        {activeAssignment ? (
          <Box sx={{ bgcolor: "background.default", borderRadius: 2, mt: 1.5, p: 1.25 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", display: "grid", flexShrink: 0, height: 44, placeItems: "center", width: 44 }}>
                <AutoStoriesRoundedIcon />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap variant="subtitle2">{activeAssignment.title}</Typography>
                <Typography color="text.secondary" noWrap variant="caption">{activeAssignment.statusLabel} · {activeAssignment.dueLabel}</Typography>
              </Box>
            </Stack>
            {activeAssignment.progressRate !== null ? <LinearProgress variant="determinate" value={activeAssignment.progressRate} sx={{ borderRadius: 99, height: 5, mt: 1, "& .MuiLinearProgress-bar": { borderRadius: 99 } }} /> : null}
          </Box>
        ) : null}

        <Box sx={{ mt: 1.5 }}>
          <OverviewHeroActions copy={copy} fullWidth hero={hero} onOpenAssignment={onOpenAssignment} onPageChange={onPageChange} />
        </Box>
      </Paper>

      <OverviewMetrics
        columns={{ xs: "repeat(2, minmax(0, 1fr))" }}
        completedAssignments={completedAssignments}
        copy={copy}
        gap={1.25}
        openAssignments={openAssignments}
        overdueAssignments={overdueAssignments}
        profile={profile}
      />

      <Paper sx={{ ...surfaceSx, overflow: "hidden" }}>
        <Stack direction="row" sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 1.75, py: 0.75 }}>
          <Typography variant="subtitle1">{copy.todayTitle}</Typography>
          <Button onClick={() => onPageChange("assignments")} sx={{ minHeight: 44 }} variant="text">{copy.secondaryAction}</Button>
        </Stack>
        <Stack spacing={0.25} sx={{ p: 0.75 }}>
          {assignmentsLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton height={62} key={index} sx={{ borderRadius: 2 }} variant="rounded" />) : null}
          {!assignmentsLoading && !assignmentsFailed && openAssignments.length === 0 ? <Typography color="text.secondary" variant="body2" sx={{ px: 1, py: 2, textAlign: "center" }}>{copy.heroAllDone}</Typography> : null}
          {!assignmentsLoading ? openAssignments.slice(0, 3).map((assignment) => <MobileAssignmentRow assignment={assignment} copy={copy} key={assignment.id} onOpenAssignment={onOpenAssignment} />) : null}
        </Stack>
      </Paper>

      {announcement ? (
        <Paper sx={{ ...surfaceSx, p: 1.75 }}>
          <Typography color="primary.main" variant="caption">{copy.announcementTitle}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{announcement.title}</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ ...clampSx, mt: 0.4 }}>{announcement.content}</Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}

function MobileAssignmentRow({ assignment, copy, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  return (
    <ButtonBase disabled={!assignment.quizId} onClick={() => onOpenAssignment(assignment.id)} sx={{ borderRadius: 2, display: "flex", gap: 1.25, justifyContent: "flex-start", minHeight: 62, p: 1, textAlign: "left", width: "100%", "&:hover": { bgcolor: "action.hover" } }}>
      <Box sx={{ bgcolor: assignment.status === "overdue" ? "error.light" : "info.light", borderRadius: 2, color: assignment.status === "overdue" ? "error.main" : "primary.main", display: "grid", flexShrink: 0, height: 44, placeItems: "center", width: 44 }}>
        <AutoStoriesRoundedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap variant="subtitle2">{assignment.title}</Typography>
        <Typography color="text.secondary" noWrap variant="caption">{assignment.subjectLabel ?? assignment.statusLabel} · {assignment.dueLabel}</Typography>
      </Box>
      <Typography color="primary.main" variant="caption">{copy.assignmentAction(assignment.status)}</Typography>
    </ButtonBase>
  );
}
