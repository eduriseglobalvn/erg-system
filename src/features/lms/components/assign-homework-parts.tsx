import LmsCheckbox from "@mui/material/Checkbox";

import {
  getMockBirthDate,
  getMockStudentLevel,
  StudentLevelBadge,
  type AssignHomeworkGroupOption,
} from "@/features/lms/components/assign-homework-student-utils";
import type { AssignmentCatalogItem } from "@/features/lms/classroom/components/class-students-workspace.types";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";

export type AssignmentGroupItem = AssignHomeworkGroupOption;

export function AssignmentCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <span
      className="mx-auto inline-flex items-center justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      <LmsCheckbox
        checked={checked}
        onChange={() => onChange()}
        size="small"
        slotProps={{ input: { "aria-label": label } }}
        sx={{ p: 0, color: "#696CFF", "&.Mui-checked": { color: "#696CFF" }, "&.MuiCheckbox-indeterminate": { color: "#696CFF" } }}
      />
    </span>
  );
}

function StudentProgressCell({ value }: { value: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-700">
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-md bg-[#EEF2F7]">
        <div className="h-full rounded-full bg-[#696CFF]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export function StudentSelectionTable({
  allSelected,
  className,
  onToggleAll,
  onToggleStudent,
  selectedIds,
  students,
}: {
  allSelected: boolean;
  className?: string;
  onToggleAll: () => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: Set<string>;
  students: ClassroomStudent[];
}) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-auto", className)}>
      <table className="erg-data-table min-w-[1160px] w-full border-separate border-spacing-0 text-[14px]">
        <thead>
          <tr className="bg-[#F4F6F8] text-[13px] font-bold tracking-normal text-[#344054]">
            <th className="sticky left-0 top-0 z-40 w-12 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-center">
              <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh" />
            </th>
            <th className="sticky left-12 top-0 z-40 w-14 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-center">STT</th>
            <th className="sticky left-[104px] top-0 z-40 w-52 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Học sinh</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Ngày sinh</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Lớp</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Xếp loại</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Bài hiện tại</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Tiến độ</th>
            <th className="sticky top-0 z-30 border-b border-r border-[#D9E2EF] bg-[#F4F6F8] px-3 py-3 text-left">Hoạt động gần nhất</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const isChecked = selectedIds.has(student.id);
            const level = getMockStudentLevel(student.status);
            return (
              <tr key={student.id} className={cn("group transition-colors", isChecked ? "bg-[var(--erg-blue-light)]" : "bg-white hover:bg-[#f8fbff]")}>
                <td className="sticky left-0 z-20 border-b border-r border-[#dbe4f0] bg-inherit px-3 py-2 text-center">
                  <AssignmentCheckbox checked={isChecked} onChange={() => onToggleStudent(student.id)} label={`Chọn ${student.name}`} />
                </td>
                <td className="sticky left-12 z-20 border-b border-r border-[#dbe4f0] bg-inherit px-3 py-2 text-center text-[13px] font-semibold text-slate-600">
                  {index + 1}
                </td>
                <td className="sticky left-[104px] z-20 border-b border-r border-[#dbe4f0] bg-inherit px-3 py-2 font-bold text-[var(--erg-blue)]">
                  {student.name}
                </td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2 text-[13px] font-semibold text-slate-700">{getMockBirthDate(index)}</td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2 text-[13px] font-semibold text-slate-700">{student.className}</td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2">
                  <StudentLevelBadge level={level} />
                </td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2 text-[13px] font-semibold text-slate-800">{student.currentAssignment}</td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2">
                  <StudentProgressCell value={student.progressRate} />
                </td>
                <td className="border-b border-r border-[#dbe4f0] px-3 py-2 text-[13px] font-semibold text-slate-600">{student.lastActivity}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MobileAssignProgress({
  selectedCount,
  step,
  targetType,
}: {
  selectedCount: number;
  step: number;
  targetType: "grade" | "class" | "group";
}) {
  const targetLabel = targetType === "grade" ? "Khối" : targetType === "group" ? "Nhóm" : "Lớp";
  const steps = [
    { id: 1, label: "Thiết lập" },
    { id: 2, label: "Học liệu" },
  ];

  return (
    <section className="shrink-0 border-b border-[#d9e2ef] bg-white px-3 py-2 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 truncate text-[13px] font-extrabold text-slate-900">
          Giao bài · {targetLabel} · {selectedCount} đã chọn
        </div>
        <span className="shrink-0 rounded-full border border-[#b8d6fa] bg-[#eef7ff] px-2.5 py-1 text-[11px] font-extrabold text-[#0f6cbd]">
          Bước {step}/2
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {steps.map((item) => (
          <div key={item.id} className="min-w-0">
            <div className={cn("h-1 rounded-full", step >= item.id ? "bg-[#0f6cbd]" : "bg-[#d9e2ef]")} />
            <div className={cn("mt-1 truncate text-[10.5px] font-bold", step === item.id ? "text-[#0f6cbd]" : "text-slate-500")}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MobileStudentSelectionList({
  allSelected,
  onToggleAll,
  onToggleStudent,
  selectedIds,
  students,
}: {
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: Set<string>;
  students: ClassroomStudent[];
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-[16px] bg-[#f5f7fb] md:hidden">
      <button
        type="button"
        className="sticky top-0 z-10 grid min-h-11 w-full grid-cols-[minmax(0,1fr)_28px] items-center gap-2 border-b border-[#d9e2ef] bg-white px-3 text-left text-[12px] font-extrabold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
        onClick={onToggleAll}
      >
        <span className="min-w-0 truncate">{allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}</span>
        <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh trong danh sách lọc" />
      </button>
      <div className="grid max-h-[330px] gap-1.5 overflow-y-auto p-2">
        {students.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#cbd7e6] bg-white px-4 py-5 text-center">
            <div className="text-[14px] font-extrabold text-slate-900">Không có học sinh</div>
            <div className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">Thử chọn lại lớp hoặc xóa bộ lọc tìm kiếm.</div>
          </div>
        ) : null}
        {students.map((student) => {
          const checked = selectedIds.has(student.id);
          return (
            <button
              key={student.id}
              type="button"
              className={cn(
                "flex min-h-[54px] items-center gap-2.5 rounded-[14px] border px-3 py-2 text-left shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition active:scale-[0.99]",
                checked ? "border-[#9cc7f5] bg-[#eef7ff]" : "border-white bg-white",
              )}
              onClick={() => onToggleStudent(student.id)}
            >
              <AssignmentCheckbox checked={checked} onChange={() => onToggleStudent(student.id)} label={`Chọn ${student.name}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-slate-950">{student.name}</div>
                <div className="mt-0.5 truncate text-[12px] font-semibold text-slate-500">{student.className}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MobileAssignmentGroupList({
  groups,
  onOpenPreview,
  onToggleGroup,
  selectedGroupIds,
  selectedStudentIdsByGroup,
}: {
  groups: AssignmentGroupItem[];
  onOpenPreview: (groupId: string) => void;
  onToggleGroup: (groupId: string) => void;
  selectedGroupIds: Set<string>;
  selectedStudentIdsByGroup: Record<string, string[]>;
}) {
  return (
    <div className="grid gap-3 bg-[#f3f6fb] p-3 md:hidden">
      {groups.map((group) => {
        const checked = selectedGroupIds.has(group.id);
        const selectedCount = selectedStudentIdsByGroup[group.id]?.length ?? group.studentIds.length;
        return (
          <article key={group.id} className={cn("rounded-[16px] border p-3 shadow-[0_10px_26px_rgba(96,165,250,0.08)]", checked ? "border-[#b8d6fa] bg-[#eff7ff]" : "border-white bg-white")}>
            <div className="flex items-start gap-3">
              <AssignmentCheckbox checked={checked} onChange={() => onToggleGroup(group.id)} label={`Chọn nhóm ${group.name}`} />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenPreview(group.id)}>
                <span className="block truncate text-[14px] font-bold text-slate-950">{group.name}</span>
                <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">
                  {group.source} · {selectedCount}/{group.studentIds.length} học sinh
                </span>
              </button>
              <button type="button" className="h-10 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[12px] font-bold text-[var(--erg-blue)] shadow-[var(--shadow-xs)]" onClick={() => onOpenPreview(group.id)}>
                Xem
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function MobileGradeClassList({
  classes,
  onOpenPreview,
  onToggleClass,
  selectedClassIds,
  studentIdsByClass,
  selectedStudentIdsByClass,
}: {
  classes: ClassroomSnapshot[];
  onOpenPreview: (classId: string) => void;
  onToggleClass: (classId: string) => void;
  selectedClassIds: Set<string>;
  studentIdsByClass: Record<string, string[]>;
  selectedStudentIdsByClass: Record<string, string[]>;
}) {
  return (
    <div className="grid gap-3 bg-[#f3f6fb] p-3 md:hidden">
      {classes.map((classroom) => {
        const checked = selectedClassIds.has(classroom.id);
        const studentIds = studentIdsByClass[classroom.id] ?? [];
        const students = studentIds;
        const selectedCount = selectedStudentIdsByClass[classroom.id]?.length ?? studentIds.length;
        return (
          <article key={classroom.id} className={cn("rounded-[16px] border p-3 shadow-[0_10px_26px_rgba(96,165,250,0.08)]", checked ? "border-[#b8d6fa] bg-[#eff7ff]" : "border-white bg-white")}>
            <div className="flex items-start gap-3">
              <AssignmentCheckbox checked={checked} onChange={() => onToggleClass(classroom.id)} label={`Chọn lớp ${classroom.className}`} />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenPreview(classroom.id)}>
                <span className="block truncate text-[14px] font-bold text-slate-950">{classroom.className}</span>
                <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">
                  {classroom.schoolName} · {selectedCount}/{students.length} học sinh
                </span>
              </button>
              <button type="button" className="h-10 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[12px] font-bold text-[var(--erg-blue)] shadow-[var(--shadow-xs)]" onClick={() => onOpenPreview(classroom.id)}>
                Xem
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function MobileAssignmentResourceList({
  onToggleResource,
  resources,
  selectedResourceIds,
}: {
  onToggleResource: (resourceId: string) => void;
  resources: AssignmentCatalogItem[];
  selectedResourceIds: Set<string>;
}) {
  return (
    <div className="grid gap-3 bg-[#f3f6fb] p-3 md:hidden">
      {resources.map((resource) => {
        const selected = selectedResourceIds.has(resource.id);
        return (
          <button
            key={resource.id}
            type="button"
            className={cn(
              "min-h-[76px] rounded-[16px] border px-3 py-3 text-left shadow-[0_10px_26px_rgba(96,165,250,0.08)] transition active:scale-[0.99]",
              selected ? "border-[#b8d6fa] bg-[#eff7ff]" : "border-white bg-white",
            )}
            onClick={() => onToggleResource(resource.id)}
          >
            <span className="flex items-start gap-2">
              <AssignmentCheckbox checked={selected} onChange={() => onToggleResource(resource.id)} label={`Chọn ${resource.title}`} />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-slate-950">{resource.title}</span>
              </span>
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5 text-[12px] font-semibold text-slate-600">
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.levelLabel}</span>
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.topicLabel}</span>
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.durationLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
