import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import type { ComponentType } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import TaskOutlinedIcon from "@mui/icons-material/TaskOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import {
  loadLmsAssignmentProgressWorkspace,
  type LmsAssignmentProgressWorkspace,
} from "@/features/lms/api/lms-assignment-progress-api";
import { lmsAssignmentReadQueryKeys, lmsReadPersistMeta } from "@/features/lms/api/lms-assignment-command-query";
import {
  useAssignmentReportQuery,
  useQuizQuestionAnalyticsQuery,
  type AssignmentReport,
  type AssignmentReportStudentRow,
  type QuizQuestionAnalyticsReport,
} from "@/features/quiz-reports";
import type { AssignmentRun, ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";
import { AssignmentProgressMobile } from "@/features/lms/components/assignment-progress-mobile";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { AssignmentProgressExportControl } from "@/features/reporting/components/assignment-progress-export-control";

type ProgressStatus = "completed" | "inprogress" | "notstarted";

type StudentProgressRow = {
  id: string;
  name: string;
  /** Account id for notifications; absent when the source has none. */
  userId?: string;
  className: string;
  progress: number;
  score: number | null;
  status: ProgressStatus;
  timestamp: string;
};

const allStatusValue = "all";

const progressStatusCopy: Record<ProgressStatus, string> = {
  completed: "Đã nộp bài",
  inprogress: "Đang làm",
  notstarted: "Chưa mở",
};

export function HomeworkProgressPage({
  selectedClass,
  students,
  runs,
  initialRunId,
  onBack,
}: {
  selectedClass?: ClassroomSnapshot;
  students: ClassroomStudent[];
  runs: AssignmentRun[];
  initialRunId?: string | null;
  onBack: () => void;
}) {
  const [selectedRunId, setSelectedRunId] = useState(initialRunId || runs[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | typeof allStatusValue>(allStatusValue);
  const apiBacked = hasApiBase();
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const tenantId = getDefaultTenantId();

  useEffect(() => {
    const nextRunId = initialRunId && runs.some((run) => run.id === initialRunId) ? initialRunId : runs[0]?.id || "";
    if (!nextRunId) return;
    setSelectedRunId((current) => (runs.some((run) => run.id === current) ? current : nextRunId));
  }, [initialRunId, runs]);

  const progressQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.assignmentProgress(selectedRunId, tenantId),
    queryFn: ({ signal }) =>
      loadLmsAssignmentProgressWorkspace({ assignmentId: selectedRunId, page: 0, size: 50 }, signal),
    enabled: apiBacked && Boolean(selectedRunId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    meta: lmsReadPersistMeta(tenantId),
    refetchOnWindowFocus: false,
  });
  const assignmentReportQuery = useAssignmentReportQuery(apiBacked ? selectedRunId : "");

  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0];
  const selectedQuizVersionId = resolveSelectedQuizVersionId(selectedRun, progressQuery.data);
  const questionAnalyticsQuery = useQuizQuestionAnalyticsQuery(apiBacked ? selectedQuizVersionId : "");
  const questionAnalyticsSummary = useMemo(
    () => summarizeQuestionAnalytics(questionAnalyticsQuery.data),
    [questionAnalyticsQuery.data],
  );
  const fallbackRows = useMemo(
    () =>
      students.map((student, index): StudentProgressRow => {
        const statusType = (index * 3 + 2) % 3;
        const progress = statusType === 0 ? 100 : statusType === 1 ? Math.min(95, 10 + (index * 7) % 85) : 0;
        const status = statusType === 0 ? "completed" : statusType === 1 ? "inprogress" : "notstarted";

        return {
          id: student.id,
          name: student.name,
          className: student.className,
          progress,
          score: status === "completed" ? Math.min(100, 60 + (index * 4) % 40) : null,
          status,
          timestamp: status === "completed" ? `${(index % 5) + 1} giờ trước` : status === "inprogress" ? "10 phút trước" : "-",
        };
      }),
    [students],
  );
  const graphQlRows = useMemo(
    () => (progressQuery.data ? mapAssignmentProgressRows(progressQuery.data, selectedClass) : []),
    [progressQuery.data, selectedClass],
  );
  const reportRows = useMemo(
    () => (assignmentReportQuery.data ? mapAssignmentReportRows(assignmentReportQuery.data, selectedClass) : []),
    [assignmentReportQuery.data, selectedClass],
  );
  const progressRows = apiBacked ? (reportRows.length ? reportRows : graphQlRows) : fallbackRows;
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return progressRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.className.toLowerCase().includes(normalizedSearch);

      return matchesSearch && (statusFilter === allStatusValue || row.status === statusFilter);
    });
  }, [progressRows, searchTerm, statusFilter]);
  const total = assignmentReportQuery.data?.totalRecipients ?? progressRows.length;
  const completed = assignmentReportQuery.data?.submittedCount ?? progressRows.filter((row) => row.status === "completed").length;
  const inProgress = assignmentReportQuery.data?.inProgressCount ?? progressRows.filter((row) => row.status === "inprogress").length;
  const notStarted = assignmentReportQuery.data?.notStartedCount ?? progressRows.filter((row) => row.status === "notstarted").length;
  const completedPct = total ? Math.round((completed / total) * 100) : 0;
  const needsReviewCount = assignmentReportQuery.data?.needsReviewCount ?? progressQuery.data?.summary.needsReviewCount ?? selectedRun?.needsReviewCount ?? 0;

  if (isMobile) {
    const loading = apiBacked && (progressQuery.isLoading || assignmentReportQuery.isLoading) && !progressRows.length;
    const failed = apiBacked && progressQuery.isError && assignmentReportQuery.isError;
    return (
      <AssignmentProgressMobile
        classLabel={selectedClass?.className}
        counts={{ completed, needsReview: needsReviewCount, total }}
        onBack={onBack}
        rows={progressRows}
        run={selectedRun}
        status={failed ? "error" : loading ? "loading" : "ready"}
      />
    );
  }

  const exportDisabledReason = !selectedRunId
    ? "Chọn một bài đã giao để xuất danh sách nộp bài."
    : !apiBacked
      ? "Cần kết nối máy chủ để xuất CSV."
      : "";

  return (
    <Box sx={{ display: "flex", minHeight: "100%", flexDirection: "column", gap: 1.5, px: { xs: 1.5, lg: 3 }, py: { xs: 1.5, lg: 2 }, height: { lg: "100%" }, overflow: { lg: "hidden" } }}>
      <Paper component="section" variant="outlined" sx={{ ...panelSx, flexShrink: 0, px: 1.5, py: 1.25 }}>
        <Box sx={{ display: "grid", alignItems: "center", gap: 1.5, gridTemplateColumns: { lg: "minmax(280px, 1fr) auto auto" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
              <TaskOutlinedIcon fontSize="inherit" sx={{ color: "primary.main" }} />
              <Typography variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>
                Bài tập / <Box component="span" sx={{ color: "text.primary" }}>Theo dõi bài tập</Box>
              </Typography>
            </Stack>
            <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>Theo dõi bài tập</Typography>
            <Typography variant="body2" noWrap sx={{ mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              Kiểm tra tiến độ làm bài, trạng thái nộp và điểm của học sinh trong {selectedClass?.className ?? "lớp hiện tại"}.
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }, minWidth: { lg: 520 } }}>
            <ProgressStat icon={GroupsOutlinedIcon} label="Tổng HS" value={String(total)} />
            <ProgressStat icon={CheckCircleOutlineIcon} label="Đã nộp" value={`${completedPct}%`} />
            <ProgressStat icon={ScheduleOutlinedIcon} label="Đang làm" value={String(inProgress)} />
            <ProgressStat icon={TaskOutlinedIcon} label="Chưa mở" value={String(notStarted)} />
          </Box>
          <Box sx={{ display: "flex", flexShrink: 0, flexWrap: "wrap", alignItems: "center", justifyContent: { xs: "flex-start", lg: "flex-end" }, gap: 1 }}>
            <Tooltip title={exportDisabledReason} disableHoverListener={!exportDisabledReason}>
              <span>
                <AssignmentProgressExportControl assignmentId={selectedRunId} classId={selectedClass?.id} />
              </span>
            </Tooltip>
            <Button variant="outlined" sx={{ height: 40, px: 1.5 }} onClick={onBack}>
              Về trang bài tập
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box component="section" sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { lg: "280px minmax(0, 1fr)" }, minHeight: { lg: 0 }, flex: { lg: 1 }, overflow: { lg: "hidden" } }}>
        <Paper component="aside" variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column", p: 1.5 }}>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1, color: "text.secondary", fontWeight: "fontWeightBold" }}>Bài đã giao</Typography>
          <Stack spacing={1} sx={{ minHeight: 0, flex: 1, overflowY: "auto", pr: 0.5, maxHeight: { xs: 224, lg: "none" } }}>
            {runs.length === 0 ? (
              <Typography variant="body2" sx={{ px: 0.5, py: 1, color: "text.secondary", fontWeight: "fontWeightMedium" }}>Chưa có bài nào được giao. Giao bài để theo dõi tiến độ tại đây.</Typography>
            ) : null}
            {runs.map((run) => {
              const selected = selectedRunId === run.id;
              return (
                <ButtonBase
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  sx={{
                    display: "block",
                    width: "100%",
                    flexShrink: 0,
                    border: 1,
                    borderColor: selected ? "primary.main" : "divider",
                    borderRadius: 1,
                    bgcolor: selected ? "info.light" : "background.paper",
                    color: selected ? "primary.main" : "text.primary",
                    px: 1.5,
                    py: 1.25,
                    textAlign: "left",
                    typography: "body2",
                    fontWeight: "fontWeightBold",
                    transition: "background-color 0.15s ease",
                    "&:hover": selected ? undefined : { bgcolor: "action.hover" },
                  }}
                >
                  <Box component="span" sx={truncateSx}>{run.title}</Box>
                  <Box component="span" sx={{ ...truncateSx, mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                    {run.subjectLabel} - {run.targetLevel}
                  </Box>
                </ButtonBase>
              );
            })}
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xl: "minmax(0, 1fr) 320px" }, minHeight: { lg: 0 }, overflow: { lg: "hidden" } }}>
          <Paper variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column" }}>
            <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", p: 1.5 }}>
              <Box sx={{ mb: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" component="h2" noWrap>{selectedRun?.title ?? "Chưa có bài đã giao"}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>Danh sách học sinh và trạng thái làm bài.</Typography>
                </Box>
                <Chip label={`${filteredRows.length} học sinh`} size="small" color="secondary" sx={{ flexShrink: 0, textTransform: "none", letterSpacing: "normal" }} />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <ErgSearchField
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm học sinh hoặc lớp..."
                  sx={{ minWidth: 200, flex: 1, width: "auto" }}
                />
                <StatusTab value={allStatusValue} label="Tất cả" active={statusFilter === allStatusValue} onClick={() => setStatusFilter(allStatusValue)} />
                <StatusTab value="completed" label="Đã nộp" active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} />
                <StatusTab value="inprogress" label="Đang làm" active={statusFilter === "inprogress"} onClick={() => setStatusFilter("inprogress")} />
                <StatusTab value="notstarted" label="Chưa mở" active={statusFilter === "notstarted"} onClick={() => setStatusFilter("notstarted")} />
              </Box>
            </Box>

            <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
              <Box component="ul" sx={{ m: 0, listStyle: "none", display: { xs: "grid", lg: "none" }, gap: 1, p: 1.5 }}>
                {filteredRows.map((row) => (
                  <Box component="li" key={row.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", p: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightMedium" }}>{row.name}</Typography>
                        <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>{row.className} · {row.timestamp}</Typography>
                      </Box>
                      <ProgressStatusBadge status={row.status} />
                    </Box>
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <ProgressBar row={row} />
                      <Typography variant="body2" sx={{ width: 64, textAlign: "right", fontWeight: "fontWeightMedium" }}>{row.score !== null ? `${row.score}/100` : "—"}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <ErgTable sx={{ display: { xs: "none", lg: "table" }, minWidth: 880 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headDividerSx}>Học sinh</TableCell>
                    <TableCell sx={headDividerSx}>Lớp</TableCell>
                    <TableCell sx={headDividerSx}>Tiến độ</TableCell>
                    <TableCell sx={headDividerSx} align="center">Điểm</TableCell>
                    <TableCell sx={headDividerSx}>Trạng thái</TableCell>
                    <TableCell>Hoạt động cuối</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: "fontWeightMedium" }}>{row.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{row.className}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ProgressBar row={row} />
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "fontWeightMedium" }}>{row.score !== null ? `${row.score}/100` : "-"}</TableCell>
                      <TableCell>
                        <ProgressStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{row.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ErgTable>
              {filteredRows.length === 0 ? (
                <Box sx={{ m: 2, border: 1, borderStyle: "dashed", borderColor: "divider", borderRadius: 1, p: 4, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                    Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Paper>

          <Paper component="aside" variant="outlined" sx={{ ...panelSx, display: "flex", minHeight: 0, flexDirection: "column", p: 2 }}>
            <Typography variant="subtitle2" component="h2">Tổng quan bài giao</Typography>
            <Box sx={{ mt: 1.5, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", p: 1.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}>Bài tập</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: "fontWeightMedium" }}>{selectedRun?.title ?? "-"}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{selectedRun?.dueLabel ?? "-"}</Typography>
              {questionAnalyticsSummary ? (
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                  {questionAnalyticsSummary.questionCount} câu hỏi - đúng TB {questionAnalyticsSummary.averageCorrectRate}%
                </Typography>
              ) : null}
            </Box>
            {needsReviewCount > 0 ? (
              <Typography variant="body2" sx={{ mt: 1.5, color: "error.main", fontWeight: "fontWeightMedium" }}>{needsReviewCount} bài cần chấm</Typography>
            ) : null}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

type AssignmentProgressRecipient = LmsAssignmentProgressWorkspace["recipients"]["items"][number];
type AssignmentProgressAttempt = LmsAssignmentProgressWorkspace["attempts"]["items"][number];

function mapAssignmentProgressRows(
  workspace: LmsAssignmentProgressWorkspace,
  selectedClass?: ClassroomSnapshot,
): StudentProgressRow[] {
  const recipientRows = workspace.recipients.items.map((recipient, index) => {
    const attempt = recipient.latestAttempt ?? recipient.bestAttempt;
    const status = statusFromRecipient(recipient);
    const score = scoreFromAttempt(attempt);
    const studentId = recipientStudentId(recipient);

    return {
      id: studentId || attempt?.studentId || `recipient-${index + 1}`,
      name: recipient.fullName || recipient.username || recipient.studentCode || studentId || "Học sinh",
      userId: recipient.authUserId || undefined,
      className: selectedClass?.className || recipient.academicClassId || workspace.assignment.academicClassId || "Lớp học",
      progress: progressPercentFromAttempt(attempt, status),
      score,
      status,
      timestamp: formatProgressTimestamp(attempt?.submittedAt || attempt?.updatedAt || recipient.updatedAt),
    } satisfies StudentProgressRow;
  });

  if (recipientRows.length) return recipientRows;

  return workspace.attempts.items.map((attempt, index) => {
    const status = statusFromAttempt(attempt);
    const score = scoreFromAttempt(attempt);

    return {
      id: attempt.studentId || attempt.id || `attempt-${index + 1}`,
      name: attempt.studentId || `Học sinh ${index + 1}`,
      className: selectedClass?.className || workspace.assignment.academicClassId || "Lớp học",
      progress: progressPercentFromAttempt(attempt, status),
      score,
      status,
      timestamp: formatProgressTimestamp(attempt.submittedAt || attempt.updatedAt || attempt.startedAt),
    } satisfies StudentProgressRow;
  });
}

export function mapAssignmentReportRows(
  report: AssignmentReport,
  selectedClass?: ClassroomSnapshot,
): StudentProgressRow[] {
  return report.students.map((student, index) => {
    const status = statusFromReportStudent(student);
    const progress = progressPercentFromReportStudent(student, status);

    return {
      id: student.studentUserId || `report-student-${index + 1}`,
      name: student.studentName || student.studentUserId || "Học sinh",
      userId: student.studentUserId || undefined,
      className: selectedClass?.className || "Lớp học",
      progress,
      score: scoreFromReportStudent(student),
      status,
      timestamp: formatProgressTimestamp(student.submittedAt),
    } satisfies StudentProgressRow;
  });
}

export function resolveSelectedQuizVersionId(
  selectedRun?: AssignmentRun,
  workspace?: LmsAssignmentProgressWorkspace,
) {
  const resources = [...(workspace?.assignment.resources ?? [])].sort(
    (left, right) => (left.orderIndex ?? 0) - (right.orderIndex ?? 0),
  );
  return selectedRun?.quizVersionId || resources[0]?.quizVersionId || "";
}

export function summarizeQuestionAnalytics(report?: QuizQuestionAnalyticsReport) {
  if (!report?.questions.length) return null;
  const answeredQuestions = report.questions.filter((question) => question.answeredCount > 0);
  const source = answeredQuestions.length ? answeredQuestions : report.questions;
  const averageCorrectRate = Math.round(
    source.reduce((total, question) => total + question.correctRate, 0) / source.length,
  );
  return {
    averageCorrectRate,
    questionCount: report.questions.length,
  };
}

function recipientStudentId(recipient: AssignmentProgressRecipient) {
  return (recipient as AssignmentProgressRecipient & { studentId?: string | null }).studentId || recipient.id;
}

function statusFromRecipient(recipient: AssignmentProgressRecipient): ProgressStatus {
  const attempt = recipient.latestAttempt ?? recipient.bestAttempt;
  if (!attempt || recipient.missing) return "notstarted";
  return statusFromAttempt(attempt);
}

function statusFromAttempt(attempt: AssignmentProgressAttempt | null | undefined): ProgressStatus {
  if (!attempt) return "notstarted";

  const normalizedStatus = attempt.status?.toLowerCase();
  if (
    attempt.submittedAt ||
    attempt.passed ||
    attempt.percent === 100 ||
    ["completed", "graded", "reviewed", "submitted"].includes(normalizedStatus ?? "")
  ) {
    return "completed";
  }

  if (["draft", "in_progress", "started", "running"].includes(normalizedStatus ?? "")) return "inprogress";
  return attempt.startedAt || attempt.updatedAt ? "inprogress" : "notstarted";
}

function progressPercentFromAttempt(attempt: AssignmentProgressAttempt | null | undefined, status: ProgressStatus) {
  const percent = scoreFromAttempt(attempt);
  if (status === "completed") return percent ?? 100;
  if (status === "inprogress") return Math.max(5, Math.min(percent ?? 50, 95));
  return 0;
}

function statusFromReportStudent(student: AssignmentReportStudentRow): ProgressStatus {
  const normalized = student.status?.toLowerCase();
  if (
    student.submittedAt ||
    student.passed ||
    student.percentComplete === 100 ||
    ["completed", "graded", "reviewed", "submitted"].includes(normalized ?? "")
  ) {
    return "completed";
  }

  if (["draft", "in_progress", "inprogress", "started", "running"].includes(normalized ?? "")) return "inprogress";
  if ((student.answeredCount ?? 0) > 0) return "inprogress";
  return "notstarted";
}

function progressPercentFromReportStudent(student: AssignmentReportStudentRow, status: ProgressStatus) {
  if (typeof student.percentComplete === "number") return Math.round(Math.max(0, Math.min(student.percentComplete, 100)));
  if (student.totalQuestions > 0) {
    return Math.round(Math.max(0, Math.min((student.answeredCount / student.totalQuestions) * 100, 100)));
  }
  if (status === "completed") return 100;
  if (status === "inprogress") return 50;
  return 0;
}

function scoreFromReportStudent(student: AssignmentReportStudentRow) {
  if (typeof student.score !== "number") return null;
  return Math.round(Math.max(0, Math.min(student.score, 100)));
}

function scoreFromAttempt(attempt: AssignmentProgressAttempt | null | undefined) {
  if (!attempt) return null;
  if (typeof attempt.percent === "number") return Math.round(attempt.percent);
  if (typeof attempt.score === "number" && typeof attempt.maxScore === "number" && attempt.maxScore > 0) {
    return Math.round((attempt.score / attempt.maxScore) * 100);
  }
  if (typeof attempt.score === "number") return Math.round(attempt.score);
  return null;
}

export function formatProgressTimestamp(value?: string | null) {
  return formatShortDateTimeVi(value) || "—";
}

const panelSx = { borderRadius: 1, bgcolor: "background.paper", boxShadow: 1 } as const;
const truncateSx = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
const headDividerSx = { borderRight: 1, borderRightColor: "divider" } as const;

function ProgressStat({ icon: Icon, label, value }: { icon: ComponentType<SvgIconProps>; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", px: 1.25, py: 0.75 }}>
      <Box sx={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: 0.75, bgcolor: "background.paper", color: "primary.main", boxShadow: 1 }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{label}</Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightMedium" }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function StatusTab({
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        height: 40,
        px: 1.5,
        borderColor: active ? "primary.main" : "divider",
        bgcolor: active ? "info.light" : "background.paper",
        color: active ? "primary.main" : "text.secondary",
      }}
    >
      {label}
    </Button>
  );
}

function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  const tone = status === "completed" ? "success" : status === "inprogress" ? "warning" : "neutral";
  return <ErgStatusChip dot={false} tone={tone} label={progressStatusCopy[status]} sx={{ flexShrink: 0 }} />;
}

function ProgressBar({ row }: { row: StudentProgressRow }) {
  return (
    <>
      <LinearProgress
        variant="determinate"
        value={row.progress}
        color={row.status === "completed" ? "success" : "warning"}
        aria-label={`Tiến độ ${row.name}`}
        sx={{ height: 8, flex: 1, borderRadius: 0.75, bgcolor: "action.hover" }}
      />
      <Typography variant="body2" sx={{ width: 40, textAlign: "right", color: "text.secondary", fontWeight: "fontWeightBold" }}>{row.progress}%</Typography>
    </>
  );
}
