import { useMemo, useState } from "react";

import {
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
  DashboardStatusBadge,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, ProgressBar } from "@/components/ui/dashboard-kit";
import {
  assignmentRuns,
  classroomClusters,
  classroomSchools,
  classroomSnapshots,
  interventionQueue,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSchool, ClassroomSnapshot, InterventionItem } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

type OverviewMode = "center" | "school";
type BadgeTone = "success" | "warning" | "danger" | "outline" | "secondary";

export function OverviewWorkspace({
  activeLeaf,
  managementScope,
  mode,
  onOpenLeaf,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  managementScope: ManagementScope;
  mode: OverviewMode;
  onOpenLeaf: (leafId: string) => void;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [clusterId, setClusterId] = useState("all");
  const isGlobalScope = managementScope.level === "global";
  const scopedSchools = useMemo(
    () =>
      isGlobalScope
        ? classroomSchools
        : classroomSchools.filter((school) => school.id === selectedSchoolId),
    [isGlobalScope, selectedSchoolId],
  );

  const filteredSchools = useMemo(
    () => scopedSchools.filter((school) => (!isGlobalScope || clusterId === "all" ? true : school.clusterId === clusterId)),
    [clusterId, isGlobalScope, scopedSchools],
  );
  const filteredSnapshots = useMemo(
    () => {
      const schoolIds = new Set(filteredSchools.map((school) => school.id));
      return classroomSnapshots.filter((snapshot) => schoolIds.has(snapshot.schoolId));
    },
    [filteredSchools],
  );

  const totals = useMemo(() => {
    const activeStudents = filteredSchools.reduce((sum, school) => sum + school.activeStudents, 0);
    const activeClasses = filteredSchools.reduce((sum, school) => sum + school.activeClasses, 0);
    const averageCompletion = Math.round(
      filteredSchools.reduce((sum, school) => sum + school.completionRate, 0) / Math.max(filteredSchools.length, 1),
    );
    const averageScore = Math.round(
      filteredSchools.reduce((sum, school) => sum + school.averageScore, 0) / Math.max(filteredSchools.length, 1),
    );
    const flaggedStudents = filteredSchools.reduce((sum, school) => sum + school.flaggedStudents, 0);
    const overdueAssignments = filteredSchools.reduce((sum, school) => sum + school.overdueAssignments, 0);

    return { activeStudents, activeClasses, averageCompletion, averageScore, flaggedStudents, overdueAssignments };
  }, [filteredSchools]);

  const classesNeedingSupport = useMemo(
    () => [...filteredSnapshots].sort((left, right) => right.riskStudents - left.riskStudents),
    [filteredSnapshots],
  );
  const schoolsByAttention = useMemo(
    () => [...filteredSchools].sort((left, right) => right.flaggedStudents - left.flaggedStudents),
    [filteredSchools],
  );

  const activeCluster = classroomClusters.find((cluster) => cluster.id === clusterId);
  const scopeLabel = isGlobalScope ? activeCluster?.label ?? copy.allClusters : filteredSchools[0]?.name ?? copy.selectedCenter;
  const summaryItems =
    mode === "center"
      ? [
          { label: copy.summary.openAssignments, value: String(assignmentRuns.length), detail: copy.summary.openAssignmentsHint },
          { label: copy.summary.needsSupport, value: String(totals.flaggedStudents), detail: copy.summary.needsSupportHint },
          { label: copy.summary.completion, value: `${totals.averageCompletion}%`, detail: copy.summary.completionHint },
          { label: copy.summary.scope, value: scopeLabel, detail: copy.summary.scopeHint(filteredSchools.length) },
        ]
      : [
          { label: copy.summary.schools, value: String(filteredSchools.length), detail: copy.summary.schoolHint },
          { label: copy.summary.classes, value: String(totals.activeClasses), detail: copy.summary.classHint },
          { label: copy.summary.needsSupport, value: String(totals.flaggedStudents), detail: copy.summary.needsSupportHint },
          { label: copy.summary.averageScore, value: String(totals.averageScore), detail: copy.summary.averageScoreHint },
        ];

  return (
    <DashboardPageShell
      badge={mode === "center" ? copy.centerBadge : copy.schoolBadge}
      title={mode === "center" ? copy.centerTitle : copy.schoolTitle}
      description={mode === "center" ? copy.centerDescription : copy.schoolDescription}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <>
          {isGlobalScope ? (
            <DashboardSegmentedControl
              options={[
                { value: "all", label: copy.allClusters },
                ...classroomClusters.map((cluster) => ({ value: cluster.id, label: cluster.label })),
              ]}
              value={clusterId}
              onChange={setClusterId}
            />
          ) : null}
          <Button variant="outline">{copy.last30Days}</Button>
        </>
      }
      headerContent={<SummaryStrip items={summaryItems} />}
    >
      {mode === "center" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
            <TodayActionPanel copy={copy} items={interventionQueue} onOpenLeaf={onOpenLeaf} />
            <AssignmentRunPanel copy={copy} />
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

function TodayActionPanel({
  copy,
  items,
  onOpenLeaf,
}: {
  copy: OverviewCopy;
  items: InterventionItem[];
  onOpenLeaf: (leafId: string) => void;
}) {
  return (
    <DashboardSectionCard
      title={copy.todayActionsTitle}
      description={copy.todayActionsDescription}
      action={<Button variant="outline" onClick={() => onOpenLeaf("class-students")}>{copy.openStudentList}</Button>}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">{item.studentName}</h3>
                  <span className="text-sm text-slate-300">/</span>
                  <span className="text-sm font-medium text-slate-600">{item.className}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.issue}</p>
                <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-600">
                  {item.schoolName} - {item.impact}
                </p>
              </div>
              <DashboardStatusBadge label={copy.urgency[item.urgency]} tone={getUrgencyTone(item.urgency)} />
            </div>
          </article>
        ))}
      </div>
    </DashboardSectionCard>
  );
}

