import { useMemo, useState } from "react";

import {
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
  DashboardStatusBadge,
} from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

type OverviewMode = "center" | "school";

export function OverviewWorkspace({
  activeLeaf,
  managementScope,
  mode,
  onOpenLeaf,
  schools,
  snapshots,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  managementScope: ManagementScope;
  mode: OverviewMode;
  onOpenLeaf: (leafId: string) => void;
  schools: ClassroomSchool[];
  snapshots: ClassroomSnapshot[];
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [clusterId, setClusterId] = useState("all");
  const isGlobalScope = managementScope.level === "global";
  const scopedSchools = useMemo(
    () =>
      isGlobalScope
        ? schools
        : schools.filter((school) => school.id === selectedSchoolId),
    [isGlobalScope, schools, selectedSchoolId],
  );
  const hasClusterData = scopedSchools.length > 0 && scopedSchools.every((school) => school.metricsAvailable !== false);

  const filteredSchools = useMemo(
    () => scopedSchools.filter((school) => (!isGlobalScope || clusterId === "all" ? true : school.clusterId === clusterId)),
    [clusterId, isGlobalScope, scopedSchools],
  );
  const filteredSnapshots = useMemo(
    () => {
      const schoolIds = new Set(filteredSchools.map((school) => school.id));
      return snapshots.filter((snapshot) => schoolIds.has(snapshot.schoolId));
    },
    [filteredSchools, snapshots],
  );

  const totals = useMemo(() => {
    const activeStudents = filteredSchools.reduce((sum, school) => sum + school.activeStudents, 0);
    const activeClasses = filteredSchools.reduce((sum, school) => sum + school.activeClasses, 0);
    const metricsAvailable = filteredSchools.length > 0 && filteredSchools.every((school) => school.metricsAvailable !== false);
    const averageCompletion = metricsAvailable
      ? Math.round(filteredSchools.reduce((sum, school) => sum + school.completionRate, 0) / filteredSchools.length)
      : null;
    const averageScore = metricsAvailable
      ? Math.round(filteredSchools.reduce((sum, school) => sum + school.averageScore, 0) / filteredSchools.length)
      : null;
    const flaggedStudents = metricsAvailable ? filteredSchools.reduce((sum, school) => sum + school.flaggedStudents, 0) : null;
    const overdueAssignments = metricsAvailable ? filteredSchools.reduce((sum, school) => sum + school.overdueAssignments, 0) : null;

    return { activeStudents, activeClasses, averageCompletion, averageScore, flaggedStudents, overdueAssignments, metricsAvailable };
  }, [filteredSchools]);

  const classesNeedingSupport = useMemo(
    () => [...filteredSnapshots].sort((left, right) => right.riskStudents - left.riskStudents),
    [filteredSnapshots],
  );
  const schoolsByAttention = useMemo(
    () => [...filteredSchools].sort((left, right) => right.flaggedStudents - left.flaggedStudents),
    [filteredSchools],
  );

  const scopeLabel = isGlobalScope ? (clusterId === "all" ? copy.allClusters : clusterId) : filteredSchools[0]?.name ?? copy.selectedCenter;
  const summaryItems =
    mode === "center"
      ? [
          { label: copy.summary.openAssignments, value: "—", detail: copy.summary.openAssignmentsUnavailable },
          { label: copy.summary.needsSupport, value: formatMetric(totals.flaggedStudents), detail: totals.metricsAvailable ? copy.summary.needsSupportHint : copy.summary.metricsUnavailable },
          { label: copy.summary.completion, value: formatPercent(totals.averageCompletion), detail: totals.metricsAvailable ? copy.summary.completionHint : copy.summary.metricsUnavailable },
          { label: copy.summary.scope, value: scopeLabel, detail: copy.summary.scopeHint(filteredSchools.length) },
        ]
      : [
          { label: copy.summary.schools, value: String(filteredSchools.length), detail: copy.summary.schoolHint },
          { label: copy.summary.classes, value: String(totals.activeClasses), detail: copy.summary.classHint },
          { label: copy.summary.needsSupport, value: formatMetric(totals.flaggedStudents), detail: totals.metricsAvailable ? copy.summary.needsSupportHint : copy.summary.metricsUnavailable },
          { label: copy.summary.averageScore, value: formatMetric(totals.averageScore), detail: totals.metricsAvailable ? copy.summary.averageScoreHint : copy.summary.metricsUnavailable },
        ];

  return (
    <DashboardPageShell
      badge={mode === "center" ? copy.centerBadge : copy.schoolBadge}
      title={mode === "center" ? copy.centerTitle : copy.schoolTitle}
      description={mode === "center" ? copy.centerDescription : copy.schoolDescription}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <>
          {isGlobalScope && hasClusterData ? (
            <DashboardSegmentedControl
              options={[
                { value: "all", label: copy.allClusters },
                { value: "central", label: "Cụm trung tâm" },
                { value: "east", label: "Cụm phía đông" },
                { value: "south", label: "Cụm phía nam" },
              ]}
              value={clusterId}
              onChange={setClusterId}
            />
          ) : null}
          <Button variant="outlined">{copy.last30Days}</Button>
        </>
      }
      headerContent={<SummaryStrip items={summaryItems} />}
    >
      {mode === "center" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
            <UnavailablePanel title={copy.todayActionsTitle} detail={copy.todayActionsUnavailable} />
            <UnavailablePanel title={copy.assignmentTitle} detail={copy.summary.openAssignmentsUnavailable} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <ClassFocusPanel copy={copy} snapshots={classesNeedingSupport.slice(0, 5)} onOpenLeaf={onOpenLeaf} />
            <SchoolHealthPanel copy={copy} schools={schoolsByAttention} />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
            <SchoolHealthPanel copy={copy} schools={schoolsByAttention} showDetails />
            <ClassFocusPanel copy={copy} snapshots={classesNeedingSupport.slice(0, 5)} onOpenLeaf={onOpenLeaf} compact />
          </div>
          <ClassListPanel copy={copy} snapshots={filteredSnapshots} onOpenLeaf={onOpenLeaf} />
        </>
      )}
    </DashboardPageShell>
  );
}

