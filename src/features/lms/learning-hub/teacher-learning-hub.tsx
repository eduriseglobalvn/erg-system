import type { MouseEvent, ReactNode } from "react";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { AssignmentRun } from "@/domain/school/classroom-types";
import { useLmsTeacherShellModel } from "@/features/lms/components/lms-teacher-shell-context";
import { canNavigateToLmsPath } from "@/features/lms/navigation/lms-navigation";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type HubEntry = { icon: ReactNode; label: string; path: string; primary?: boolean };

// Design N7: 3 × 2 tiles; "Giao bài" is the page's one solid action.
const ENTRIES: HubEntry[] = [
  { icon: <AddTaskRoundedIcon />, label: "Giao bài", path: teacherPath("/homework/assign"), primary: true },
  { icon: <LibraryBooksRoundedIcon />, label: "Kho luyện tập", path: teacherPath("/homework/exercise-bank") },
  { icon: <BarChartRoundedIcon />, label: "Báo cáo lớp học", path: teacherPath("/reports") },
  { icon: <InsightsRoundedIcon />, label: "Tiến độ học tập", path: teacherPath("/homework/progress") },
  { icon: <GroupsRoundedIcon />, label: "Lớp học", path: teacherPath("/homework/class") },
  { icon: <Diversity3RoundedIcon />, label: "Nhóm học sinh", path: teacherPath("/homework/student-groups") },
];

const cardSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px` } as const;

/** Học tập tab of the teacher mobile dock: entry tiles plus the class's open activities. */
export function TeacherLearningHub() {
  // Same permission source as the dock tab that leads here.
  const { deniedPermissions, grantedPermissions, navigate, runs = [] } = useLmsTeacherShellModel();
  const open = (path: string) => (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void navigate({ href: path });
  };
  const entries = ENTRIES.filter((entry) => canNavigateToLmsPath(entry.path, grantedPermissions, deniedPermissions));
  const progressPath = teacherPath("/homework/progress");
  const canOpenProgress = canNavigateToLmsPath(progressPath, grantedPermissions, deniedPermissions);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, px: 2, py: 1 }}>
      {entries.length ? (
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {entries.map((entry) => (
            <ButtonBase
              component="a"
              href={entry.path}
              key={entry.path}
              onClick={open(entry.path)}
              sx={{
                ...cardSx,
                alignItems: "center",
                bgcolor: entry.primary ? "primary.main" : "background.paper",
                borderColor: entry.primary ? "primary.main" : "divider",
                color: entry.primary ? "primary.contrastText" : "text.primary",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                minHeight: 84,
                pb: 1.25,
                pt: 1.5,
                px: 0.5,
                textAlign: "center",
              }}
            >
              <Box aria-hidden sx={{ alignItems: "center", bgcolor: entry.primary ? (theme) => alpha(theme.palette.common.white, 0.18) : t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: entry.primary ? "inherit" : "primary.main", display: "flex", height: 40, justifyContent: "center", width: 40 }}>
                {entry.icon}
              </Box>
              <Typography component="span" sx={{ lineHeight: 1.25 }} variant="caption">{entry.label}</Typography>
            </ButtonBase>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" variant="body2">Tài khoản chưa được cấp quyền cho mục Học tập.</Typography>
      )}

      <Box component="section" aria-labelledby="learning-hub-open" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <Typography component="h2" id="learning-hub-open" variant="h6">Đang mở</Typography>
          <Box component="span" sx={{ bgcolor: t.statusTint.info.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.info.color, lineHeight: "20px", minWidth: 20, px: 0.75, textAlign: "center", typography: "caption", fontWeight: "fontWeightBold" }}>{runs.length}</Box>
        </Box>
        {runs.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Lớp chưa có hoạt động đang mở. Bấm “Giao bài” để bắt đầu.</Typography>
        ) : (
          runs.map((run) => {
            const href = `${progressPath}?assignmentId=${encodeURIComponent(run.id)}`;
            return <RunCard href={href} key={run.id} onOpen={canOpenProgress ? open(href) : undefined} run={run} />;
          })
        )}
      </Box>
    </Box>
  );
}

function RunCard({ href, onOpen, run }: { href: string; onOpen?: (event: MouseEvent) => void; run: AssignmentRun }) {
  const body = (
    <>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5 }}>
        <Box aria-hidden sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.sm}px`, color: "primary.main", display: "flex", flexShrink: 0, height: 32, justifyContent: "center", width: 32 }}>
          <QuizRoundedIcon sx={{ fontSize: t.size.iconMd }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{run.title}</Typography>
          <Typography color="text.secondary" component="div" variant="caption">{[run.targetLevel, run.subjectLabel].filter(Boolean).join(" · ")}</Typography>
        </Box>
        {run.dueLabel ? <ErgStatusChip label={run.dueLabel} tone="warning" /> : null}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 5.5 }}>
        <Box sx={{ color: "text.secondary", display: "flex", justifyContent: "space-between", typography: "caption" }}>
          <span>Đã nộp <Box component="b" sx={{ color: "text.primary", fontVariantNumeric: "tabular-nums" }}>{run.submittedCount}</Box></span>
          {run.needsReviewCount ? <span>{run.needsReviewCount} cần xem</span> : null}
        </Box>
        <LinearProgress aria-label={`Hoàn thành ${run.completionRate}%`} value={Math.min(100, Math.max(0, run.completionRate))} variant="determinate" sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, height: 6, "& .MuiLinearProgress-bar": { borderRadius: `${t.radius.chip}px` } }} />
      </Box>
    </>
  );
  const sx = { ...cardSx, alignItems: "stretch", display: "flex", flexDirection: "column", gap: 1, px: 2, py: 1.75, textAlign: "left" } as const;
  return onOpen ? <ButtonBase component="a" href={href} onClick={onOpen} sx={sx}>{body}</ButtonBase> : <Box sx={sx}>{body}</Box>;
}
