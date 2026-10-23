import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";

const surfaceSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "22px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
} as const;

export function StudentDashboardMobileOverview({
  announcement,
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
  const totalAssignments = openAssignments.length + completedAssignments.length;

  return (
    <Stack spacing={1.5}>
      <Paper sx={{ ...surfaceSx, overflow: "hidden", p: 2, position: "relative" }}>
        <Box aria-hidden sx={{ bgcolor: "primary.main", bottom: 0, left: 0, position: "absolute", top: 0, width: 4 }} />
        <Chip label={copy.heroEyebrow} size="small" sx={{ bgcolor: "rgba(15,108,189,0.08)", color: "primary.main", fontSize: 11, fontWeight: 800 }} />
        <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25, mt: 1.25 }}>
          {copy.heroTitle(profile.name.trim() || copy.learnerFallbackName)}
        </Typography>
        <Typography color="text.secondary" sx={{ display: "-webkit-box", fontSize: 13, lineHeight: 1.55, mt: 0.75, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
          {priorityAssignment ? copy.heroDescription(priorityAssignment.title) : copy.assignmentsDescription}
        </Typography>

        {priorityAssignment ? (
          <Box sx={{ bgcolor: "background.default", borderRadius: 2.5, mt: 1.5, p: 1.25 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", display: "grid", flexShrink: 0, height: 36, placeItems: "center", width: 36 }}>
                <AutoStoriesRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 900 }}>{priorityAssignment.title}</Typography>
                <Typography color="text.secondary" noWrap sx={{ fontSize: 11.5, fontWeight: 600 }}>{priorityAssignment.statusLabel} · {priorityAssignment.dueLabel}</Typography>
              </Box>
              <ButtonBase aria-label={copy.priority.action} disabled={!priorityAssignment.quizId} onClick={() => onOpenAssignment(priorityAssignment.id)} sx={{ bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", height: 36, width: 36 }}>
                <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />
              </ButtonBase>
            </Stack>
            {priorityAssignment.progressRate !== null ? <LinearProgress variant="determinate" value={priorityAssignment.progressRate} sx={{ borderRadius: 99, height: 5, mt: 1, "& .MuiLinearProgress-bar": { borderRadius: 99 } }} /> : null}
          </Box>
        ) : null}

        <Button fullWidth variant="contained" onClick={() => priorityAssignment?.quizId ? onOpenAssignment(priorityAssignment.id) : onPageChange("assignments")} sx={{ borderRadius: 2.5, fontWeight: 900, mt: 1.5, minHeight: 42, textTransform: "none" }}>
          {priorityAssignment?.quizId ? copy.primaryAction : copy.secondaryAction}
        </Button>
      </Paper>

      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <MobileMetric icon={<AssignmentRoundedIcon />} label={copy.stats.open} value={openAssignments.length} />
        <MobileMetric icon={<ScheduleRoundedIcon />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MobileMetric icon={<CheckCircleRoundedIcon />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${totalAssignments}`} />
        <MobileMetric icon={<SchoolRoundedIcon />} label={copy.stats.average} tone="info" value={profile.averageScore ?? "—"} />
      </Box>

      <Paper sx={{ ...surfaceSx, overflow: "hidden" }}>
        <Stack direction="row" sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 1.75, py: 1.4 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{copy.todayTitle}</Typography>
          <Button onClick={() => onPageChange("assignments")} size="small" sx={{ fontSize: 12, fontWeight: 800, minWidth: 0, textTransform: "none" }}>{copy.secondaryAction}</Button>
        </Stack>
        <Stack spacing={0.25} sx={{ p: 0.75 }}>
          {assignmentsLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton height={62} key={index} sx={{ borderRadius: 2 }} variant="rounded" />) : null}
          {!assignmentsLoading && openAssignments.length === 0 ? <Typography color="text.secondary" sx={{ fontSize: 13, px: 1, py: 2, textAlign: "center" }}>{copy.assignmentsDescription}</Typography> : null}
          {!assignmentsLoading ? openAssignments.slice(0, 3).map((assignment) => <MobileAssignmentRow assignment={assignment} copy={copy} key={assignment.id} onOpenAssignment={onOpenAssignment} />) : null}
        </Stack>
      </Paper>

      {announcement ? (
        <Paper sx={{ ...surfaceSx, p: 1.75 }}>
          <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{copy.announcementTitle}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 900, mt: 0.6 }}>{announcement.title}</Typography>
          <Typography color="text.secondary" sx={{ display: "-webkit-box", fontSize: 12.5, lineHeight: 1.5, mt: 0.4, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{announcement.content}</Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}

function MobileMetric({ icon, label, tone = "primary", value }: { icon: ReactNode; label: string; tone?: "primary" | "error" | "success" | "info"; value: ReactNode }) {
  const colors = { error: "#D92D20", info: "#0284C7", primary: "#0F6CBD", success: "#15803D" };
  const color = colors[tone];
  return (
    <Paper sx={{ ...surfaceSx, boxShadow: "0 8px 22px rgba(15,23,42,0.045)", minHeight: 104, p: 1.5 }}>
      <Box sx={{ alignItems: "center", bgcolor: `${color}14`, borderRadius: 2, color, display: "flex", height: 34, justifyContent: "center", width: 34, "& svg": { fontSize: 19 } }}>{icon}</Box>
      <Typography sx={{ color: "text.primary", fontSize: 20, fontWeight: 900, lineHeight: 1, mt: 1.2 }}>{value}</Typography>
      <Typography color="text.secondary" noWrap sx={{ fontSize: 10.5, fontWeight: 800, mt: 0.65, textTransform: "uppercase" }}>{label}</Typography>
    </Paper>
  );
}

function MobileAssignmentRow({ assignment, copy, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  return (
    <ButtonBase disabled={!assignment.quizId} onClick={() => onOpenAssignment(assignment.id)} sx={{ borderRadius: 2.5, display: "flex", gap: 1.25, justifyContent: "flex-start", minHeight: 62, p: 1, textAlign: "left", width: "100%", "&:hover": { bgcolor: "action.hover" } }}>
      <Box sx={{ bgcolor: assignment.status === "overdue" ? "error.light" : "info.light", borderRadius: 2, color: assignment.status === "overdue" ? "error.main" : "primary.main", display: "grid", flexShrink: 0, height: 40, placeItems: "center", width: 40 }}>
        <AutoStoriesRoundedIcon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 900 }}>{assignment.title}</Typography>
        <Typography color="text.secondary" noWrap sx={{ fontSize: 11.5, fontWeight: 600, mt: 0.25 }}>{assignment.subjectLabel ?? assignment.statusLabel} · {assignment.dueLabel}</Typography>
      </Box>
      <Typography color="primary.main" sx={{ fontSize: 11.5, fontWeight: 900 }}>{copy.assignmentAction(assignment.status)}</Typography>
    </ButtonBase>
  );
}
