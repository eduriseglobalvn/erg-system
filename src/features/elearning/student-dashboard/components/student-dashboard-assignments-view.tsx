import { useEffect, useMemo, useRef, useState } from "react";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgTabCount, ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { OverdueBoard } from "@/features/elearning/student-dashboard/components/student-assignment-overdue";
import { SubmittedBoard } from "@/features/elearning/student-dashboard/components/student-assignment-submitted";
import { TodoBoard } from "@/features/elearning/student-dashboard/components/student-assignment-todo";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { todoHeadline } from "@/features/elearning/student-dashboard/utils/assignment-board";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export type AssignmentFilter = "todo" | "submitted" | "overdue";

const TABS: { key: AssignmentFilter; label: string; empty: string }[] = [
  { key: "todo", label: "Cần làm", empty: "Bạn đã làm xong mọi bài được giao." },
  { key: "submitted", label: "Đã nộp", empty: "Bạn chưa nộp bài nào." },
  { key: "overdue", label: "Quá hạn", empty: "Không có bài nào quá hạn." },
];
const ALL_SUBJECTS = "";
const SUBMITTED_SUBTITLE = "Điểm của từng bài là lần nộp gần nhất. Bấm “Xem bài làm” để xem từng câu đúng, sai.";

export function filterAssignments(assignments: StudentDashboardAssignment[], filter: AssignmentFilter) {
  if (filter === "submitted") return assignments.filter((a) => a.status === "submitted");
  if (filter === "overdue") return assignments.filter((a) => a.status === "overdue");
  return assignments.filter((a) => a.status === "not_started" || a.status === "in_progress");
}

function SearchBox({ placeholder, value, onChange, mobile }: { placeholder: string; value: string; onChange: (value: string) => void; mobile: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.control}px`, display: "flex", gap: 1, height: t.size.controlMd, px: 1.5, width: mobile ? "100%" : 280 }}>
      <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: t.size.iconMd }} />
      <InputBase fullWidth inputProps={{ "aria-label": placeholder }} inputRef={ref} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} sx={{ typography: "body2" }} value={value} />
      {mobile ? null : <Box component="kbd" sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.xs}px`, color: "text.secondary", px: 0.75, typography: "caption" }}>Ctrl K</Box>}
    </Box>
  );
}

/** Bài tập (canvas H10/H09/H11 web, H02c/H02b/H02d mobile): status tabs, subject chips, one board per tab. */
export function AssignmentsView({ assignments, copy, hasMore = false, initialFilter = "todo", loadingMore = false, mobile = false, onAskTeacher, onLoadMore, onOpenAssignment }: {
  assignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  /** The backend holds more assignments than this list (it sends 50 at a time, oldest due first). */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  initialFilter?: AssignmentFilter;
  mobile?: boolean;
  onAskTeacher?: () => void;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  const [filter, setFilter] = useState<AssignmentFilter>(initialFilter);
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const lists = useMemo(() => ({ todo: filterAssignments(assignments, "todo"), submitted: filterAssignments(assignments, "submitted"), overdue: filterAssignments(assignments, "overdue") }), [assignments]);
  const subjects = useMemo(() => [...new Set(assignments.map((a) => a.subjectLabel).filter((s): s is string => Boolean(s)))], [assignments]);
  const activeSubject = subjects.includes(subject) ? subject : ALL_SUBJECTS;
  const needle = query.trim().toLowerCase();
  const list = lists[filter].filter((a) => (!activeSubject || a.subjectLabel === activeSubject) && (!needle || `${a.title} ${a.subjectLabel ?? ""}`.toLowerCase().includes(needle)));
  const subtitle = filter === "submitted" ? SUBMITTED_SUBTITLE : todoHeadline(lists.todo, now);
  const search = <SearchBox mobile={mobile} onChange={setQuery} placeholder={filter === "submitted" ? "Tìm bài đã nộp" : "Tìm bài tập"} value={query} />;
  return (
    <Stack spacing={mobile ? 1.5 : 2} sx={{ width: "100%" }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h1">{copy.assignmentsTitle}</Typography>
          {mobile ? null : <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body1">{subtitle}</Typography>}
        </Box>
        {mobile ? (
          <IconButton aria-label="Tìm bài tập" onClick={() => setSearchOpen((open) => !open)} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", height: t.size.controlLg, width: t.size.controlLg }}>
            <SearchRoundedIcon />
          </IconButton>
        ) : search}
      </Box>
      {mobile && searchOpen ? search : null}
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}>
        <Tabs aria-label="Lọc bài tập" sx={{ ...ergSegmentedTabsSx, flexShrink: 0, width: mobile ? "100%" : 480 }} value={filter} variant="fullWidth" onChange={(_, value: AssignmentFilter) => setFilter(value)}>
          {TABS.map((tab) => (
            <Tab key={tab.key} icon={<ErgTabCount count={lists[tab.key].length} tone={tab.key === "overdue" ? "error" : "info"} />} iconPosition="end" label={tab.label} value={tab.key} />
          ))}
        </Tabs>
        {!mobile && filter !== "submitted" && subjects.length > 1 ? (
          <Tabs aria-label="Lọc theo môn" scrollButtons={false} sx={ergChipTabsSx} value={activeSubject} variant="scrollable" onChange={(_, value: string) => setSubject(value)}>
            <Tab label="Tất cả" value={ALL_SUBJECTS} />
            {subjects.map((label) => <Tab key={label} label={label} value={label} />)}
          </Tabs>
        ) : null}
      </Box>
      {filter === "todo" ? <TodoBoard items={list} mobile={mobile} now={now} onOpen={onOpenAssignment} /> : null}
      {filter === "submitted" ? <SubmittedBoard items={list} mobile={mobile} onOpen={onOpenAssignment} /> : null}
      {filter === "overdue" ? <OverdueBoard items={list} mobile={mobile} now={now} onAsk={() => onAskTeacher?.()} onOpen={onOpenAssignment} /> : null}
      {list.length === 0 ? <ErgEmptyState description={TABS.find((tab) => tab.key === filter)?.empty} icon={<AssignmentOutlined />} title="Chưa có bài trong mục này" /> : null}
      {hasMore && onLoadMore ? <ErgButton loading={loadingMore} onClick={onLoadMore} sx={{ alignSelf: "center" }} variant="outlined">Xem thêm bài</ErgButton> : null}
    </Stack>
  );
}
