import { useMemo, useState } from "react";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgTabCount, ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { subjectMark } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-overview";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export type AssignmentFilter = "todo" | "submitted" | "overdue";

const TABS: { key: AssignmentFilter; label: string; empty: string }[] = [
  { key: "todo", label: "Cần làm", empty: "Bạn đã làm xong mọi bài được giao." },
  { key: "submitted", label: "Đã nộp", empty: "Bạn chưa nộp bài nào." },
  { key: "overdue", label: "Quá hạn", empty: "Không có bài nào quá hạn." },
];
const ALL_SUBJECTS = "";

export function filterAssignments(assignments: StudentDashboardAssignment[], filter: AssignmentFilter) {
  if (filter === "submitted") return assignments.filter((a) => a.status === "submitted");
  if (filter === "overdue") return assignments.filter((a) => a.status === "overdue");
  return assignments.filter((a) => a.status === "not_started" || a.status === "in_progress");
}

/** Bài tập (canvas H02): segmented status, subject chips when there is more than one subject, tappable cards. */
export function AssignmentsView({ assignments, copy, onOpenAssignment }: { assignments: StudentDashboardAssignment[]; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  const [filter, setFilter] = useState<AssignmentFilter>("todo");
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const lists = useMemo(() => ({ todo: filterAssignments(assignments, "todo"), submitted: filterAssignments(assignments, "submitted"), overdue: filterAssignments(assignments, "overdue") }), [assignments]);
  const subjects = useMemo(() => [...new Set(assignments.map((a) => a.subjectLabel).filter((s): s is string => Boolean(s)))], [assignments]);
  const activeSubject = subjects.includes(subject) ? subject : ALL_SUBJECTS;
  const list = lists[filter].filter((a) => !activeSubject || a.subjectLabel === activeSubject);
  // The one contained button on the page: the first open assignment that can actually be started.
  const urgentId = lists.todo.find((a) => a.quizId)?.id;
  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <Typography variant="h1" sx={{ pb: 0.5 }}>{copy.assignmentsTitle}</Typography>
      <Tabs aria-label="Lọc bài tập" value={filter} variant="fullWidth" onChange={(_, value: AssignmentFilter) => setFilter(value)} sx={ergSegmentedTabsSx}>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            value={tab.key}
            label={tab.label}
            iconPosition="end"
            icon={tab.key === "submitted" ? undefined : <ErgTabCount count={lists[tab.key].length} tone={tab.key === "overdue" ? "error" : "info"} />}
          />
        ))}
      </Tabs>
      {subjects.length > 1 ? (
        <Tabs aria-label="Lọc theo môn" value={activeSubject} variant="scrollable" scrollButtons={false} onChange={(_, value: string) => setSubject(value)} sx={ergChipTabsSx}>
          <Tab value={ALL_SUBJECTS} label="Tất cả" />
          {subjects.map((label) => <Tab key={label} value={label} label={label} />)}
        </Tabs>
      ) : null}
      {list.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} copy={copy} primary={filter === "todo" && assignment.id === urgentId} onOpenAssignment={onOpenAssignment} />
      ))}
      {list.length === 0 ? <ErgEmptyState icon={<AssignmentOutlined />} title="Chưa có bài trong mục này" description={TABS.find((tab) => tab.key === filter)?.empty} /> : null}
    </Stack>
  );
}

function stateLabel(a: StudentDashboardAssignment) {
  if (a.score !== null && a.maxScore !== null) return `Điểm: ${a.score}/${a.maxScore}`;
  if (a.status === "in_progress" && a.answeredCount !== null && a.totalQuestions) return `Đang làm ${a.answeredCount}/${a.totalQuestions}`;
  return a.statusLabel;
}

/** Canvas H02 card: subject tile, title + meta, due line and state, a progress bar while in progress. */
function AssignmentCard({ assignment: a, copy, primary, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; primary: boolean; onOpenAssignment: (assignmentId: string) => void }) {
  const open = () => { if (a.quizId) onOpenAssignment(a.id); };
  const due = a.dueAt ? `Hạn nộp: ${formatDateTimeVi(a.dueAt)}` : a.dueLabel;
  const meta = [a.subjectLabel, a.teacherName, a.totalQuestions ? `${a.totalQuestions} câu` : ""].filter(Boolean).join(" · ");
  const overdue = a.status === "overdue";
  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: overdue ? "error.light" : "divider", borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
      <ButtonBase disabled={!a.quizId} onClick={open} sx={{ display: "grid", justifyContent: "stretch", gap: 1, width: "100%", px: 2, py: 1.75, textAlign: "left", "&:hover": { bgcolor: t.color.surfaceMuted } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 32, height: 32, flexShrink: 0, borderRadius: `${t.radius.sm}px`, bgcolor: t.color.primarySofter, color: "primary.main", typography: "caption", fontWeight: "fontWeightBold" }}>
            {subjectMark(a.subjectLabel)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2">{a.title}</Typography>
            {meta ? <Typography color="text.secondary" variant="caption" component="p">{meta}</Typography> : null}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", pl: 5.5 }}>
          <Typography variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: overdue ? "error.main" : "text.secondary" }}>
            {due ? <ScheduleRoundedIcon aria-hidden sx={{ fontSize: t.size.iconSm }} /> : null}
            {due}
          </Typography>
          <Typography color="text.secondary" variant="caption">{stateLabel(a)}</Typography>
        </Stack>
        {a.status === "in_progress" && a.progressRate !== null ? (
          <LinearProgress
            aria-label={stateLabel(a)}
            value={a.progressRate}
            variant="determinate"
            sx={{ ml: 5.5, bgcolor: t.color.divider, borderRadius: 99, height: 6, "& .MuiLinearProgress-bar": { borderRadius: 99 } }}
          />
        ) : null}
      </ButtonBase>
      {primary ? (
        <Box sx={{ px: 2, pb: 1.75 }}>
          <Button fullWidth onClick={open} sx={{ minHeight: 44 }} variant="contained">{copy.assignmentAction(a.status)}</Button>
        </Box>
      ) : null}
    </Box>
  );
}
