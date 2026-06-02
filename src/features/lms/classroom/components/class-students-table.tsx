import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, ProgressBar } from "@/components/ui/dashboard-kit";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, TABLE_VISIBLE_ROWS } from "./class-students-workspace.constants";
import type { StudentCopy } from "./class-students-workspace.copy";
import { getProgressColor, getStatusTone } from "./class-students-workspace.utils";

export function SelectControl({
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

export function SelectionBar({
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

export function StudentDataTable({
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

export function StudentDetailCard({ copy, student }: { copy: StudentCopy; student: ClassroomStudent }) {
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

