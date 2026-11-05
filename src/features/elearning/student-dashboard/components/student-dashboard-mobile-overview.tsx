import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { OverviewHeroActions } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-shared";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { resolveOverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const panelSx = {
  bgcolor: "background.paper",
  border: `1px solid ${t.color.border}`,
  borderRadius: `${t.radius.card}px`,
} as const;

const clampSx = { display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 } as const;

/** Short tile text for a subject, e.g. "MOS Excel" -> "X", "IC3 GS6" -> "IC3". */
export function subjectMark(label = "") {
  const value = label.toLowerCase();
  if (value.includes("ic3")) return "IC3";
  if (value.includes("excel")) return "X";
  if (value.includes("word")) return "W";
  if (value.includes("powerpoint")) return "P";
  return label.trim().charAt(0).toUpperCase() || "B";
}

function SubjectTile({ label, size = 40 }: { label?: string; size?: number }) {
  const mark = subjectMark(label);
  return (
    <Box
      aria-hidden
      sx={{
        alignItems: "center",
        bgcolor: t.color.primarySofter,
        borderRadius: `${t.radius.control}px`,
        color: "primary.dark",
        display: "flex",
        flexShrink: 0,
        height: size,
        justifyContent: "center",
        typography: mark.length > 1 ? "caption" : "subtitle1",
        fontWeight: "fontWeightBold",
        width: size,
      }}
    >
      {mark}
    </Box>
  );
}

/** Phone overview (design canvas): greeting, the one task to continue, then what is due next. */
export function StudentDashboardMobileOverview({
  announcement,
  assignmentsFailed,
  assignmentsLoading,
  completedAssignments,
  copy,
  openAssignments,
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
  const upcoming = openAssignments.filter((assignment) => assignment.id !== activeAssignment?.id).slice(0, 3);
  // Nothing assigned yet is not the same as "all handed in".
  const greetingLine = assignmentsLoading || assignmentsFailed
    ? hero.description
    : openAssignments.length === 0 && completedAssignments.length === 0
      ? copy.todayEmptyDescription
      : copy.greetingOpen(openAssignments.length);
  const name = profile.name.trim().split(/\s+/).slice(-2).join(" ") || copy.learnerFallbackName;

  return (
    <Stack spacing={2.5}>
      <Typography component="h1" sx={{ typography: "h2" }}>
        {copy.greetingLead(name)}
        <Box component="span" sx={{ color: "text.secondary", display: "block", fontWeight: "fontWeightMedium" }}>
          {greetingLine}
        </Box>
      </Typography>

      <Stack component="section" aria-label={copy.heroEyebrow} spacing={1.75} sx={{ ...panelSx, p: 2 }}>
        {activeAssignment ? (
          <>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <SubjectTile label={activeAssignment.subjectLabel} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ ...clampSx, typography: "subtitle1" }}>{activeAssignment.title}</Typography>
                <Typography color="text.secondary" noWrap variant="caption" component="p">
                  {[activeAssignment.subjectLabel, activeAssignment.teacherName].filter(Boolean).join(" · ") || activeAssignment.statusLabel}
                </Typography>
              </Box>
            </Stack>
            {activeAssignment.dueLabel ? (
              <Box
                sx={{
                  alignItems: "center",
                  alignSelf: "flex-start",
                  bgcolor: t.statusTint.warning.bg,
                  borderRadius: `${t.radius.chip}px`,
                  color: t.statusTint.warning.color,
                  display: "inline-flex",
                  gap: 0.75,
                  px: 1.25,
                  py: 0.25,
                  typography: "caption",
                }}
              >
                <ScheduleRoundedIcon fontSize="inherit" />
                {activeAssignment.dueLabel}
              </Box>
            ) : null}
            {activeAssignment.progressRate !== null ? (
              <Stack spacing={0.75}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="caption">{activeAssignment.statusLabel}</Typography>
                  <Typography variant="caption">{Math.round(activeAssignment.progressRate)}%</Typography>
                </Stack>
                <LinearProgress
                  aria-label={activeAssignment.statusLabel}
                  value={activeAssignment.progressRate}
                  variant="determinate"
                  sx={{ bgcolor: t.color.divider, borderRadius: 99, height: 6, "& .MuiLinearProgress-bar": { borderRadius: 99 } }}
                />
              </Stack>
            ) : null}
          </>
        ) : (
          <Typography sx={{ typography: "subtitle1" }}>{hero.description}</Typography>
        )}
        <OverviewHeroActions copy={copy} fullWidth hero={hero} onOpenAssignment={onOpenAssignment} onPageChange={onPageChange} />
      </Stack>

      {assignmentsLoading || upcoming.length > 0 ? (
        <Stack component="section" aria-labelledby="student-upcoming" spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography component="h2" id="student-upcoming" variant="h5">{copy.upcomingTitle}</Typography>
            <Button onClick={() => onPageChange("assignments")} size="small" variant="text">{copy.secondaryAction}</Button>
          </Stack>
          <Box sx={panelSx}>
            {assignmentsLoading
              ? Array.from({ length: 2 }).map((_, index) => <Skeleton height={56} key={index} sx={{ mx: 2, my: 1 }} variant="rounded" />)
              : upcoming.map((assignment, index) => (
                <UpcomingRow assignment={assignment} divider={index > 0} key={assignment.id} onOpenAssignment={onOpenAssignment} />
              ))}
          </Box>
        </Stack>
      ) : null}

      {announcement ? (
        <Box component="section" aria-label={copy.announcementTitle} sx={{ ...panelSx, p: 2 }}>
          <Typography color="primary.main" variant="caption">{copy.announcementTitle}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{announcement.title}</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ ...clampSx, mt: 0.5 }}>{announcement.content}</Typography>
        </Box>
      ) : null}
    </Stack>
  );
}

function UpcomingRow({ assignment, divider, onOpenAssignment }: { assignment: StudentDashboardAssignment; divider: boolean; onOpenAssignment: (assignmentId: string) => void }) {
  const overdue = assignment.status === "overdue";
  return (
    <ButtonBase
      disabled={!assignment.quizId}
      onClick={() => onOpenAssignment(assignment.id)}
      sx={{
        borderTop: divider ? `1px solid ${t.color.divider}` : "none",
        display: "flex",
        gap: 1.5,
        justifyContent: "flex-start",
        minHeight: 64,
        px: 2,
        py: 1.5,
        textAlign: "left",
        width: "100%",
        "&:hover": { bgcolor: t.color.surfaceMuted },
      }}
    >
      <SubjectTile label={assignment.subjectLabel} size={36} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap variant="subtitle2">{assignment.title}</Typography>
        <Typography color={overdue ? "error.main" : "text.secondary"} noWrap variant="caption" component="p">
          {[assignment.subjectLabel, assignment.dueLabel].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
      <ChevronRightRoundedIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
    </ButtonBase>
  );
}
