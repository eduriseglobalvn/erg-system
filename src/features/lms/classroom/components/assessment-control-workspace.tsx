import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

import {
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import Checkbox from "@mui/material/Checkbox";
import {
  assignmentRuns,
  classroomSchools,
  defaultClassId,
  getSchoolSnapshots,
  getStudentsByClass,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { AssignmentRun, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type DeliveryMode = "all" | "selected";

type DeliveryBatch = {
  id: string;
  assignmentTitle: string;
  className: string;
  dueDate: string;
  recipients: number;
};

export function AssessmentControlWorkspace({
  activeLeaf,
  allowedSchoolIds,
  onOpenLeaf,
  onSelectSchool,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  allowedSchoolIds: string[];
  onOpenLeaf: (leafId: string) => void;
  onSelectSchool: (schoolId: string) => void;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [classId, setClassId] = useState(defaultClassId);
  const [subject, setSubject] = useState("all");
  const [assignmentId, setAssignmentId] = useState(assignmentRuns[0]?.id ?? "");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("2026-04-30T20:30");
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);

  const schoolId = selectedSchoolId;
  const school = classroomSchools.find((item) => item.id === schoolId) ?? classroomSchools[0];
  const schoolClasses = useMemo(() => getSchoolSnapshots(schoolId), [schoolId]);
  const selectedClass = schoolClasses.find((item) => item.id === classId) ?? schoolClasses[0];
  const students = useMemo(() => getStudentsByClass(selectedClass?.id ?? classId), [classId, selectedClass?.id]);
  const subjectOptions = useMemo(() => Array.from(new Set(assignmentRuns.map((assignment) => assignment.subjectLabel))), []);
  const filteredAssignments = useMemo(
    () =>
      assignmentRuns.filter((assignment) => {
        const matchesSubject = subject === "all" || assignment.subjectLabel === subject;
        const matchesGrade = !selectedClass || assignment.targetLevel === selectedClass.gradeLabel || assignment.activeClasses >= 4;
        return matchesSubject && matchesGrade;
      }),
    [selectedClass, subject],
  );
  const selectedAssignment =
    filteredAssignments.find((assignment) => assignment.id === assignmentId) ?? filteredAssignments[0] ?? assignmentRuns[0];
  const selectedRecipients = deliveryMode === "all" ? students : students.filter((student) => selectedStudentIds.includes(student.id));
  const canDeliver = Boolean(selectedAssignment && selectedClass && selectedRecipients.length > 0 && dueDate);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  }

  function deliverAssignment() {
    if (!canDeliver || !selectedAssignment || !selectedClass) return;

    setBatches((current) => [
      {
        id: `delivery-${Date.now()}`,
        assignmentTitle: selectedAssignment.title,
        className: selectedClass.className,
        dueDate,
        recipients: selectedRecipients.length,
      },
      ...current,
    ]);
  }

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <>
          <DashboardSegmentedControl
            options={classroomSchools.map((item) => ({
              value: item.id,
              label: allowedSchoolIds.includes(item.id) ? item.name : `${item.name} (403)`,
            }))}
            value={schoolId}
            onChange={(nextSchoolId) => {
              onSelectSchool(nextSchoolId);
              setSelectedStudentIds([]);
            }}
          />
          <SelectControl
            ariaLabel={copy.classSelectLabel}
            options={schoolClasses.map((item) => ({ value: item.id, label: item.className }))}
            value={selectedClass?.id ?? ""}
            onChange={(value) => {
              setClassId(value);
              setSelectedStudentIds([]);
            }}
          />
          <SelectControl
            ariaLabel={copy.subjectSelectLabel}
            options={[
              { value: "all", label: copy.allSubjects },
              ...subjectOptions.map((item) => ({ value: item, label: item })),
            ]}
            value={subject}
            onChange={setSubject}
          />
          <Button variant="outlined" onClick={() => onOpenLeaf("class-students")}>
            {copy.backToTracking}
          </Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <DashboardSectionCard title={copy.deliveryTitle} description={copy.deliveryDescription}>
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{copy.assignmentLabel}</span>
                <AppSelect
                  className="mt-2 h-10 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-800 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  onChange={(event) => setAssignmentId(event.target.value)}
                  value={selectedAssignment?.id ?? ""}
                >
                  {filteredAssignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </AppSelect>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{copy.dueDateLabel}</span>
                <TextField
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            </div>

            {selectedAssignment ? <AssignmentPreview assignment={selectedAssignment} copy={copy} /> : null}

            <div className="rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950">{copy.recipientsTitle}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {copy.recipientCount(selectedRecipients.length, students.length)}
                  </div>
                </div>
                <div className="inline-flex rounded-lg border border-[#cbd7e6] bg-white p-1">
                  {[
                    { id: "all" as const, label: copy.allStudents },
                    { id: "selected" as const, label: copy.selectedStudents },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                        deliveryMode === mode.id ? "bg-[var(--erg-blue)] text-white" : "text-slate-600 hover:bg-[#f3f4f6]",
                      )}
                      onClick={() => setDeliveryMode(mode.id)}
                      type="button"
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryMode === "selected" ? (
                <div className="mt-4 grid max-h-[320px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {students.map((student) => (
                    <StudentCheck
                      key={student.id}
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      student={student}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {copy.deliveryHint(selectedClass?.className ?? "-", school.name)}
              </div>
              <Button variant="contained" disabled={!canDeliver} onClick={deliverAssignment}>
                {copy.deliverAction}
              </Button>
            </div>
          </div>
        </DashboardSectionCard>

        <div className="space-y-4">
          <DashboardSectionCard title={copy.recentTitle} description={copy.recentDescription}>
            <div className="space-y-3">
              {(batches.length ? batches : getInitialBatches(copy)).map((batch) => (
                <div key={batch.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold text-slate-950">{batch.assignmentTitle}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {batch.className} • {batch.recipients} {copy.studentsUnit(batch.recipients)}
                      </div>
                      <div className="mt-2 text-[13px] font-semibold text-slate-600">
                        {copy.dueDateLabel}: {formatDueDate(batch.dueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title={copy.collectTitle} description={copy.collectDescription}>
            <div className="space-y-3">
              {filteredAssignments.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold text-slate-950">{assignment.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{assignment.dueLabel}</div>
                    </div>
                    <Chip
                      label={`${assignment.needsReviewCount} ${copy.reviewLabel}`}
                      size="small"
                      color={assignment.needsReviewCount > 12 ? "warning" : "secondary"}
                    />
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={assignment.completionRate}
                    sx={{ mt: 2, height: 8, borderRadius: 1 }}
                  />
                </div>
              ))}
            </div>
          </DashboardSectionCard>
        </div>
      </section>
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

function AssignmentPreview({ assignment, copy }: { assignment: AssignmentRun; copy: AssignmentCopy }) {
  return (
    <div className="rounded-lg border border-[#b8d6fa] bg-[#ebf3fc] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--erg-blue)]">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-950">{assignment.title}</div>
          <div className="mt-1 text-sm text-slate-600">
            {assignment.subjectLabel} • {assignment.targetLevel}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <PreviewMetric label={copy.submittedLabel} value={`${assignment.submittedCount}`} />
            <PreviewMetric label={copy.inProgressLabel} value={`${assignment.inProgressCount}`} />
            <PreviewMetric label={copy.reviewLabel} value={`${assignment.needsReviewCount}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <div className="text-[13px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function StudentCheck({
  checked,
  onChange,
  student,
}: {
  checked: boolean;
  onChange: () => void;
  student: ClassroomStudent;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#cbd7e6] bg-white px-3 py-3 transition hover:bg-[#f8fbff]">
      <Checkbox checked={checked} onChange={onChange} />
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue)] text-[13px] font-bold text-white">
        {student.avatarSeed}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">{student.name}</span>
        <span className="block truncate text-[13px] font-semibold text-slate-600">{student.currentStage}</span>
      </span>
    </label>
  );
}

function formatDueDate(value: string) {
  if (!value) return "-";
  return value.replace("T", " ");
}

function getInitialBatches(copy: AssignmentCopy): DeliveryBatch[] {
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

type AssignmentCopy = typeof enCopy;

const viCopy = {
  badge: "Giao bài / thu bài",
  description:
    "Giao bài theo đúng lớp, đúng môn, đúng học sinh. Giáo viên có thể giao cho cả lớp hoặc chỉ một nhóm học sinh cần luyện thêm.",
  backToTracking: "Điều phối lớp",
  classSelectLabel: "Chọn lớp",
  subjectSelectLabel: "Chọn môn học",
  allSubjects: "Tất cả môn",
  deliveryTitle: "Tạo lượt giao bài",
  deliveryDescription: "Chọn bài, hạn nộp và nhóm học sinh nhận bài. Đây là luồng chính để giáo viên thực sự giao bài.",
  assignmentLabel: "Bài tập",
  dueDateLabel: "Hạn nộp",
  recipientsTitle: "Người nhận",
  recipientCount: (selected: number, total: number) => `${selected}/${total} học sinh sẽ nhận bài`,
  allStudents: "Cả lớp",
  selectedStudents: "Chọn học sinh",
  deliveryHint: (className: string, schoolName: string) => `Bài sẽ được giao trong ${className} tại ${schoolName}.`,
  deliverAction: "Giao bài",
  recentTitle: "Đã giao gần đây",
  recentDescription: "Các lượt giao bài vừa tạo để giáo viên kiểm tra lại nhanh.",
  collectTitle: "Thu bài và review",
  collectDescription: "Theo dõi bài đã nộp, đang làm và số bài cần giáo viên review.",
  studentsUnit: (): string => "học sinh",
  submittedLabel: "Đã nộp",
  inProgressLabel: "Đang làm",
  reviewLabel: "chờ review",
  sampleAssignment: "Ôn tập phân số và quy đồng",
};

const enCopy = {
  badge: "Assign / collect",
  description:
    "Assign work by campus, class, subject, and recipient. Teachers can send work to the full class or only selected students.",
  backToTracking: "Classroom tracking",
  classSelectLabel: "Select class",
  subjectSelectLabel: "Select subject",
  allSubjects: "All subjects",
  deliveryTitle: "Create assignment delivery",
  deliveryDescription: "Choose the work, due date, and recipient group. This is the primary flow for assigning work.",
  assignmentLabel: "Assignment",
  dueDateLabel: "Due date",
  recipientsTitle: "Recipients",
  recipientCount: (selected: number, total: number) => `${selected}/${total} students will receive this work`,
  allStudents: "Full class",
  selectedStudents: "Pick students",
  deliveryHint: (className: string, schoolName: string) => `This will be delivered to ${className} at ${schoolName}.`,
  deliverAction: "Assign work",
  recentTitle: "Recently assigned",
  recentDescription: "Recent delivery batches so teachers can quickly verify what was sent.",
  collectTitle: "Collect and review",
  collectDescription: "Track submitted work, in-progress work, and items waiting for teacher review.",
  studentsUnit: (count: number): string => (count === 1 ? "student" : "students"),
  submittedLabel: "Submitted",
  inProgressLabel: "In progress",
  reviewLabel: "to review",
  sampleAssignment: "Fraction review and common denominators",
};
