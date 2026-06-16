import { useMemo, useState } from "react";
import { ClipboardCheck, School, Users } from "lucide-react";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import {
  assignmentRuns,
  classroomSchools,
  defaultSchoolId,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { AssignmentRun, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function ClassroomTrackingWorkspace({
  activeLeaf,
  onOpenLeaf,
  onSelectClass,
  selectedClassId,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
  onSelectClass: (classId: string) => void;
  selectedClassId: string;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [selectedSubject, setSelectedSubject] = useState("all");

  const schoolId = selectedSchoolId || defaultSchoolId;
  const school = classroomSchools.find((item) => item.id === schoolId) ?? classroomSchools[0];
  const schoolClasses = useMemo(() => getSchoolSnapshots(schoolId), [schoolId]);
  const selectedClass = schoolClasses.find((item) => item.id === selectedClassId) ?? schoolClasses[0];
  const subjectOptions = useMemo(
    () => Array.from(new Set(assignmentRuns.map((assignment) => assignment.subjectLabel))),
    [],
  );
  const totalSupport = schoolClasses.reduce((sum, item) => sum + item.riskStudents, 0);
  const highlightedAssignments = useMemo(
    () =>
      assignmentRuns
        .filter((assignment) => selectedSubject === "all" || assignment.subjectLabel === selectedSubject)
        .filter((assignment) => assignment.targetLevel === selectedClass?.gradeLabel || assignment.activeClasses >= 4)
        .slice(0, 3),
    [selectedClass?.gradeLabel, selectedSubject],
  );

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <>
          <SelectControl
            ariaLabel={copy.subjectSelectLabel}
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={[
              { value: "all", label: copy.allSubjects },
              ...subjectOptions.map((subject) => ({ value: subject, label: subject })),
            ]}
          />
          <Button variant="outline" onClick={() => onOpenLeaf("class-students")}>
            {copy.openStudents}
          </Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#cbd7e6] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                  <School className="h-4 w-4" />
                  <span>{copy.campusTitle}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{school.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.schoolLead}: {school.principal}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                <CampusStat label={copy.statClasses} value={`${schoolClasses.length}`} />
                <CampusStat label={copy.statStudents} value={`${school.activeStudents}`} />
                <CampusStat label={copy.statSupport} value={`${totalSupport}`} tone={totalSupport > 10 ? "warning" : "default"} />
              </div>
            </div>
          </div>

          <DashboardSectionCard title={copy.classesTitle} description={copy.classesDescription}>
            <div className="grid gap-3 lg:grid-cols-2">
              {schoolClasses.map((snapshot, index) => (
                <ClassroomCard
                  key={snapshot.id}
                  copy={copy}
                  index={index}
                  isSelected={selectedClass?.id === snapshot.id}
                  onAssign={() => {
                    onSelectClass(snapshot.id);
                    onOpenLeaf("class-students");
                  }}
                  onOpenStudents={() => {
                    onSelectClass(snapshot.id);
                    onOpenLeaf("class-students");
                  }}
                  onSelect={() => onSelectClass(snapshot.id)}
                  snapshot={snapshot}
                />
              ))}
            </div>
          </DashboardSectionCard>
        </div>

        <aside className="space-y-4">
          {selectedClass ? (
            <SelectedClassPanel
              copy={copy}
              onAssign={() => onOpenLeaf("class-students")}
              onOpenStudents={() => onOpenLeaf("class-students")}
              snapshot={selectedClass}
            />
          ) : null}

          <DashboardSectionCard
            title={copy.scheduleTitle}
            description={copy.scheduleDescription}
            action={
              <Button size="sm" variant="outline" onClick={() => onOpenLeaf("class-students")}>
                {copy.openAssignmentCenter}
              </Button>
            }
          >
            <div className="space-y-3">
              {highlightedAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} copy={copy} />
              ))}
            </div>
          </DashboardSectionCard>
        </aside>
      </section>
    </DashboardPageShell>
  );
}

function CampusStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#cbd7e6] bg-[#f8fbff] text-slate-950",
      )}
    >
      <div className="text-[13px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function SelectControl({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <AppSelect
      aria-label={ariaLabel}
      className="h-10 min-w-[150px] rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-800 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </AppSelect>
  );
}