function AssignmentRunPanel({ copy }: { copy: OverviewCopy }) {
  return (
    <DashboardSectionCard title={copy.assignmentTitle} description={copy.assignmentDescription}>
      <div className="space-y-3">
        {assignmentRuns.map((assignment) => (
          <article key={assignment.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">{assignment.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {assignment.subjectLabel} - {assignment.targetLevel}
                </p>
              </div>
              <Badge tone={assignment.needsReviewCount > 12 ? "warning" : "outline"}>{assignment.dueLabel}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-600">{copy.completionLabel}</span>
              <span className="font-semibold text-slate-950">{assignment.completionRate}%</span>
            </div>
            <ProgressBar value={assignment.completionRate} className="mt-2 h-2 bg-slate-200" indicatorClassName={getProgressClass(assignment.completionRate)} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label={copy.submittedLabel} value={String(assignment.submittedCount)} />
              <MiniStat label={copy.inProgressLabel} value={String(assignment.inProgressCount)} />
              <MiniStat label={copy.needsReviewLabel} value={String(assignment.needsReviewCount)} tone={assignment.needsReviewCount > 12 ? "danger" : "default"} />
            </div>
          </article>
        ))}
      </div>
    </DashboardSectionCard>
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
              <DashboardStatusBadge label={copy.schoolStatus(school.flaggedStudents)} tone={school.flaggedStudents > 28 ? "warning" : "success"} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MiniStat label={copy.classroomsLabel} value={String(school.activeClasses)} />
              <MiniStat label={copy.completionLabel} value={`${school.completionRate}%`} />
              <MiniStat label={copy.studentsNeedSupport} value={String(school.flaggedStudents)} tone={school.flaggedStudents > 28 ? "danger" : "default"} />
            </div>
            {showDetails ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">{copy.averageScoreLabel}</span>
                  <span className="font-semibold text-slate-950">{school.averageScore}</span>
                </div>
                <ProgressBar value={school.completionRate} className="mt-2 h-2 bg-slate-200" indicatorClassName={getProgressClass(school.completionRate)} />
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
      action={<Button variant="outline" onClick={() => onOpenLeaf("class-reports")}>{copy.openClassReports}</Button>}
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
      action={<Button onClick={() => onOpenLeaf("class-students")}>{copy.openStudentList}</Button>}
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
              <CompactCell label={copy.classTable.students} value={String(snapshot.studentCount)} />
              <CompactCell label={copy.classTable.assignments} value={String(snapshot.activeAssignments)} />
              <CompactCell label={copy.classTable.completion} value={`${snapshot.completionRate}%`} />
              <div>
                <span className="font-medium text-slate-500 lg:hidden">{copy.classTable.support}: </span>
                <DashboardStatusBadge label={`${snapshot.riskStudents} ${copy.studentsNeedSupport}`} tone={snapshot.riskStudents > 5 ? "warning" : "outline"} />
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
        <DashboardStatusBadge label={`${snapshot.riskStudents} ${copy.studentsNeedSupport}`} tone={snapshot.riskStudents > 5 ? "warning" : "outline"} />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{copy.completionLabel}</span>
        <span className="font-semibold text-slate-950">{snapshot.completionRate}%</span>
      </div>
      <ProgressBar value={snapshot.completionRate} className="mt-2 h-2 bg-slate-200" indicatorClassName={getProgressClass(snapshot.completionRate)} />
      {!compact ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <MiniStat label={copy.classroomsStudentCount} value={String(snapshot.studentCount)} />
          <MiniStat label={copy.activeAssignmentsLabel} value={String(snapshot.activeAssignments)} />
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

function CompactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-semibold text-slate-950">
      <span className="font-medium text-slate-500 lg:hidden">{label}: </span>
      {value}
    </div>
  );
}

function getProgressClass(value: number) {
  if (value >= 86) return "bg-emerald-500";
  if (value >= 78) return "bg-amber-500";
  return "bg-rose-500";
}

function getUrgencyTone(urgency: InterventionItem["urgency"]): BadgeTone {
  if (urgency === "high") return "danger";
  if (urgency === "medium") return "warning";
  return "outline";
}

type OverviewCopy = typeof enCopy;

const viCopy = {
  centerBadge: "Tổng quan",
  schoolBadge: "Báo cáo lớp",
  centerTitle: "Báo cáo tổng quan",
  schoolTitle: "Báo cáo trường/lớp",
  last30Days: "30 ngày gần đây",
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
    needsSupport: "Cần hỗ trợ",
    needsSupportHint: "Học sinh/lớp nên được nhắc hoặc kiểm tra thêm.",
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
    needsSupport: "Need support",
    needsSupportHint: "Students or classes that should be nudged.",
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
