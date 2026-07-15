import { useRef } from "react";

import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Checkbox from "@mui/material/Checkbox";
import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { cn } from "@/lib/utils";
import { TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, TABLE_VISIBLE_ROWS } from "./class-students-workspace.constants";
import type { StudentCopy } from "./class-students-workspace.copy";
import { getStatusTone } from "./class-students-workspace.utils";
import { AppSelect } from "@/components/ui/app-select";

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
    <AppSelect
      aria-label={ariaLabel}
      className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-800 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
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
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-slate-950">{copy.selectionSummary(selectedCount)}</span>
        <span className="ml-1">{copy.visibleSummary(visibleCount)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="small" variant="contained" onClick={onAssign} disabled={selectedCount === 0}>
          {copy.openAssignDialog(selectedCount)}
        </Button>
        <Button size="small" variant="outlined" onClick={onToggleAll} disabled={visibleCount === 0}>
          {allVisibleSelected ? copy.unselectVisible : copy.selectVisible}
        </Button>
        <Button size="small" variant="text" onClick={onClear} disabled={selectedCount === 0}>
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
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualList({
    count: students.length,
    estimateSize: TABLE_ROW_HEIGHT,
    overscan: 8,
    scrollRef: tableScrollRef,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const bottomPadding = Math.max(0, rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0));

  if (students.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-[#f8fbff] p-8 text-center">
        <div className="text-sm font-semibold text-slate-950">{copy.emptyTitle}</div>
        <div className="mt-2 text-sm text-slate-500">{copy.emptyDescription}</div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={tableScrollRef}
        className="mt-4 hidden overflow-auto rounded-lg border border-[#cbd7e6] md:block"
        style={{ maxHeight: TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * TABLE_VISIBLE_ROWS }}
      >
        <table className="erg-data-table min-w-[980px] w-full border-collapse bg-white text-left text-[14px]">
          <thead className="sticky top-0 z-10 bg-[#eef4fb] text-[13px] font-bold text-slate-700 shadow-sm">
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
          <tbody>
            {topPadding > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: topPadding, padding: 0 }} />
              </tr>
            ) : null}
            {virtualRows.map((virtualRow) => {
              const student = students[virtualRow.index];
              if (!student) return null;

              return (
                <StudentTableRow
                  key={student.id}
                  active={focusedStudentId === student.id}
                  checked={selectedIds.includes(student.id)}
                  copy={copy}
                  onFocus={() => onFocusStudent(student.id)}
                  onToggle={() => onToggleStudent(student.id)}
                  student={student}
                />
              );
            })}
            {bottomPadding > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: bottomPadding, padding: 0 }} />
              </tr>
            ) : null}
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
    <tr className={cn("transition", active ? "bg-[#ebf3fc]" : "hover:bg-[#f8fbff]")}> 
      <td className="px-4 py-3 align-middle">
        <Checkbox
          size="small"
          sx={{ p: 0 }}
          slotProps={{ input: { "aria-label": copy.selectStudent(student.name) } }}
          checked={checked}
          onChange={onToggle}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue)] text-[13px] font-bold text-white">
            {student.avatarSeed}
          </span>
          <div className="min-w-0">
            <button type="button" className="block max-w-full truncate text-left font-bold text-slate-950 hover:text-[var(--erg-blue)] hover:underline" onClick={onFocus}>
              {student.name}
            </button>
            <div className="mt-1 truncate text-[13px] font-medium text-slate-600">
              {student.className} • {student.lastActivity}
            </div>
          </div>
        </div>
      </td>
      <td className="max-w-[260px] px-4 py-3">
        <div className="truncate font-medium text-slate-900">{student.currentAssignment}</div>
        <div className="mt-1 truncate text-[13px] font-medium text-slate-600">{student.currentStage}</div>
      </td>
      <td className="px-4 py-3">
        <div className="mb-2 flex min-w-[120px] justify-between text-[13px] font-semibold text-slate-700">
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </div>
        <LinearProgress
          variant="determinate"
          value={student.progressRate}
          sx={{ height: 8, borderRadius: 1, bgcolor: "grey.100" }}
        />
      </td>
      <td className="px-4 py-3 font-semibold text-slate-950">
        {student.averageScore} <span className="text-[13px] font-semibold text-slate-500">{copy.scoreUnit}</span>
      </td>
      <td className="px-4 py-3">
        <Chip label={copy.status[student.status]} size="small" color={getStatusTone(student.status)} />
      </td>
      <td className="px-4 py-3">
        <Button size="small" variant="outlined" onClick={onFocus}>
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
    <article className={cn("rounded-lg border bg-white p-4", active ? "border-[#b8d6fa] ring-2 ring-[var(--erg-blue-ring)]" : "border-[#cbd7e6]")}>
      <div className="flex items-start gap-3">
        <Checkbox
          size="small"
          aria-label={copy.selectStudent(student.name)}
          checked={checked}
          sx={{ mt: 0.5, p: 0.5 }}
          onChange={onToggle}
        />
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue)] text-sm font-semibold text-white">
          {student.avatarSeed}
        </span>
        <div className="min-w-0 flex-1">
          <button type="button" className="text-left font-bold text-slate-950 hover:text-[var(--erg-blue)] hover:underline" onClick={onFocus}>
            {student.name}
          </button>
          <div className="mt-0.5 text-sm text-slate-500">
            {student.className} • {student.lastActivity}
          </div>
        </div>
        <Chip label={copy.status[student.status]} size="small" color={getStatusTone(student.status)} />
      </div>
      <div className="mt-4 rounded-lg bg-[#f8fbff] p-3">
        <div className="text-sm font-semibold text-slate-950">{student.currentAssignment}</div>
        <div className="mt-1 text-sm text-slate-500">{student.currentStage}</div>
        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </div>
        <LinearProgress variant="determinate" value={student.progressRate} sx={{ mt: 1, height: 8, borderRadius: 1 }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-950">
          {student.averageScore} {copy.scoreUnit}
        </span>
        <Button size="small" variant="outlined" onClick={onFocus}>
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
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--erg-blue)] text-base font-semibold text-white">
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
    <div className="rounded-lg bg-[#f8fbff] px-3 py-3">
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500">{body}</div>
    </div>
  );
}

