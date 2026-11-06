import { useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { canNavigateToLmsPath } from "@/features/lms/navigation/lms-navigation";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

type HubEntry = { description: string; icon: typeof SchoolRoundedIcon; label: string; path: string };

const ASSIGN: HubEntry = {
  description: "Soạn và giao bài cho lớp hoặc nhóm học sinh.",
  icon: AssignmentTurnedInRoundedIcon,
  label: "Giao bài tập",
  path: teacherPath("/homework/assign"),
};
const EXERCISE_BANK: HubEntry = {
  description: "Tìm bài có sẵn để giao nhanh.",
  icon: FolderCopyRoundedIcon,
  label: "Kho luyện tập",
  path: teacherPath("/homework/exercise-bank"),
};
const LIST: HubEntry[] = [
  { description: "Theo dõi học sinh đã nộp và chưa nộp.", icon: InsightsRoundedIcon, label: "Tiến độ học tập", path: teacherPath("/homework/progress") },
  { description: "Danh sách lớp và học sinh.", icon: SchoolRoundedIcon, label: "Lớp học & nhóm học sinh", path: teacherPath("/homework/class") },
  { description: "Chia học sinh theo nhóm để giao bài.", icon: GroupsRoundedIcon, label: "Nhóm học sinh", path: teacherPath("/homework/student-groups") },
  { description: "Tổng hợp kết quả của lớp.", icon: FactCheckRoundedIcon, label: "Báo cáo", path: teacherPath("/reports") },
];

const cardSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 2 } as const;

/** Học tập tab of the teacher mobile dock: the only mobile entry to assigning, the exercise bank, progress, classes and reports. */
export function TeacherLearningHub() {
  const navigate = useNavigate();
  const { session } = useAuthSession("lms");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const visible = (entry: HubEntry) =>
    canNavigateToLmsPath(entry.path, session?.permissions, session?.deniedPermissions) &&
    (!needle || `${entry.label} ${entry.description}`.toLowerCase().includes(needle));
  const open = (path: string) => (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void navigate({ href: path });
  };

  const cards = [ASSIGN, EXERCISE_BANK].filter(visible);
  const rows = LIST.filter(visible);

  return (
    <Stack spacing={2} sx={{ px: { xs: 1.5, sm: 2 }, py: 2 }}>
      <ErgSearchField slotProps={{ htmlInput: { "aria-label": "Tìm nhanh" } }} placeholder="Tìm nhanh" value={query} onChange={(event) => setQuery(event.target.value)} />
      {cards.includes(ASSIGN) ? (
        <Box sx={cardSx}>
          <Typography component="h2" variant="subtitle1">{ASSIGN.label}</Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">{ASSIGN.description}</Typography>
          <ErgButton fullWidth href={ASSIGN.path} sx={{ minHeight: 44 }} variant="contained" onClick={open(ASSIGN.path)}>{ASSIGN.label}</ErgButton>
        </Box>
      ) : null}
      {cards.includes(EXERCISE_BANK) ? (
        <ButtonBase component="a" href={EXERCISE_BANK.path} sx={{ ...cardSx, alignItems: "flex-start", display: "flex", gap: 1.5, textAlign: "left" }} onClick={open(EXERCISE_BANK.path)}>
          <EXERCISE_BANK.icon aria-hidden="true" color="primary" />
          <Box>
            <Typography component="span" sx={{ display: "block" }} variant="subtitle1">{EXERCISE_BANK.label}</Typography>
            <Typography color="text.secondary" component="span" sx={{ display: "block" }} variant="body2">{EXERCISE_BANK.description}</Typography>
          </Box>
        </ButtonBase>
      ) : null}
      {rows.length ? (
        <Box sx={{ ...cardSx, p: 0 }}>
          {rows.map((entry, index) => (
            <ButtonBase
              key={entry.path}
              component="a"
              href={entry.path}
              sx={{ alignItems: "center", borderTop: index ? 1 : 0, borderColor: "divider", display: "flex", gap: 1.5, minHeight: 56, px: 2, py: 1, textAlign: "left", width: "100%" }}
              onClick={open(entry.path)}
            >
              <entry.icon aria-hidden="true" color="primary" />
              <Typography component="span" sx={{ flex: 1 }} variant="body1">{entry.label}</Typography>
              <ChevronRightRoundedIcon aria-hidden="true" color="action" />
            </ButtonBase>
          ))}
        </Box>
      ) : null}
      {!cards.length && !rows.length ? <Typography color="text.secondary" variant="body2">Không có mục phù hợp.</Typography> : null}
    </Stack>
  );
}
