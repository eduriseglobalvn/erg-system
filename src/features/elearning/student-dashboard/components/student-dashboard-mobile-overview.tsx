import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { OverviewHeroActions } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-shared";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { resolveOverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";
import { todoHeadline } from "@/features/elearning/student-dashboard/utils/assignment-board";
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

/** Phone overview (mockup hoc-sinh-tong-quan, phone frame): to-do title, the due list, then one contained button. */
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
  const [now] = useState(() => Date.now());
  // The priority task is the first row; the contained button below opens it.
  const upcoming = openAssignments.slice(0, 3);
  // Nothing assigned yet is not the same as "all handed in".
  const greetingLine = assignmentsLoading || assignmentsFailed
    ? hero.description
    : openAssignments.length === 0 && completedAssignments.length === 0
      ? copy.todayEmptyDescription
      : copy.greetingOpen(openAssignments.length);
  const empty = !assignmentsLoading && !assignmentsFailed && openAssignments.length === 0;

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography component="h1" variant="h1">Việc cần làm</Typography>
        <Typography color="textSecondary" variant="body2">{[profile.className, todoHeadline([], now)].filter(Boolean).join(" · ")}</Typography>
        <Typography color="textSecondary" variant="body2">{greetingLine}</Typography>
      </Stack>

      <Stack component="section" aria-labelledby="student-upcoming" spacing={1.5}>
        <Typography component="h2" id="student-upcoming" variant="h6">Bài sắp hết hạn</Typography>
        <Box sx={panelSx}>
          {assignmentsLoading
            ? Array.from({ length: 2 }).map((_, index) => <Skeleton height={56} key={index} sx={{ mx: 2, my: 1 }} variant="rounded" />)
            : upcoming.map((assignment, index) => (
              <UpcomingRow assignment={assignment} divider={index > 0} key={assignment.id} onOpenAssignment={onOpenAssignment} />
            ))}
          {assignmentsFailed ? <PanelNote description="Tải lại trang sau ít phút. Nếu vẫn lỗi thì báo giáo viên." title="Chưa tải được bài tập" /> : null}
          {empty ? (completedAssignments.length > 0
            ? <PanelNote description={copy.todayDoneDescription} title={copy.heroAllDone} />
            : <PanelNote description={copy.todayEmptyDescription} title={copy.heroEmpty} />) : null}
        </Box>
      </Stack>

      <OverviewHeroActions copy={copy} fullWidth hero={hero} onOpenAssignment={onOpenAssignment} onPageChange={onPageChange} />

      {announcement ? (
        <Box component="section" aria-label={copy.announcementTitle} sx={{ ...panelSx, p: 2 }}>
          <Typography color="primary.main" variant="caption">{copy.announcementTitle}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{announcement.title}</Typography>
          <Typography color="textSecondary" variant="body2" sx={{ ...clampSx, mt: 0.5 }}>{announcement.content}</Typography>
        </Box>
      ) : null}

      {/* The phone dock has no discussion tab: this is its entry point. */}
      <Button onClick={() => onPageChange("discussion")} size="small" sx={{ alignSelf: "flex-start" }} variant="text">Mở diễn đàn</Button>
    </Stack>
  );
}

function PanelNote({ description, title }: { description: string; title: string }) {
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography color="textSecondary" variant="body2" sx={{ mt: 0.5 }}>{description}</Typography>
    </Box>
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