function SummaryStrip({ items }: { items: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#cbd7e6] bg-white px-4 py-3">
          <div className="text-[13px] font-bold text-slate-600">{item.label}</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">{item.value}</div>
          <div className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}

function SchoolHealthPanel({
  copy,
  schools,
  showDetails = false,
}: {
  copy: OverviewCopy;
  schools: ClassroomSchool[];
  showDetails?: boolean;
}) {
  return (
    <DashboardSectionCard title={copy.schoolHealthTitle} description={copy.schoolHealthDescription}>
      <div className="space-y-3">
        {schools.map((school) => (
          <article key={school.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{school.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.schoolPrincipal}: {school.principal}
                </p>
              </div>
              <DashboardStatusBadge label={school.metricsAvailable === false ? copy.noData : copy.schoolStatus(school.flaggedStudents)} tone={school.metricsAvailable === false ? "outline" : school.flaggedStudents > 28 ? "warning" : "success"} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MiniStat label={copy.classroomsLabel} value={String(school.activeClasses)} />
              <MiniStat label={copy.completionLabel} value={school.metricsAvailable === false ? copy.noData : `${school.completionRate}%`} />
              <MiniStat label={copy.studentsNeedSupport} value={school.metricsAvailable === false ? copy.noData : String(school.flaggedStudents)} tone={school.metricsAvailable === false ? "default" : school.flaggedStudents > 28 ? "danger" : "default"} />
            </div>
            {showDetails ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">{copy.averageScoreLabel}</span>
                  <span className="font-semibold text-slate-950">{school.metricsAvailable === false ? copy.noData : school.averageScore}</span>
                </div>
                {school.metricsAvailable === false ? <div className="mt-2 text-sm font-medium text-slate-500">{copy.summary.metricsUnavailable}</div> : <LinearProgress variant="determinate" value={school.completionRate} sx={{ mt: 1, height: 8, borderRadius: 1, bgcolor: "grey.200" }} />}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </DashboardSectionCard>
  );
}

function ClassFocusPanel({
  compact = false,
  copy,
  onOpenLeaf,
  snapshots,
}: {
  compact?: boolean;
  copy: OverviewCopy;
  onOpenLeaf: (leafId: string) => void;
  snapshots: ClassroomSnapshot[];
}) {
  return (
    <DashboardSectionCard
      title={copy.classFocusTitle}
      description={copy.classFocusDescription}
      action={<Button variant="outlined" onClick={() => onOpenLeaf("class-reports")}>{copy.openClassReports}</Button>}
    >
      <div className="space-y-3">
        {snapshots.map((snapshot) => (
          <ClassRow key={snapshot.id} compact={compact} copy={copy} snapshot={snapshot} />
        ))}
      </div>
    </DashboardSectionCard>
  );
}

function ClassListPanel({
  copy,
  onOpenLeaf,
  snapshots,
}: {
  copy: OverviewCopy;
  onOpenLeaf: (leafId: string) => void;
  snapshots: ClassroomSnapshot[];
}) {
  return (
    <DashboardSectionCard
      title={copy.classListTitle}
      description={copy.classListDescription}
      action={<Button variant="contained" onClick={() => onOpenLeaf("class-students")}>{copy.openStudentList}</Button>}
    >
      <div className="overflow-hidden rounded-lg border border-[#cbd7e6] bg-white">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_120px_120px_120px_130px] gap-3 border-b border-[#cbd7e6] bg-[#eef4fb] px-4 py-3 text-[13px] font-bold text-slate-700 lg:grid">
          <span>{copy.classTable.className}</span>
          <span>{copy.classTable.students}</span>
          <span>{copy.classTable.assignments}</span>
          <span>{copy.classTable.completion}</span>
          <span>{copy.classTable.support}</span>
        </div>
        <div className="divide-y divide-slate-200">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_120px_120px_120px_130px] lg:items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{snapshot.className}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {snapshot.schoolName} - {snapshot.gradeLabel} - {snapshot.homeroomTeacher}
                </p>
              </div>
              <CompactCell label={copy.classTable.students} value={snapshot.metricsAvailable === false ? copy.noData : String(snapshot.studentCount)} />
              <CompactCell label={copy.classTable.assignments} value={snapshot.metricsAvailable === false ? copy.noData : String(snapshot.activeAssignments)} />
              <CompactCell label={copy.classTable.completion} value={snapshot.metricsAvailable === false ? copy.noData : `${snapshot.completionRate}%`} />
              <div>
                <span className="font-medium text-slate-500 lg:hidden">{copy.classTable.support}: </span>
                <DashboardStatusBadge label={snapshot.metricsAvailable === false ? copy.noData : `${snapshot.riskStudents} ${copy.studentsNeedSupport}`} tone={snapshot.metricsAvailable === false ? "outline" : snapshot.riskStudents > 5 ? "warning" : "outline"} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function ClassRow({
  compact,
  copy,
  snapshot,
}: {
  compact?: boolean;
  copy: OverviewCopy;
  snapshot: ClassroomSnapshot;
}) {
  return (
    <article className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{snapshot.className}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {snapshot.schoolName} - {snapshot.gradeLabel} - {snapshot.homeroomTeacher}
          </p>
        </div>
        <DashboardStatusBadge label={snapshot.metricsAvailable === false ? copy.noData : `${snapshot.riskStudents} ${copy.studentsNeedSupport}`} tone={snapshot.metricsAvailable === false ? "outline" : snapshot.riskStudents > 5 ? "warning" : "outline"} />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{copy.completionLabel}</span>
        <span className="font-semibold text-slate-950">{snapshot.metricsAvailable === false ? copy.noData : `${snapshot.completionRate}%`}</span>
      </div>
      {snapshot.metricsAvailable === false ? <div className="mt-2 text-sm font-medium text-slate-500">{copy.summary.metricsUnavailable}</div> : <LinearProgress variant="determinate" value={snapshot.completionRate} sx={{ mt: 1, height: 8, borderRadius: 1, bgcolor: "grey.200" }} />}
      {!compact ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <MiniStat label={copy.classroomsStudentCount} value={snapshot.metricsAvailable === false ? copy.noData : String(snapshot.studentCount)} />
          <MiniStat label={copy.activeAssignmentsLabel} value={snapshot.metricsAvailable === false ? copy.noData : String(snapshot.activeAssignments)} />
          <MiniStat label={copy.lastActivityLabel} value={snapshot.lastSubmissionAt} />
        </div>
      ) : null}
    </article>
  );
}

function MiniStat({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "danger";
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#f8fbff] px-3 py-2">
      <div className={cn("text-sm font-semibold text-slate-950", tone === "danger" && "text-rose-700")}>{value}</div>
      <div className="mt-1 text-[13px] font-semibold text-slate-600">{label}</div>
    </div>
  );
}

function UnavailablePanel({ detail, title }: { detail: string; title: string }) {
  return (
    <DashboardSectionCard title={title} description={detail}>
      <div className="rounded-lg border border-dashed border-slate-300 bg-[#f8fbff] p-6 text-sm font-medium text-slate-500">
        {detail}
      </div>
    </DashboardSectionCard>
  );
}

function formatMetric(value: number | null) {
  return value === null ? "—" : String(value);
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function CompactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-semibold text-slate-950">
      <span className="font-medium text-slate-500 lg:hidden">{label}: </span>
      {value}
    </div>
  );
}

type OverviewCopy = typeof enCopy;

const viCopy = {
  centerBadge: "Tổng quan",
  schoolBadge: "Báo cáo lớp",
  centerTitle: "Báo cáo tổng quan",
  schoolTitle: "Báo cáo trường/lớp",
  last30Days: "30 ngày gần đây",
  noData: "Chưa có dữ liệu",
  selectedCenter: "Trung tâm đã chọn",
  centerDescription:
    "Tập trung vào việc cần xử lý hôm nay: bài đang chạy, học sinh cần nhắc và lớp có dấu hiệu chậm nhịp.",
  schoolDescription:
    "Nhìn nhanh tình hình trường và lớp: cơ sở nào ổn, lớp nào cần hỗ trợ, và nên đi vào danh sách nào tiếp theo.",
  allClusters: "Tất cả cụm",
  openQuestionBank: "Ngân hàng câu hỏi",
  openSchoolOverview: "Toàn cảnh trường/lớp",
  openLearningOps: "Điều hành học tập",
  openQuizStudio: "Tạo quiz",
  openStudentList: "Học sinh",
  openClassReports: "Báo cáo lớp",
  summary: {
    openAssignments: "Bài đang mở",
    openAssignmentsHint: "Theo dõi các bài còn ảnh hưởng tới tiến độ hôm nay.",
    openAssignmentsUnavailable: "Backend chưa cung cấp aggregate assignment cho dashboard.",
    needsSupport: "Cần hỗ trợ",
    needsSupportHint: "Học sinh/lớp nên được nhắc hoặc kiểm tra thêm.",
    metricsUnavailable: "Backend chưa cung cấp số liệu vận hành trong bootstrap.",
    completion: "Hoàn thành",
    completionHint: "Tỷ lệ trung bình trong phạm vi đang chọn.",
    scope: "Phạm vi",
    scopeHint: (count: number) => `${count} cơ sở đang được theo dõi.`,
    schools: "Trường",
    schoolHint: "Cơ sở trong phạm vi đang chọn.",
    classes: "Lớp",
    classHint: "Tổng số lớp đang hoạt động.",
    averageScore: "Điểm TB",
    averageScoreHint: "Điểm trung bình theo bài đã nộp.",
  },
  todayActionsTitle: "Cần xử lý hôm nay",
  todayActionsDescription: "Chỉ giữ những việc giáo viên nên xử lý trước để lớp không rớt nhịp.",
  todayActionsUnavailable: "Backend chưa cung cấp intervention queue cho dashboard.",
  assignmentTitle: "Bài đang mở",
  assignmentDescription: "Theo dõi bài nào sắp quá hạn, bài nào còn nhiều học sinh đang làm hoặc cần chấm.",
  schoolHealthTitle: "Tình hình trường",
  schoolHealthDescription: "Một dòng cho mỗi cơ sở, tập trung vào lớp, hoàn thành và số học sinh cần hỗ trợ.",
  classFocusTitle: "Lớp cần chú ý",
  classFocusDescription: "Các lớp có nhiều học sinh cần hỗ trợ hoặc tỷ lệ hoàn thành chưa tốt.",
  classListTitle: "Danh sách lớp",
  classListDescription: "Toàn bộ lớp trong phạm vi đang chọn, hiển thị dạng bảng gọn để giáo viên dễ dò.",
  schoolPrincipal: "Phụ trách",
  schoolStatus: (count: number): string => (count > 28 ? "Cần theo sát" : "Ổn định"),
  classroomsLabel: "Lớp",
  classroomsStudentCount: "Học sinh",
  activeAssignmentsLabel: "Bài mở",
  studentsNeedSupport: "cần hỗ trợ",
  completionLabel: "Hoàn thành",
  averageScoreLabel: "Điểm trung bình",
  submittedLabel: "Đã nộp",
  inProgressLabel: "Đang làm",
  needsReviewLabel: "Cần chấm",
  lastActivityLabel: "Nhịp gần nhất",
  urgency: {
    high: "Ưu tiên cao",
    medium: "Theo dõi sát",
    low: "Nhắc nhẹ",
  },
  classTable: {
    className: "Lớp",
    students: "Học sinh",
    assignments: "Bài mở",
    completion: "Hoàn thành",
    support: "Hỗ trợ",
  },
};

const enCopy = {
  centerBadge: "Learning ops",
  schoolBadge: "School overview",
  centerTitle: "Overview report",
  schoolTitle: "School and class report",
  last30Days: "Last 30 days",
  noData: "No data yet",
  selectedCenter: "Selected center",
  centerDescription:
    "Focus on today's work: live assignments, students to nudge, and classes that are slowing down.",
  schoolDescription:
    "Scan school and class health quickly: which campuses are steady, which classes need support, and where to go next.",
  allClusters: "All clusters",
  openQuestionBank: "Question bank",
  openSchoolOverview: "School overview",
  openLearningOps: "Learning ops",
  openQuizStudio: "Create quiz",
  openStudentList: "Students",
  openClassReports: "Class reports",
  summary: {
    openAssignments: "Open work",
    openAssignmentsHint: "Assignments still affecting today's progress.",
    openAssignmentsUnavailable: "The backend does not expose an assignment aggregate for this dashboard.",
    needsSupport: "Need support",
    needsSupportHint: "Students or classes that should be nudged.",
    metricsUnavailable: "Operational metrics are not included in the current bootstrap contract.",
    completion: "Completion",
    completionHint: "Average completion in the selected scope.",
    scope: "Scope",
    scopeHint: (count: number) => `${count} campuses currently tracked.`,
    schools: "Schools",
    schoolHint: "Campuses in the selected scope.",
    classes: "Classes",
    classHint: "Total active classes.",
    averageScore: "Avg score",
    averageScoreHint: "Average score from submitted work.",
  },
  todayActionsTitle: "Needs action today",
  todayActionsDescription: "Only the items teachers should handle first so the class rhythm does not slip.",
  todayActionsUnavailable: "The backend does not expose an intervention queue for this dashboard.",
  assignmentTitle: "Open assignments",
  assignmentDescription: "Track what is nearing deadline, still in progress, or waiting for review.",
  schoolHealthTitle: "School health",
  schoolHealthDescription: "One row per campus, focused on classes, completion, and support volume.",
  classFocusTitle: "Classes to watch",
  classFocusDescription: "Classes with more support needs or weaker completion.",
  classListTitle: "Class list",
  classListDescription: "All classes in the selected scope, shown as a compact table for quick scanning.",
  schoolPrincipal: "Lead",
  schoolStatus: (count: number): string => (count > 28 ? "Watch closely" : "Stable"),
  classroomsLabel: "Classes",
  classroomsStudentCount: "Students",
  activeAssignmentsLabel: "Open work",
  studentsNeedSupport: "need support",
  completionLabel: "Completion",
  averageScoreLabel: "Average score",
  submittedLabel: "Submitted",
  inProgressLabel: "In progress",
  needsReviewLabel: "Review",
  lastActivityLabel: "Latest rhythm",
  urgency: {
    high: "High priority",
    medium: "Watch closely",
    low: "Gentle reminder",
  },
  classTable: {
    className: "Class",
    students: "Students",
    assignments: "Open work",
    completion: "Completion",
    support: "Support",
  },
};