function ClassroomCard({
  copy,
  index,
  isSelected,
  onAssign,
  onOpenStudents,
  onSelect,
  snapshot,
}: {
  copy: ClassroomCopy;
  index: number;
  isSelected: boolean;
  onAssign: () => void;
  onOpenStudents: () => void;
  onSelect: () => void;
  snapshot: ClassroomSnapshot;
}) {
  const attention = getClassAttention(snapshot, copy);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border bg-white shadow-sm transition hover:border-[#b8d6fa]",
        isSelected ? "border-[#b8d6fa] ring-2 ring-[var(--erg-blue-ring)]" : "border-[#cbd7e6]",
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onSelect}>
        <div className={cn("h-2", getClassAccent(index))} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-slate-950">{snapshot.className}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {snapshot.gradeLabel} • {snapshot.homeroomTeacher}
              </p>
            </div>
            <Badge tone={attention.tone}>{attention.label}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniMetric label={copy.studentsLabel} value={`${snapshot.studentCount}`} />
            <MiniMetric label={copy.assignmentsLabel} value={`${snapshot.activeAssignments}`} />
            <MiniMetric label={copy.averageScoreLabel} value={`${snapshot.averageScore}`} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{copy.completionLabel}</span>
              <span className="font-semibold text-slate-950">{snapshot.completionRate}%</span>
            </div>
            <ProgressBar
              value={snapshot.completionRate}
              className="mt-2 h-2 bg-slate-100"
              indicatorClassName={attention.progressClassName}
            />
          </div>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <div className="text-sm text-slate-500">
          {copy.lastSubmissionLabel}: <span className="font-medium text-slate-700">{snapshot.lastSubmissionAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onOpenStudents}>
            {copy.studentsAction}
          </Button>
          <Button size="sm" onClick={onAssign}>
            {copy.assignAction}
          </Button>
        </div>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8fbff] px-3 py-2">
      <div className="text-[13px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function SelectedClassPanel({
  copy,
  onAssign,
  onOpenStudents,
  snapshot,
}: {
  copy: ClassroomCopy;
  onAssign: () => void;
  onOpenStudents: () => void;
  snapshot: ClassroomSnapshot;
}) {
  const attention = getClassAttention(snapshot, copy);

  return (
    <DashboardSectionCard title={copy.focusTitle} description={copy.focusDescription}>
      <div className="rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-950">{snapshot.className}</div>
            <div className="mt-1 text-sm text-slate-500">
              {snapshot.gradeLabel} • {copy.teacherLabel}: {snapshot.homeroomTeacher}
            </div>
          </div>
          <Badge tone={attention.tone}>{attention.label}</Badge>
        </div>

        <div className="mt-5 grid gap-3">
          <FocusRow icon={<Users className="h-4 w-4" />} label={copy.supportLabel} value={`${snapshot.riskStudents}`} />
          <FocusRow
            icon={<ClipboardCheck className="h-4 w-4" />}
            label={copy.assignmentsLabel}
            value={`${snapshot.activeAssignments}`}
          />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">{copy.completionLabel}</span>
            <span className="font-semibold text-slate-950">{snapshot.completionRate}%</span>
          </div>
          <ProgressBar value={snapshot.completionRate} className="mt-2 h-2 bg-white" indicatorClassName={attention.progressClassName} />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button variant="outline" onClick={onOpenStudents}>
            {copy.studentsAction}
          </Button>
          <Button onClick={onAssign}>{copy.assignAction}</Button>
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function FocusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-3">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ebf3fc] text-[var(--erg-blue)]">{icon}</span>
        {label}
      </div>
      <span className="text-lg font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function AssignmentCard({ assignment, copy }: { assignment: AssignmentRun; copy: ClassroomCopy }) {
  return (
    <article className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{assignment.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {assignment.subjectLabel} • {assignment.targetLevel}
          </p>
        </div>
        <Badge tone="outline">{assignment.completionRate}%</Badge>
      </div>
      <ProgressBar value={assignment.completionRate} className="mt-4 h-2 bg-slate-100" indicatorClassName="bg-[var(--erg-blue)]" />
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-slate-600">
        <span>
          <strong className="text-slate-950">{assignment.submittedCount}</strong> {copy.submittedLabel}
        </span>
        <span>
          <strong className="text-slate-950">{assignment.needsReviewCount}</strong> {copy.reviewLabel}
        </span>
      </div>
      <div className="mt-3 text-[13px] font-semibold text-slate-600">{assignment.dueLabel}</div>
    </article>
  );
}

function getClassAttention(snapshot: ClassroomSnapshot, copy: ClassroomCopy) {
  if (snapshot.riskStudents >= 5 || snapshot.completionRate < 82) {
    return {
      label: copy.statusNeedsCare,
      progressClassName: "bg-amber-500",
      tone: "warning" as const,
    };
  }

  if (snapshot.completionRate >= 88) {
    return {
      label: copy.statusOnTrack,
      progressClassName: "bg-emerald-500",
      tone: "success" as const,
    };
  }

  return {
    label: copy.statusSteady,
    progressClassName: "bg-[var(--erg-blue)]",
    tone: "secondary" as const,
  };
}

function getClassAccent(index: number) {
  const accents = ["bg-[var(--erg-blue)]", "bg-emerald-500", "bg-amber-500", "bg-slate-500"];
  return accents[index % accents.length];
}

type ClassroomCopy = typeof enCopy;

const viCopy = {
  badge: "Lớp học",
  description: "Theo dõi từng lớp theo kiểu Google Classroom: lớp nào ổn, lớp nào cần nhắc, và hành động tiếp theo là gì.",
  openStudents: "Học sinh & bài tập",
  openAssignmentCenter: "Học sinh & bài tập",
  classSelectLabel: "Chọn lớp",
  subjectSelectLabel: "Chọn môn học",
  allSubjects: "Tất cả môn",
  schoolLead: "Phụ trách",
  campusTitle: "Cơ sở đang xem",
  statClasses: "Lớp",
  statStudents: "Học sinh",
  statSupport: "Cần hỗ trợ",
  classesTitle: "Lớp đang dạy",
  classesDescription: "Mỗi thẻ là một lớp. Chọn lớp để xem nhanh tình trạng và thao tác chính.",
  focusTitle: "Lớp đang chọn",
  focusDescription: "Chỉ giữ các chỉ số cần quyết định ngay.",
  scheduleTitle: "Bài đang mở",
  scheduleDescription: "Các bài ảnh hưởng trực tiếp tới tiến độ lớp.",
  teacherLabel: "Giáo viên",
  studentsLabel: "Học sinh",
  assignmentsLabel: "Bài mở",
  supportLabel: "Cần hỗ trợ",
  averageScoreLabel: "Điểm TB",
  completionLabel: "Hoàn thành",
  lastSubmissionLabel: "Nộp gần nhất",
  studentsAction: "Học sinh",
  assignAction: "Giao bài",
  statusNeedsCare: "Cần chú ý",
  statusOnTrack: "Đúng nhịp",
  statusSteady: "Ổn định",
  submittedLabel: "đã nộp",
  reviewLabel: "chờ duyệt",
};

const enCopy = {
  badge: "Classroom",
  description: "Track each class like Google Classroom: what is healthy, what needs a nudge, and what action comes next.",
  openStudents: "Students & assignments",
  openAssignmentCenter: "Students & assignments",
  classSelectLabel: "Select class",
  subjectSelectLabel: "Select subject",
  allSubjects: "All subjects",
  schoolLead: "Lead",
  campusTitle: "Current campus",
  statClasses: "Classes",
  statStudents: "Students",
  statSupport: "Need support",
  classesTitle: "Teaching classes",
  classesDescription: "Each card is one class. Select a class to see its status and next actions.",
  focusTitle: "Selected class",
  focusDescription: "Only the signals needed for a same-day decision.",
  scheduleTitle: "Open assignments",
  scheduleDescription: "Assignments that directly affect class progress.",
  teacherLabel: "Teacher",
  studentsLabel: "Students",
  assignmentsLabel: "Open work",
  supportLabel: "Need support",
  averageScoreLabel: "Avg score",
  completionLabel: "Completion",
  lastSubmissionLabel: "Latest",
  studentsAction: "Students",
  assignAction: "Assign",
  statusNeedsCare: "Needs care",
  statusOnTrack: "On track",
  statusSteady: "Steady",
  submittedLabel: "submitted",
  reviewLabel: "to review",
};
