import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell } from "@/components/erg-mui/erg-table";
import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";
import type { ClassroomSnapshot, AssignmentRun } from "@/features/lms/classroom/types/classroom-types";

interface HomeworkPanelProps {
  selectedClass?: ClassroomSnapshot;
  runs: AssignmentRun[];
  onAssign: () => void;
  onViewProgress: (runId: string) => void;
}

type RunStatus = "review" | "done" | "open";

const ALL = "all";
const STATUS_LABEL: Record<RunStatus, string> = { review: "Cần chấm", done: "Hoàn thành", open: "Đang diễn ra" };
const STATUS_TONE = { review: "warning", done: "success", open: "info" } as const;

export function getRunStatus(run: AssignmentRun): RunStatus {
  if (run.needsReviewCount > 0) return "review";
  return run.completionRate >= 100 ? "done" : "open";
}

export function HomeworkPanel({ selectedClass, runs, onAssign, onViewProgress }: HomeworkPanelProps) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const subjectOptions = useMemo(
    () => [
      { label: "Tất cả môn học", value: ALL },
      ...Array.from(new Set(runs.map((run) => run.subjectLabel).filter(Boolean))).map((s) => ({ label: s, value: s })),
    ],
    [runs],
  );
  const statusOptions = [
    { label: "Tất cả trạng thái", value: ALL },
    ...(Object.keys(STATUS_LABEL) as RunStatus[]).map((key) => ({ label: STATUS_LABEL[key], value: key })),
  ];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return runs.filter(
      (run) =>
        (!needle || run.title.toLowerCase().includes(needle)) &&
        (subject === ALL || run.subjectLabel === subject) &&
        (status === ALL || getRunStatus(run) === status),
    );
  }, [runs, query, subject, status]);

  const hasFilter = Boolean(query.trim()) || subject !== ALL || status !== ALL;
  const assignButton = (
    <ErgButton leadingIcon={<AddIcon />} onClick={onAssign} variant="contained">
      Giao bài
    </ErgButton>
  );

  return (
    <>
      <ErgPageHeader
        description={selectedClass ? `Lớp ${selectedClass.className}` : undefined}
        primaryAction={assignButton}
        title="Danh sách hoạt động"
      />
      <Box
        sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) 1fr 1fr" }, mb: 2 }}
      >
        <ErgSearchField
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên bài"
          slotProps={{ htmlInput: { "aria-label": "Tìm theo tên bài" } }}
          value={query}
        />
        <ErgSelect
          label="Môn học"
          onChange={(event) => setSubject(event.target.value)}
          options={subjectOptions}
          size="small"
          value={subject}
        />
        <ErgSelect
          label="Trạng thái"
          onChange={(event) => setStatus(event.target.value)}
          options={statusOptions}
          size="small"
          value={status}
        />
      </Box>
      {filtered.length === 0 ? (
        <ErgEmptyState
          action={hasFilter ? undefined : assignButton}
          description={hasFilter ? "Thử đổi từ khóa hoặc bộ lọc." : "Giao bài đầu tiên để theo dõi tiến độ của học sinh."}
          icon={<AssignmentOutlinedIcon />}
          title={hasFilter ? "Không có hoạt động phù hợp" : "Chưa có hoạt động nào"}
        />
      ) : (
        <ErgDataTableShell>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tên bài</TableCell>
                  <TableCell>Môn học</TableCell>
                  <TableCell>Đối tượng</TableCell>
                  <TableCell>Hạn nộp</TableCell>
                  <TableCell>Đã hoàn thành</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((run) => {
                  const runStatus = getRunStatus(run);
                  return (
                    <TableRow hover key={run.id} onClick={() => onViewProgress(run.id)} sx={{ cursor: "pointer" }}>
                      <TableCell>
                        <Typography sx={{ color: "primary.main" }} variant="body2">
                          {run.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{run.subjectLabel}</TableCell>
                      <TableCell>{run.targetLevel || selectedClass?.className || "Cả lớp"}</TableCell>
                      <TableCell>{formatShortDateTimeVi(run.dueLabel) || run.dueLabel}</TableCell>
                      <TableCell>{Math.round(run.completionRate)}%</TableCell>
                      <TableCell>
                        <ErgStatusChip label={STATUS_LABEL[runStatus]} tone={STATUS_TONE[runStatus]} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </ErgDataTableShell>
      )}
    </>
  );
}
