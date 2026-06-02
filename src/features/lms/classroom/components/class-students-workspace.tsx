import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, Input, ProgressBar, Textarea } from "@/components/ui/dashboard-kit";
import {
  assignmentRuns,
  classroomSnapshots,
  classroomSchools,
  classroomStudents,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type {
  AssignmentRun,
  ClassroomStudent,
  StudentStatus,
} from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";

type ProgressFilter = "all" | "not-started" | "in-progress" | "completed";
type StatusFilter = "all" | StudentStatus;
type AssignmentKind = "train" | "test";

type DeliveryBatch = {
  id: string;
  assignmentTitle: string;
  className: string;
  dueDate: string;
  recipients: number;
};

type AssignmentCatalogItem = AssignmentRun & {
  activityLabel: string;
  durationLabel: string;
  kind: AssignmentKind;
  levelId: string;
  levelLabel: string;
  programLabel: string;
  questionCount: number;
  subjectId: string;
  topicId: string;
  topicLabel: string;
};

type AssignmentTopic = {
  id: string;
  label: string;
  items: AssignmentCatalogItem[];
};

type AssignmentLevel = {
  id: string;
  label: string;
  description: string;
  topics: AssignmentTopic[];
};

type AssignmentSubject = {
  id: string;
  label: string;
  description: string;
  levels: AssignmentLevel[];
};

const TABLE_VISIBLE_ROWS = 20;
const TABLE_ROW_HEIGHT = 64;
const TABLE_HEADER_HEIGHT = 48;
const IC3_PROGRAM_LABEL = "IC3 GS6";

const ic3Gs6LevelDefinitions = [
  {
    id: "ic3-gs6-l1",
    shortLabel: "L1",
    label: "Level 1",
    description: "Nền tảng máy tính",
    topics: [
      "Thiết bị và hệ điều hành",
      "Quản lý tệp",
      "Gõ phím và nhập liệu",
      "Internet an toàn",
      "Email cơ bản",
      "Word căn bản",
      "Ôn tập level 1",
    ],
  },
  {
    id: "ic3-gs6-l2",
    shortLabel: "L2",
    label: "Level 2",
    description: "Ứng dụng văn phòng",
    topics: [
      "Word nâng cao",
      "Excel nhập môn",
      "Công thức Excel",
      "PowerPoint",
      "Làm việc nhóm online",
      "Tìm kiếm thông tin",
      "Ôn tập level 2",
    ],
  },
  {
    id: "ic3-gs6-l3",
    shortLabel: "L3",
    label: "Level 3",
    description: "Năng lực số IC3",
    topics: [
      "Bảo mật tài khoản",
      "Dữ liệu và biểu đồ",
      "Tư duy thuật toán",
      "Bản quyền số",
      "Thuyết trình dự án",
      "Kiểm tra mô phỏng IC3",
      "Ôn tập level 3",
    ],
  },
] as const;

const assignmentActivityTemplates: Array<{
  suffix: string;
  label: string;
  kind: AssignmentKind;
  durationLabel: string;
  questionCount: number;
}> = [
  { suffix: "train-core", label: "Train nền tảng", kind: "train", durationLabel: "15-20 phút", questionCount: 12 },
  { suffix: "train-boost", label: "Train tăng tốc", kind: "train", durationLabel: "20-25 phút", questionCount: 18 },
  { suffix: "test-quick", label: "Test nhanh", kind: "test", durationLabel: "10-15 phút", questionCount: 15 },
  { suffix: "test-mastery", label: "Test tổng hợp", kind: "test", durationLabel: "25-30 phút", questionCount: 30 },
];

const ic3Gs6Levels: AssignmentLevel[] = ic3Gs6LevelDefinitions.map((level, levelIndex) => ({
  id: level.id,
  label: `${level.label} - ${level.description}`,
  description: `${level.topics.length} chủ đề`,
  topics: level.topics.map((topicLabel, topicIndex) => {
    const topicId = `${level.id}-topic-${topicIndex + 1}`;

    return {
      id: topicId,
      label: topicLabel,
      items: assignmentActivityTemplates.map((template, activityIndex) => ({
        id: `${topicId}-${template.suffix}`,
        title: `${IC3_PROGRAM_LABEL} ${level.shortLabel} - ${topicLabel} ${template.label}`,
        activityLabel: template.label,
        subjectLabel: IC3_PROGRAM_LABEL,
        targetLevel: "Khối 6",
        activeClasses: 3 + ((levelIndex + topicIndex + activityIndex) % 4),
        completionRate: 72 + ((levelIndex * 6 + topicIndex * 3 + activityIndex * 4) % 22),
        submittedCount: 24 + levelIndex * 18 + topicIndex * 6 + activityIndex * 3,
        inProgressCount: 8 + ((topicIndex + activityIndex) % 9),
        needsReviewCount: template.kind === "test" ? 5 + ((levelIndex + topicIndex) % 8) : 2 + (activityIndex % 3),
        dueLabel: "Hạn nộp theo lịch giáo viên chọn",
        durationLabel: template.durationLabel,
        kind: template.kind,
        levelId: level.id,
        levelLabel: level.label,
        programLabel: IC3_PROGRAM_LABEL,
        questionCount: template.questionCount,
        subjectId: "subject-ic3-gs6",
        topicId,
        topicLabel,
      })),
    };
  }),
}));

const legacyAssignmentSubjects: AssignmentSubject[] = Array.from(
  new Set(assignmentRuns.filter((assignment) => assignment.subjectLabel !== IC3_PROGRAM_LABEL).map((assignment) => assignment.subjectLabel)),
).map((subjectLabel, subjectIndex) => {
  const subjectId = `subject-legacy-${subjectIndex + 1}`;
  const levelId = `${subjectId}-other-level`;
  const topicId = `${levelId}-other-topic`;
  const subjectAssignments = assignmentRuns.filter((assignment) => assignment.subjectLabel === subjectLabel);

  return {
    id: subjectId,
    label: subjectLabel,
    description: "Bài chưa gắn lộ trình riêng",
    levels: [
      {
        id: levelId,
        label: "Khác",
        description: "Chưa phân level",
        topics: [
          {
            id: topicId,
            label: "Khác",
            items: subjectAssignments.map((assignment, assignmentIndex) => ({
              ...assignment,
              id: `${assignment.id}-catalog`,
              activityLabel: assignment.title,
              durationLabel: "Theo cấu hình bài",
              kind: assignment.needsReviewCount > 10 || assignmentIndex % 2 === 1 ? "test" : "train",
              levelId,
              levelLabel: "Khác",
              programLabel: subjectLabel,
              questionCount: assignmentIndex % 2 === 0 ? 20 : 30,
              subjectId,
              topicId,
              topicLabel: "Khác",
            })),
          },
        ],
      },
    ],
  };
});

const assignmentSubjects: AssignmentSubject[] = [
  {
    id: "subject-ic3-gs6",
    label: IC3_PROGRAM_LABEL,
    description: "3 level, mỗi level 7 chủ đề",
    levels: ic3Gs6Levels,
  },
  ...legacyAssignmentSubjects,
];

const assignmentCatalog = assignmentSubjects.flatMap((subject) =>
  subject.levels.flatMap((level) => level.topics.flatMap((topic) => topic.items)),
);

export function ClassStudentsWorkspace({
  activeLeaf,
  onOpenLeaf,
  selectedClassId,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
  selectedClassId: string;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [subject, setSubject] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(assignmentSubjects[0]?.id ?? "");
  const [selectedLevelId, setSelectedLevelId] = useState(assignmentSubjects[0]?.levels[0]?.id ?? "");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    assignmentCatalog[0]?.id ? [assignmentCatalog[0].id] : [],
  );
  const [dueDate, setDueDate] = useState("2026-04-30T20:30");
  const [teacherNote, setTeacherNote] = useState("");
  const [recentBatches, setRecentBatches] = useState<DeliveryBatch[]>([]);
  const deferredSearchValue = useDeferredValue(searchValue);

  const selectedClass =
    classroomSnapshots.find((snapshot) => snapshot.id === selectedClassId && snapshot.schoolId === selectedSchoolId) ??
    getSchoolSnapshots(selectedSchoolId)[0];
  const school = classroomSchools.find((item) => item.id === selectedSchoolId) ?? classroomSchools[0];
  const subjectOptions = useMemo(
    () => Array.from(new Set([...assignmentRuns, ...assignmentCatalog].map((assignment) => assignment.subjectLabel))),
    [],
  );
  const schoolStudents = useMemo(
    () => classroomStudents.filter((student) => student.schoolId === selectedSchoolId),
    [selectedSchoolId],
  );

  const visibleStudents = useMemo(() => {
    const keyword = deferredSearchValue.trim().toLowerCase();

    return schoolStudents.filter((student) => {
      const currentAssignmentSubject = getStudentAssignmentSubject(student);
      const matchesClass = !selectedClass || student.classId === selectedClass.id;
      const matchesSubject = subject === "all" || currentAssignmentSubject === subject;
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesProgress =
        progressFilter === "all" ||
        (progressFilter === "not-started" && student.progressRate === 0) ||
        (progressFilter === "in-progress" && student.progressRate > 0 && student.progressRate < 100) ||
        (progressFilter === "completed" && student.progressRate === 100);
      const haystack =
        `${student.name} ${student.className} ${student.currentAssignment} ${student.currentStage} ${student.mentorNote}`.toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);

      return matchesClass && matchesSubject && matchesStatus && matchesProgress && matchesKeyword;
    });
  }, [deferredSearchValue, progressFilter, schoolStudents, selectedClass, statusFilter, subject]);

  const visibleStudentIds = visibleStudents.map((student) => student.id);
  const selectedVisibleIds = selectedStudentIds.filter((id) => visibleStudentIds.includes(id));
  const selectedStudents = visibleStudents.filter((student) => selectedVisibleIds.includes(student.id));
  const focusedStudent =
    visibleStudents.find((student) => student.id === focusedStudentId) ?? selectedStudents[0] ?? visibleStudents[0] ?? null;
  const supportCount = visibleStudents.filter((student) => student.status === "support").length;
  const allVisibleSelected = visibleStudents.length > 0 && selectedVisibleIds.length === visibleStudents.length;
  const selectedSubject = assignmentSubjects.find((subjectItem) => subjectItem.id === selectedSubjectId) ?? assignmentSubjects[0];
  const selectedLevel = selectedSubject?.levels.find((level) => level.id === selectedLevelId) ?? selectedSubject?.levels[0];
  const levelAssignments = selectedLevel?.topics.flatMap((topic) => topic.items) ?? [];
  const selectedAssignments = levelAssignments.filter((assignment) => selectedAssignmentIds.includes(assignment.id));
  const canDeliver = selectedStudents.length > 0 && selectedAssignments.length > 0 && Boolean(dueDate);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setFocusedStudentId(null));
    return () => window.cancelAnimationFrame(frameId);
  }, [deferredSearchValue, progressFilter, selectedClass?.id, statusFilter, subject]);

  useEffect(() => {
    if (selectedVisibleIds.length === 0) {
      const frameId = window.requestAnimationFrame(() => setAssignDialogOpen(false));
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [selectedVisibleIds.length]);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  }

  function toggleVisibleStudents() {
    if (allVisibleSelected) {
      setSelectedStudentIds((current) => current.filter((id) => !visibleStudentIds.includes(id)));
      return;
    }

    setSelectedStudentIds((current) => Array.from(new Set([...current, ...visibleStudentIds])));
  }

  function selectSupportStudents() {
    setSelectedStudentIds(visibleStudents.filter((student) => student.status === "support").map((student) => student.id));
  }

  function pickSubject(subjectId: string) {
    const nextSubject = assignmentSubjects.find((subjectItem) => subjectItem.id === subjectId) ?? assignmentSubjects[0];
    const nextLevel = nextSubject?.levels[0];
    const nextAssignment = nextLevel?.topics.flatMap((topic) => topic.items)[0];

    setSelectedSubjectId(nextSubject?.id ?? "");
    setSelectedLevelId(nextLevel?.id ?? "");
    if (nextAssignment) {
      setSelectedAssignmentIds([nextAssignment.id]);
    } else {
      setSelectedAssignmentIds([]);
    }
  }

  function pickLevel(levelId: string) {
    const nextLevel = selectedSubject?.levels.find((level) => level.id === levelId) ?? selectedSubject?.levels[0];
    const nextAssignment = nextLevel?.topics.flatMap((topic) => topic.items)[0];

    setSelectedLevelId(nextLevel?.id ?? "");
    if (nextAssignment) {
      setSelectedAssignmentIds([nextAssignment.id]);
    } else {
      setSelectedAssignmentIds([]);
    }
  }

  function toggleAssignment(assignmentId: string) {
    setSelectedAssignmentIds((current) =>
      current.includes(assignmentId) ? current.filter((id) => id !== assignmentId) : [...current, assignmentId],
    );
  }

  function deliverAssignment() {
    if (!canDeliver || !selectedClass) return;

    setRecentBatches((current) => [
      {
        id: `delivery-${Date.now()}`,
        assignmentTitle: formatSelectedAssignmentsTitle(selectedAssignments, copy),
        className: selectedClass.className,
        dueDate,
        recipients: selectedStudents.length,
      },
      ...current,
    ]);
    setSelectedStudentIds([]);
    setTeacherNote("");
    setAssignDialogOpen(false);
  }

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button variant="outline" onClick={() => onOpenLeaf("class-reports")}>
          {copy.openReports}
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardSectionCard
          title={copy.listTitle}
          description={copy.listDescription(visibleStudents.length, supportCount)}
          action={
            <Button size="sm" variant="outline" onClick={selectSupportStudents} disabled={supportCount === 0}>
              {copy.selectSupport}
            </Button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_150px_150px]">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={copy.searchPlaceholder}
                value={searchValue}
              />
            </div>
            <SelectControl
              ariaLabel={copy.subjectFilter}
              options={[
                { value: "all", label: copy.allSubjects },
                ...subjectOptions.map((item) => ({ value: item, label: item })),
              ]}
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setSelectedStudentIds([]);
              }}
            />
            <SelectControl
              ariaLabel={copy.statusFilter}
              options={[
                { value: "all", label: copy.allStatuses },
                { value: "ahead", label: copy.status.ahead },
                { value: "steady", label: copy.status.steady },
                { value: "support", label: copy.status.support },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
            <SelectControl
              ariaLabel={copy.progressFilter}
              options={[
                { value: "all", label: copy.allProgress },
                { value: "not-started", label: copy.progress.notStarted },
                { value: "in-progress", label: copy.progress.inProgress },
                { value: "completed", label: copy.progress.completed },
              ]}
              value={progressFilter}
              onChange={(value) => setProgressFilter(value as ProgressFilter)}
            />
          </div>

          <SelectionBar
            allVisibleSelected={allVisibleSelected}
            copy={copy}
            onAssign={() => setAssignDialogOpen(true)}
            onClear={() => setSelectedStudentIds([])}
            onToggleAll={toggleVisibleStudents}
            selectedCount={selectedVisibleIds.length}
            visibleCount={visibleStudents.length}
          />

          <StudentDataTable
            copy={copy}
            focusedStudentId={focusedStudent?.id ?? null}
            onFocusStudent={setFocusedStudentId}
            onToggleStudent={toggleStudent}
            selectedIds={selectedVisibleIds}
            students={visibleStudents}
          />
        </DashboardSectionCard>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          {focusedStudent ? <StudentDetailCard copy={copy} student={focusedStudent} /> : null}

          <DashboardSectionCard title={copy.recentTitle} description={copy.recentDescription}>
            <div className="space-y-3">
              {(recentBatches.length ? recentBatches : getInitialBatches(copy)).map((batch) => (
                <div key={batch.id} className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <CheckCircleOutlineOutlinedIcon fontSize="small" />
                    </span>
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold text-slate-950">{batch.assignmentTitle}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {batch.className} • {batch.recipients} {copy.studentUnit(batch.recipients)}
                      </div>
                      <div className="mt-2 text-xs font-medium text-slate-500">
                        {copy.dueDateLabel}: {formatDueDate(batch.dueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSectionCard>
        </aside>
      </section>

      <AssignmentDialog
        assignments={selectedAssignments}
        canDeliver={canDeliver}
        copy={copy}
        dueDate={dueDate}
        levels={selectedSubject?.levels ?? []}
        note={teacherNote}
        onAssignmentToggle={toggleAssignment}
        onClose={() => setAssignDialogOpen(false)}
        onDeliver={deliverAssignment}
        onDueDateChange={setDueDate}
        onLevelChange={pickLevel}
        onNoteChange={setTeacherNote}
        onSubjectChange={pickSubject}
        open={assignDialogOpen}
        schoolName={school.name}
        selectedCount={selectedStudents.length}
        selectedAssignmentIds={selectedAssignmentIds}
        selectedLevelId={selectedLevel?.id ?? ""}
        selectedStudentNames={selectedStudents.map((student) => student.name)}
        selectedSubjectId={selectedSubject?.id ?? ""}
        subjects={assignmentSubjects}
        topics={selectedLevel?.topics ?? []}
      />
    </DashboardPageShell>
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
    <select
      aria-label={ariaLabel}
      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SelectionBar({
  allVisibleSelected,
  copy,
  onAssign,
  onClear,
  onToggleAll,
  selectedCount,
  visibleCount,
}: {
  allVisibleSelected: boolean;
  copy: StudentCopy;
  onAssign: () => void;
  onClear: () => void;
  onToggleAll: () => void;
  selectedCount: number;
  visibleCount: number;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-slate-950">{copy.selectionSummary(selectedCount)}</span>
        <span className="ml-1">{copy.visibleSummary(visibleCount)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAssign} disabled={selectedCount === 0}>
          {copy.openAssignDialog(selectedCount)}
        </Button>
        <Button size="sm" variant="outline" onClick={onToggleAll} disabled={visibleCount === 0}>
          {allVisibleSelected ? copy.unselectVisible : copy.selectVisible}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={selectedCount === 0}>
          {copy.clearSelection}
        </Button>
      </div>
    </div>
  );
}

function StudentDataTable({
  copy,
  focusedStudentId,
  onFocusStudent,
  onToggleStudent,
  selectedIds,
  students,
}: {
  copy: StudentCopy;
  focusedStudentId: string | null;
  onFocusStudent: (studentId: string) => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: string[];
  students: ClassroomStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="text-sm font-semibold text-slate-950">{copy.emptyTitle}</div>
        <div className="mt-2 text-sm text-slate-500">{copy.emptyDescription}</div>
      </div>
    );
  }

  return (
    <>
      <div
        className="mt-4 hidden overflow-auto rounded-2xl border border-slate-200 md:block"
        style={{ maxHeight: TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * TABLE_VISIBLE_ROWS }}
      >
        <table className="min-w-[980px] w-full border-collapse bg-white text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr>
              <th className="w-12 px-4 py-3">{copy.pickColumn}</th>
              <th className="px-4 py-3">{copy.studentColumn}</th>
              <th className="px-4 py-3">{copy.assignmentColumn}</th>
              <th className="px-4 py-3">{copy.progressColumn}</th>
              <th className="px-4 py-3">{copy.scoreColumn}</th>
              <th className="px-4 py-3">{copy.statusColumn}</th>
              <th className="px-4 py-3">{copy.actionColumn}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <StudentTableRow
                key={student.id}
                active={focusedStudentId === student.id}
                checked={selectedIds.includes(student.id)}
                copy={copy}
                onFocus={() => onFocusStudent(student.id)}
                onToggle={() => onToggleStudent(student.id)}
                student={student}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {students.map((student) => (
          <StudentMobileCard
            key={student.id}
            active={focusedStudentId === student.id}
            checked={selectedIds.includes(student.id)}
            copy={copy}
            onFocus={() => onFocusStudent(student.id)}
            onToggle={() => onToggleStudent(student.id)}
            student={student}
          />
        ))}
      </div>
    </>
  );
}

function StudentTableRow({
  active,
  checked,
  copy,
  onFocus,
  onToggle,
  student,
}: {
  active: boolean;
  checked: boolean;
  copy: StudentCopy;
  onFocus: () => void;
  onToggle: () => void;
  student: ClassroomStudent;
}) {
  return (
    <tr className={cn("transition", active ? "bg-blue-50/60" : "hover:bg-slate-50")}>
      <td className="px-4 py-3 align-middle">
        <input
          aria-label={copy.selectStudent(student.name)}
          checked={checked}
          className="h-4 w-4 rounded border-slate-300 accent-slate-950"
          onChange={onToggle}
          type="checkbox"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-semibold text-white">
            {student.avatarSeed}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-950">{student.name}</div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {student.className} • {student.lastActivity}
            </div>
          </div>
        </div>
      </td>
      <td className="max-w-[260px] px-4 py-3">
        <div className="truncate font-medium text-slate-900">{student.currentAssignment}</div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{student.currentStage}</div>
      </td>
      <td className="px-4 py-3">
        <div className="mb-2 flex min-w-[120px] justify-between text-xs font-semibold text-slate-600">
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </div>
        <ProgressBar
          value={student.progressRate}
          className="h-2 bg-slate-100"
          indicatorClassName={getProgressColor(student.progressRate)}
        />
      </td>
      <td className="px-4 py-3 font-semibold text-slate-950">
        {student.averageScore} <span className="text-xs font-medium text-slate-400">{copy.scoreUnit}</span>
      </td>
      <td className="px-4 py-3">
        <Badge tone={getStatusTone(student.status)}>{copy.status[student.status]}</Badge>
      </td>
      <td className="px-4 py-3">
        <Button size="sm" variant="outline" onClick={onFocus}>
          {copy.viewDetail}
        </Button>
      </td>
    </tr>
  );
}

function StudentMobileCard({
  active,
  checked,
  copy,
  onFocus,
  onToggle,
  student,
}: {
  active: boolean;
  checked: boolean;
  copy: StudentCopy;
  onFocus: () => void;
  onToggle: () => void;
  student: ClassroomStudent;
}) {
  return (
    <article className={cn("rounded-2xl border bg-white p-4", active ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200")}>
      <div className="flex items-start gap-3">
        <input
          aria-label={copy.selectStudent(student.name)}
          checked={checked}
          className="mt-3 h-4 w-4 rounded border-slate-300 accent-slate-950"
          onChange={onToggle}
          type="checkbox"
        />
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
          {student.avatarSeed}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-950">{student.name}</div>
          <div className="mt-0.5 text-sm text-slate-500">
            {student.className} • {student.lastActivity}
          </div>
        </div>
        <Badge tone={getStatusTone(student.status)}>{copy.status[student.status]}</Badge>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-950">{student.currentAssignment}</div>
        <div className="mt-1 text-sm text-slate-500">{student.currentStage}</div>
        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </div>
        <ProgressBar value={student.progressRate} className="mt-2 h-2 bg-slate-100" indicatorClassName={getProgressColor(student.progressRate)} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-950">
          {student.averageScore} {copy.scoreUnit}
        </span>
        <Button size="sm" variant="outline" onClick={onFocus}>
          {copy.viewDetail}
        </Button>
      </div>
    </article>
  );
}

function AssignmentDialog({
  assignments,
  canDeliver,
  copy,
  dueDate,
  levels,
  note,
  onAssignmentToggle,
  onClose,
  onDeliver,
  onDueDateChange,
  onLevelChange,
  onNoteChange,
  onSubjectChange,
  open,
  schoolName,
  selectedCount,
  selectedAssignmentIds,
  selectedLevelId,
  selectedStudentNames,
  selectedSubjectId,
  subjects,
  topics,
}: {
  assignments: AssignmentCatalogItem[];
  canDeliver: boolean;
  copy: StudentCopy;
  dueDate: string;
  levels: AssignmentLevel[];
  note: string;
  onAssignmentToggle: (value: string) => void;
  onClose: () => void;
  onDeliver: () => void;
  onDueDateChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  open: boolean;
  schoolName: string;
  selectedCount: number;
  selectedAssignmentIds: string[];
  selectedLevelId: string;
  selectedStudentNames: string[];
  selectedSubjectId: string;
  subjects: AssignmentSubject[];
  topics: AssignmentTopic[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        aria-modal="true"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)] sm:mx-auto sm:max-w-6xl sm:rounded-[28px]"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <AssignmentTurnedInOutlinedIcon fontSize="inherit" />
              {copy.assignPanelTitle}
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">
              {copy.assignDialogTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{copy.assignDialogDescription}</p>
          </div>
          <button
            aria-label={copy.closeDialog}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            onClick={onClose}
            type="button"
          >
            <CloseOutlinedIcon fontSize="small" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto bg-slate-50/80 p-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:p-6">
          <aside className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {copy.subjectPickerLabel}
              </span>
              <select
                aria-label={copy.subjectPickerLabel}
                className="mt-2 h-12 w-full rounded-2xl border border-blue-200 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => onSubjectChange(event.target.value)}
                value={selectedSubjectId}
              >
                {subjects.map((subjectItem) => (
                  <option key={subjectItem.id} value={subjectItem.id}>
                    {subjectItem.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedSubjectId ? (
              <PickerGroup label={copy.levelPickerLabel}>
                {levels.map((level) => {
                  const selected = level.id === selectedLevelId;

                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                        selected ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white",
                      )}
                      key={level.id}
                      onClick={() => onLevelChange(level.id)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold">{level.label}</span>
                      <span className={cn("mt-1 block text-xs leading-5", selected ? "text-slate-300" : "text-slate-500")}>
                        {level.description}
                      </span>
                    </button>
                  );
                })}
              </PickerGroup>
            ) : null}
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">{copy.selectedRecipientsTitle}</div>
                  <div className="mt-1 max-w-2xl truncate text-sm text-slate-500" title={selectedStudentNames.join(", ")}>
                    {formatSelectedStudentNames(selectedStudentNames, copy)}
                  </div>
                </div>
                <Badge tone="secondary">{copy.selectedRecipientsCount(selectedCount)}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              {topics.map((topic, topicIndex) => (
                <TopicAssignmentGroup
                  copy={copy}
                  key={topic.id}
                  onAssignmentToggle={onAssignmentToggle}
                  selectedAssignmentIds={selectedAssignmentIds}
                  topic={topic}
                  topicIndex={topicIndex}
                />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{copy.dueDateLabel}</span>
                  <Input
                    className="mt-2"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) => onDueDateChange(event.target.value)}
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-slate-700">{copy.noteLabel}</span>
                  <Textarea
                    className="mt-2 min-h-[92px]"
                    placeholder={copy.notePlaceholder}
                    value={note}
                    onChange={(event) => onNoteChange(event.target.value)}
                  />
                </label>
              </div>

              <AssignmentSummary assignments={assignments} copy={copy} />
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm leading-6 text-slate-500">{copy.deliveryHint(selectedCount, schoolName)}</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              {copy.cancelAction}
            </Button>
            <Button disabled={!canDeliver} onClick={onDeliver}>
              {copy.deliverAction(selectedCount)}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function PickerGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function TopicAssignmentGroup({
  copy,
  onAssignmentToggle,
  selectedAssignmentIds,
  topic,
  topicIndex,
}: {
  copy: StudentCopy;
  onAssignmentToggle: (value: string) => void;
  selectedAssignmentIds: string[];
  topic: AssignmentTopic;
  topicIndex: number;
}) {
  const topicLabel = topic.label || copy.otherTopicLabel;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
          {topicIndex + 1}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{topicLabel}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{copy.topicCount(topic.items.length)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {topic.items.map((item) => {
          const selected = selectedAssignmentIds.includes(item.id);

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                selected ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
              )}
              key={item.id}
              onClick={() => onAssignmentToggle(item.id)}
              type="button"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">{item.activityLabel}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{copy.questionCountValue(item.questionCount)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {copy.durationLabel}: {item.durationLabel}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md border text-[11px] font-bold",
                      selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-transparent",
                    )}
                  >
                    ✓
                  </span>
                  <Badge tone={item.kind === "test" ? "warning" : "secondary"}>{item.kind === "test" ? copy.testType : copy.trainType}</Badge>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AssignmentSummary({ assignments, copy }: { assignments: AssignmentCatalogItem[]; copy: StudentCopy }) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <div className="text-sm font-semibold text-slate-950">{copy.noAssignmentSelectedTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-500">{copy.noAssignmentSelectedDescription}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{copy.selectedActivitiesLabel}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{copy.selectedAssignmentsCount(assignments.length)}</div>
      <div className="mt-2 space-y-2">
        {assignments.slice(0, 3).map((assignment) => (
          <div key={assignment.id} className="rounded-xl bg-white px-3 py-2">
            <div className="line-clamp-1 text-sm font-semibold text-slate-950">{assignment.activityLabel}</div>
            <div className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
              {assignment.levelLabel} / {assignment.topicLabel}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{copy.questionCountValue(assignment.questionCount)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {copy.durationLabel}: {assignment.durationLabel}
              </span>
            </div>
          </div>
        ))}
        {assignments.length > 3 ? <div className="text-xs font-medium text-slate-500">+{assignments.length - 3}</div> : null}
      </div>
    </div>
  );
}

function StudentDetailCard({ copy, student }: { copy: StudentCopy; student: ClassroomStudent }) {
  return (
    <DashboardSectionCard title={copy.studentPanelTitle} description={copy.studentPanelDescription}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-slate-950 text-base font-semibold text-white">
            {student.avatarSeed}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-950">{student.name}</div>
            <div className="mt-1 text-sm text-slate-500">
              {student.className} • {student.schoolName}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label={copy.progressLabel} value={`${student.progressRate}%`} />
          <Metric label={copy.scoreLabel} value={`${student.averageScore}`} />
          <Metric label={copy.streakLabel} value={`${student.streakDays}`} />
          <Metric label={copy.completedLabel} value={`${student.completedAssignments}`} />
        </div>

        <InfoBlock title={copy.currentAssignmentTitle} body={`${student.currentAssignment} - ${student.currentStage}`} />
        <InfoBlock title={copy.mentorNoteTitle} body={student.mentorNote} />
      </div>
    </DashboardSectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500">{body}</div>
    </div>
  );
}

function getProgressColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function getStatusTone(status: StudentStatus) {
  if (status === "ahead") return "success";
  if (status === "support") return "warning";
  return "secondary";
}

function getStudentAssignmentSubject(student: ClassroomStudent) {
  const matchedAssignment =
    assignmentCatalog.find((assignment) => assignment.title === student.currentAssignment) ??
    assignmentRuns.find((assignment) => assignment.title === student.currentAssignment);

  if (matchedAssignment) return matchedAssignment.subjectLabel;
  if (student.currentAssignment.toLowerCase().includes("ic3 gs6")) return IC3_PROGRAM_LABEL;
  return null;
}

function formatSelectedStudentNames(names: string[], copy: StudentCopy) {
  if (names.length === 0) return copy.noStudentSelected;
  const visibleNames = names.slice(0, 5).join(", ");
  return names.length > 5 ? `${visibleNames}, ...` : visibleNames;
}

function formatSelectedAssignmentsTitle(assignments: AssignmentCatalogItem[], copy: StudentCopy) {
  if (assignments.length === 0) return copy.noAssignmentSelectedTitle;
  if (assignments.length === 1) return assignments[0].title;
  return copy.deliveryBatchTitle(assignments.length, assignments[0].activityLabel);
}

function formatDueDate(value: string) {
  if (!value) return "-";
  return value.replace("T", " ");
}

function getInitialBatches(copy: StudentCopy): DeliveryBatch[] {
  return [
    {
      id: "seed-batch-1",
      assignmentTitle: "Reading sprint - daily routines",
      className: "Lớp 6A1",
      dueDate: "2026-04-30T20:30",
      recipients: 32,
    },
    {
      id: "seed-batch-2",
      assignmentTitle: copy.sampleAssignment,
      className: "Lớp 7B1",
      dueDate: "2026-05-02T09:00",
      recipients: 12,
    },
  ];
}

type StudentCopy = typeof enCopy;

const viCopy = {
  badge: "Học sinh & bài tập",
  description:
    "Một màn duy nhất để giáo viên xem danh sách học sinh, lọc nhóm cần xử lý, chọn học sinh và giao bài ngay. Thiết kế ưu tiên thao tác đơn giản cho giáo viên không rành công nghệ.",
  openReports: "Xem báo cáo",
  listTitle: "Danh sách học sinh",
  listDescription: (count: number, support: number): string =>
    `${count} học sinh đang hiển thị, ${support} em cần hỗ trợ.`,
  searchPlaceholder: "Tìm học sinh, bài đang làm, ghi chú...",
  classFilter: "Lọc theo lớp",
  subjectFilter: "Lọc theo môn",
  statusFilter: "Lọc theo trạng thái",
  progressFilter: "Lọc theo tiến độ",
  allSubjects: "Tất cả môn",
  allStatuses: "Tất cả trạng thái",
  allProgress: "Tất cả tiến độ",
  selectSupport: "Chọn nhóm cần hỗ trợ",
  selectionSummary: (count: number): string => `${count} học sinh đã chọn.`,
  visibleSummary: (count: number): string => `${count} học sinh trong danh sách lọc.`,
  openAssignDialog: (count: number): string => (count > 0 ? `Giao bài cho ${count} học sinh` : "Chọn học sinh để giao bài"),
  selectVisible: "Chọn tất cả đang lọc",
  unselectVisible: "Bỏ chọn đang lọc",
  clearSelection: "Bỏ chọn",
  pickColumn: "Chọn",
  studentColumn: "Học sinh",
  assignmentColumn: "Bài đang làm",
  progressColumn: "Tiến độ",
  scoreColumn: "Điểm",
  statusColumn: "Trạng thái",
  actionColumn: "Chi tiết",
  selectStudent: (name: string): string => `Chọn ${name}`,
  viewDetail: "Xem",
  emptyTitle: "Không có học sinh phù hợp",
  emptyDescription: "Thử đổi bộ lọc hoặc tìm theo tên học sinh khác.",
  status: {
    ahead: "Bứt tốc",
    steady: "Ổn định",
    support: "Cần hỗ trợ",
  },
  progress: {
    notStarted: "Chưa bắt đầu",
    inProgress: "Đang làm",
    completed: "Đã hoàn thành",
  },
  assignPanelTitle: "Giao bài",
  assignDialogTitle: "Chọn bài tập để giao",
  assignDialogDescription: "Chọn môn, level, rồi chọn bài theo từng chủ đề. Chủ đề chưa phân loại sẽ nằm trong nhóm Khác.",
  assignPanelDescription: (count: number): string =>
    count > 0 ? `Sẵn sàng giao bài cho ${count} học sinh đã chọn.` : "Tick học sinh trong bảng để bắt đầu giao bài.",
  closeDialog: "Đóng cửa sổ giao bài",
  selectedStudentsTitle: "Học sinh nhận bài",
  noStudentSelected: "Chưa chọn học sinh nào.",
  selectedRecipientsTitle: "Danh sách học sinh nhận bài",
  selectedRecipientsCount: (count: number): string => `${count} học sinh`,
  subjectPickerLabel: "Môn học",
  levelPickerLabel: "Level",
  assignmentListTitle: "Danh sách bài theo chủ đề",
  assignmentListDescription: "Chọn một bài train hoặc test trong các chủ đề bên dưới.",
  assignmentLabel: "Bài tập",
  assignmentPathLabel: "Lộ trình IC3 GS6",
  topicLabel: "Chủ đề",
  activityTypeLabel: "Loại bài",
  trainType: "Train",
  trainTypeDescription: "Luyện tập có hướng dẫn",
  testType: "Test",
  testTypeDescription: "Kiểm tra/chấm điểm",
  assignmentChoiceLabel: "Chọn bài cụ thể",
  selectedActivityLabel: "Bài đã chọn",
  selectedActivitiesLabel: "Bài đã chọn",
  selectedAssignmentsCount: (count: number): string => `${count} bài tập đã chọn`,
  noAssignmentSelectedTitle: "Chưa chọn bài tập",
  noAssignmentSelectedDescription: "Chọn một hoặc nhiều bài tập trong danh sách theo chủ đề.",
  questionCountValue: (count: number): string => `${count} câu`,
  durationLabel: "Thời lượng",
  dueDateLabel: "Hạn nộp",
  noteLabel: "Ghi chú cho học sinh",
  notePlaceholder: "Ví dụ: Làm phần luyện tập 1-3 trước 20:30...",
  cancelAction: "Hủy",
  otherTopicLabel: "Khác",
  topicCount: (count: number): string => `${count} bài`,
  deliveryBatchTitle: (count: number, firstTitle: string): string => `${count} bài đã chọn: ${firstTitle}`,
  deliveryHint: (count: number, schoolName: string): string =>
    count > 0 ? `Bài sẽ được giao cho ${count} học sinh tại ${schoolName}.` : "Nút giao bài sẽ mở sau khi chọn học sinh.",
  deliverAction: (count: number): string => (count > 0 ? `Giao bài cho ${count} học sinh` : "Chọn học sinh để giao bài"),
  recentTitle: "Đã giao gần đây",
  recentDescription: "Các lượt giao bài mới nhất để giáo viên kiểm tra lại nhanh.",
  studentUnit: (): string => "học sinh",
  submittedLabel: "Đã nộp",
  inProgressLabel: "Đang làm",
  reviewLabel: "Chờ chấm",
  studentPanelTitle: "Hồ sơ nhanh",
  studentPanelDescription: "Xem nhanh tình hình một học sinh mà không rời khỏi bảng.",
  progressLabel: "Tiến độ",
  scoreLabel: "Điểm TB",
  scoreUnit: "điểm",
  streakLabel: "Chuỗi ngày",
  completedLabel: "Đã xong",
  currentAssignmentTitle: "Bài hiện tại",
  mentorNoteTitle: "Gợi ý cho giáo viên",
  sampleAssignment: "Ôn tập phân số và quy đồng",
};

const enCopy = {
  badge: "Students & assignments",
  description:
    "One simple workspace for teachers to review the roster, filter the right group, select students, and assign work immediately.",
  openReports: "View reports",
  listTitle: "Student list",
  listDescription: (count: number, support: number): string =>
    `${count} ${count === 1 ? "student" : "students"} shown, ${support} need support.`,
  searchPlaceholder: "Search student, live assignment, note...",
  classFilter: "Filter by class",
  subjectFilter: "Filter by subject",
  statusFilter: "Filter by status",
  progressFilter: "Filter by progress",
  allSubjects: "All subjects",
  allStatuses: "All statuses",
  allProgress: "All progress",
  selectSupport: "Select support group",
  selectionSummary: (count: number): string => `${count} ${count === 1 ? "student" : "students"} selected.`,
  visibleSummary: (count: number): string => `${count} ${count === 1 ? "student" : "students"} in the filtered list.`,
  openAssignDialog: (count: number): string =>
    count > 0 ? `Assign to ${count} ${count === 1 ? "student" : "students"}` : "Select students to assign",
  selectVisible: "Select all filtered",
  unselectVisible: "Unselect filtered",
  clearSelection: "Clear",
  pickColumn: "Pick",
  studentColumn: "Student",
  assignmentColumn: "Current work",
  progressColumn: "Progress",
  scoreColumn: "Score",
  statusColumn: "Status",
  actionColumn: "Details",
  selectStudent: (name: string): string => `Select ${name}`,
  viewDetail: "View",
  emptyTitle: "No matching students",
  emptyDescription: "Try changing the filters or searching another name.",
  status: {
    ahead: "Ahead",
    steady: "Steady",
    support: "Support",
  },
  progress: {
    notStarted: "Not started",
    inProgress: "In progress",
    completed: "Completed",
  },
  assignPanelTitle: "Assign work",
  assignDialogTitle: "Choose assignment",
  assignDialogDescription: "Choose a subject and level, then pick an activity grouped by topic. Ungrouped work appears under Other.",
  assignPanelDescription: (count: number): string =>
    count > 0
      ? `Ready to assign work to ${count} selected ${count === 1 ? "student" : "students"}.`
      : "Tick students in the table to start assigning work.",
  closeDialog: "Close assignment dialog",
  selectedStudentsTitle: "Recipients",
  noStudentSelected: "No students selected yet.",
  selectedRecipientsTitle: "Selected recipients",
  selectedRecipientsCount: (count: number): string => `${count} ${count === 1 ? "student" : "students"}`,
  subjectPickerLabel: "Subject",
  levelPickerLabel: "Level",
  assignmentListTitle: "Activities by topic",
  assignmentListDescription: "Pick one train or test activity from the topic groups below.",
  assignmentLabel: "Assignment",
  assignmentPathLabel: "IC3 GS6 path",
  topicLabel: "Topic",
  activityTypeLabel: "Activity type",
  trainType: "Train",
  trainTypeDescription: "Guided practice",
  testType: "Test",
  testTypeDescription: "Graded check",
  assignmentChoiceLabel: "Choose activity",
  selectedActivityLabel: "Selected activity",
  selectedActivitiesLabel: "Selected activities",
  selectedAssignmentsCount: (count: number): string => `${count} selected ${count === 1 ? "activity" : "activities"}`,
  noAssignmentSelectedTitle: "No assignment selected",
  noAssignmentSelectedDescription: "Choose one or more activities from the topic list.",
  questionCountValue: (count: number): string => `${count} ${count === 1 ? "question" : "questions"}`,
  durationLabel: "Duration",
  dueDateLabel: "Due date",
  noteLabel: "Student note",
  notePlaceholder: "Example: Complete practice 1-3 before 20:30...",
  cancelAction: "Cancel",
  otherTopicLabel: "Other",
  topicCount: (count: number): string => `${count} ${count === 1 ? "activity" : "activities"}`,
  deliveryBatchTitle: (count: number, firstTitle: string): string => `${count} selected activities: ${firstTitle}`,
  deliveryHint: (count: number, schoolName: string): string =>
    count > 0
      ? `This work will be delivered to ${count} ${count === 1 ? "student" : "students"} at ${schoolName}.`
      : "Assign button unlocks after selecting students.",
  deliverAction: (count: number): string =>
    count > 0 ? `Assign to ${count} ${count === 1 ? "student" : "students"}` : "Select students to assign",
  recentTitle: "Recently assigned",
  recentDescription: "Recent delivery batches so teachers can quickly verify what was sent.",
  studentUnit: (count: number): string => (count === 1 ? "student" : "students"),
  submittedLabel: "Submitted",
  inProgressLabel: "In progress",
  reviewLabel: "To review",
  studentPanelTitle: "Quick profile",
  studentPanelDescription: "Review one learner without leaving the table.",
  progressLabel: "Progress",
  scoreLabel: "Avg score",
  scoreUnit: "pts",
  streakLabel: "Streak",
  completedLabel: "Completed",
  currentAssignmentTitle: "Current assignment",
  mentorNoteTitle: "Teacher recommendation",
  sampleAssignment: "Fraction review and common denominators",
};
