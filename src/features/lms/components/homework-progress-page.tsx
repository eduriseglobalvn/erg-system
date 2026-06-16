import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FileCheck2, Search, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  loadLmsAssignmentProgressWorkspace,
  type LmsAssignmentProgressWorkspace,
} from "@/features/lms/api/lms-graphql-api";
import type { AssignmentRun, ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ProgressStatus = "completed" | "inprogress" | "notstarted";

type StudentProgressRow = {
  id: string;
  name: string;
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

  useEffect(() => {
    const nextRunId = initialRunId && runs.some((run) => run.id === initialRunId) ? initialRunId : runs[0]?.id || "";
    if (!nextRunId) return;
    setSelectedRunId((current) => (runs.some((run) => run.id === current) ? current : nextRunId));
  }, [initialRunId, runs]);

  const progressQuery = useQuery({
    queryKey: ["lms", "assignment-progress-workspace", selectedRunId],
    queryFn: () => loadLmsAssignmentProgressWorkspace({ assignmentId: selectedRunId, page: 0, size: 50 }),
    enabled: apiBacked && Boolean(selectedRunId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0];
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
  const progressRows = graphQlRows.length ? graphQlRows : fallbackRows;
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
  const total = progressRows.length;
  const completed = progressRows.filter((row) => row.status === "completed").length;
  const inProgress = progressRows.filter((row) => row.status === "inprogress").length;
  const notStarted = progressRows.filter((row) => row.status === "notstarted").length;
  const completedPct = total ? Math.round((completed / total) * 100) : 0;
  const needsReviewCount = progressQuery.data?.summary.needsReviewCount ?? selectedRun?.needsReviewCount ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 py-4 xl:px-6">
      <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid items-center gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <FileCheck2 className="h-3.5 w-3.5 text-[var(--erg-blue)]" />
              Bài tập / <span className="text-slate-600">Theo dõi bài tập</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">Theo dõi bài tập</h1>
            <p className="mt-1 truncate text-[13px] font-semibold text-slate-600">
              Kiểm tra tiến độ làm bài, trạng thái nộp và điểm của học sinh trong {selectedClass?.className ?? "lớp hiện tại"}.
            </p>
          </div>
          <div className="grid min-w-[520px] grid-cols-4 gap-2 max-xl:min-w-0">
            <ProgressStat icon={UsersRound} label="Tổng HS" value={String(total)} />
            <ProgressStat icon={CheckCircle2} label="Đã nộp" value={`${completedPct}%`} />
            <ProgressStat icon={Clock3} label="Đang làm" value={String(inProgress)} />
            <ProgressStat icon={FileCheck2} label="Chưa mở" value={String(notStarted)} />
          </div>
          <div className="flex shrink-0 justify-end">
            <Button variant="outline" className="h-10 rounded-lg px-3 text-[14px]" onClick={onBack}>
              Về trang bài tập
            </Button>
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-3 shadow-[var(--shadow-xs)]">
          <h2 className="mb-2 text-[13px] font-bold text-slate-600">Bài đã giao</h2>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setSelectedRunId(run.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left text-[13px] font-bold transition",
                  selectedRunId === run.id
                    ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"
                    : "border-[#dbe4f0] bg-white text-slate-700 hover:bg-[#f8fbff]",
                )}
              >
                <span className="block truncate">{run.title}</span>
                <span className="mt-1 block truncate text-[13px] font-semibold text-slate-600">
                  {run.subjectLabel} - {run.targetLevel}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid min-h-0 gap-3 overflow-hidden 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
            <div className="shrink-0 border-b border-[#cbd7e6] p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{selectedRun?.title ?? "Chưa có bài đã giao"}</h2>
                  <p className="mt-1 text-[13px] font-semibold text-slate-600">Danh sách học sinh và trạng thái làm bài.</p>
                </div>
                <Badge tone="secondary" className="shrink-0 tracking-normal normal-case">
                  {filteredRows.length} học sinh
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm học sinh hoặc lớp..."
                    className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-3 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </div>
                <StatusTab value={allStatusValue} label="Tất cả" active={statusFilter === allStatusValue} onClick={() => setStatusFilter(allStatusValue)} />
                <StatusTab value="completed" label="Đã nộp" active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} />
                <StatusTab value="inprogress" label="Đang làm" active={statusFilter === "inprogress"} onClick={() => setStatusFilter("inprogress")} />
                <StatusTab value="notstarted" label="Chưa mở" active={statusFilter === "notstarted"} onClick={() => setStatusFilter("notstarted")} />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="erg-data-table min-w-[880px] w-full border-collapse text-left text-[14px]">
                <thead className="sticky top-0 z-10 bg-[#eef4fb] text-[13px] font-bold text-slate-700">
                  <tr>
                    <th className="border-r border-[#cbd7e6] px-4 py-3">Học sinh</th>
                    <th className="border-r border-[#cbd7e6] px-4 py-3">Lớp</th>
                    <th className="border-r border-[#cbd7e6] px-4 py-3">Tiến độ</th>
                    <th className="border-r border-[#cbd7e6] px-4 py-3 text-center">Điểm</th>
                    <th className="border-r border-[#cbd7e6] px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Hoạt động cuối</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{row.className}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-md bg-slate-100">
                            <div className={cn("h-full rounded-full", getProgressTone(row.status))} style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="w-10 text-right text-[13px] font-bold text-slate-600">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.score !== null ? `${row.score}/100` : "-"}</td>
                      <td className="px-4 py-3">
                        <ProgressStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{row.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length === 0 ? (
                <div className="m-4 rounded-lg border border-dashed border-[#cbd7e6] p-8 text-center text-sm font-semibold text-slate-500">
                  Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
            <h2 className="text-sm font-semibold text-slate-900">Tổng quan bài giao</h2>
            <div className="mt-3 rounded-lg border border-[#dbe4f0] bg-[#f8fbff] p-3">
              <div className="text-[13px] font-bold tracking-normal text-slate-600">Bài tập</div>
              <div className="mt-1 text-sm font-semibold leading-5 text-slate-900">{selectedRun?.title ?? "-"}</div>
              <div className="mt-2 text-[13px] font-semibold text-slate-600">{selectedRun?.dueLabel ?? "-"}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ProgressQuickInfo label="Hoàn thành" value={`${completed}/${total}`} tone="text-emerald-600" />
              <ProgressQuickInfo label="Đang làm" value={String(inProgress)} tone="text-amber-600" />
              <ProgressQuickInfo label="Chưa mở" value={String(notStarted)} tone="text-slate-500" />
              <ProgressQuickInfo label="Cần chấm" value={String(needsReviewCount)} tone="text-rose-500" />
            </div>
            <div className="mt-3 rounded-lg border border-[#dbe4f0] p-3">
              <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-slate-600">
                <span>Tỷ lệ hoàn thành</span>
                <span>{completedPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-md bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completedPct}%` }} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
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
      name: recipient.fullName || recipient.username || recipient.studentCode || studentId || "Hoc sinh",
      className: selectedClass?.className || recipient.academicClassId || workspace.assignment.academicClassId || "Lop hoc",
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
      name: attempt.studentId || `Hoc sinh ${index + 1}`,
      className: selectedClass?.className || workspace.assignment.academicClassId || "Lop hoc",
      progress: progressPercentFromAttempt(attempt, status),
      score,
      status,
      timestamp: formatProgressTimestamp(attempt.submittedAt || attempt.updatedAt || attempt.startedAt),
    } satisfies StudentProgressRow;
  });
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

function scoreFromAttempt(attempt: AssignmentProgressAttempt | null | undefined) {
  if (!attempt) return null;
  if (typeof attempt.percent === "number") return Math.round(attempt.percent);
  if (typeof attempt.score === "number" && typeof attempt.maxScore === "number" && attempt.maxScore > 0) {
    return Math.round((attempt.score / attempt.maxScore) * 100);
  }
  if (typeof attempt.score === "number") return Math.round(attempt.score);
  return null;
}

function formatProgressTimestamp(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" });
}

function ProgressStat({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-2.5 py-1.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[var(--erg-blue)] shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold tracking-normal text-slate-600">{label}</span>
        <span className="block truncate text-sm font-semibold text-slate-950">{value}</span>
      </span>
    </div>
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg border px-3 text-[13px] font-bold transition",
        active ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "border-[#dbe4f0] bg-white text-slate-600 hover:bg-[#f8fbff]",
      )}
    >
      {label}
    </button>
  );
}

function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 text-[13px] font-bold",
        status === "completed"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "inprogress"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-[#dbe4f0] bg-[#f8fbff] text-slate-700",
      )}
    >
      {progressStatusCopy[status]}
    </span>
  );
}

function ProgressQuickInfo({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2">
      <div className="text-[13px] font-bold text-slate-600">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", tone)}>{value}</div>
    </div>
  );
}

function getProgressTone(status: ProgressStatus) {
  if (status === "completed") return "bg-emerald-500";
  if (status === "inprogress") return "bg-amber-400";
  return "bg-slate-200";
}
