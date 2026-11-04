import { useMemo, useState } from "react";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { AssignmentListItem } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";

export type AssignmentFilter = "todo" | "submitted" | "overdue";

const TABS: { key: AssignmentFilter; label: string; empty: string }[] = [
  { key: "todo", label: "Chưa làm", empty: "Bạn đã làm xong mọi bài được giao." },
  { key: "submitted", label: "Đã nộp", empty: "Bạn chưa nộp bài nào." },
  { key: "overdue", label: "Quá hạn", empty: "Không có bài nào quá hạn." },
];

export function filterAssignments(assignments: StudentDashboardAssignment[], filter: AssignmentFilter) {
  if (filter === "submitted") return assignments.filter((a) => a.status === "submitted");
  if (filter === "overdue") return assignments.filter((a) => a.status === "overdue");
  return assignments.filter((a) => a.status === "not_started" || a.status === "in_progress");
}

export function AssignmentsView({ assignments, copy, onOpenAssignment }: { assignments: StudentDashboardAssignment[]; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  const [filter, setFilter] = useState<AssignmentFilter>("todo");
  const lists = useMemo(() => ({ todo: filterAssignments(assignments, "todo"), submitted: filterAssignments(assignments, "submitted"), overdue: filterAssignments(assignments, "overdue") }), [assignments]);
  const list = lists[filter];
  // The one contained button on the page: the first open assignment that can actually be started.
  const urgentId = lists.todo.find((a) => a.quizId)?.id;
  return (
    <Box sx={{ width: "100%" }}>
      <Typography component="h1" variant="h5">Bài tập và bài thi</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Theo dõi bài được giao, hạn nộp và kết quả của bạn.</Typography>
      <Tabs aria-label="Lọc bài tập" value={filter} variant="scrollable" scrollButtons={false} onChange={(_, value: AssignmentFilter) => setFilter(value)} sx={{ borderBottom: 1, borderColor: "divider", mb: 2, minHeight: 44 }}>
        {TABS.map((tab) => <Tab key={tab.key} value={tab.key} label={`${tab.label} (${lists[tab.key].length})`} sx={{ minHeight: 44, minWidth: 44 }} />)}
      </Tabs>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr" }}>
        {list.map((assignment) => <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} primary={filter === "todo" && assignment.id === urgentId} onOpenAssignment={onOpenAssignment} />)}
      </Box>
      {list.length === 0 ? <ErgEmptyState icon={<AssignmentOutlined />} title="Chưa có bài trong mục này" description={TABS.find((t) => t.key === filter)?.empty} /> : null}
    </Box>
  );
}
