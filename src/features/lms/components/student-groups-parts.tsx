import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Users } from "lucide-react";

import type { LmsStudentGroup, LmsStudentGroupInput } from "@/features/lms/api/lms-assignment-command-api";
import type { ClassroomStudent } from "@/domain/school/classroom-types";
import { cn } from "@/lib/utils";

export type StudentGroup = {
  id: string;
  name: string;
  note: string;
  color: string;
  studentIds: string[];
  serverBacked?: boolean;
};

export const groupColorOptions = [
  { label: "Xanh dương", value: "var(--erg-blue)" },
  { label: "Xanh biển", value: "#0ea5e9" },
  { label: "Chàm", value: "var(--erg-blue)" },
  { label: "Xanh lá", value: "#10b981" },
  { label: "Ngọc", value: "#14b8a6" },
  { label: "Lục", value: "#22c55e" },
  { label: "Cam", value: "#f97316" },
  { label: "Đỏ cam", value: "#ef4444" },
  { label: "Đỏ hồng", value: "#f43f5e" },
  { label: "Tím", value: "#8b5cf6" },
  { label: "Tím đậm", value: "#7c3aed" },
  { label: "Hồng", value: "#ec4899" },
  { label: "Hồng sen", value: "#d946ef" },
  { label: "Vàng", value: "#eab308" },
  { label: "Hổ phách", value: "#f59e0b" },
  { label: "Nâu", value: "#a16207" },
  { label: "Xám xanh", value: "#64748b" },
  { label: "Than", value: "#334155" },
];

/** Turns a GraphQL scope error into Vietnamese copy; returns null when there is no error. */
export function resolveStudentGroupsError(error: unknown): string | null {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  if (/class scope is not allowed/i.test(message)) {
    return "Bạn chưa được phân quyền quản lý nhóm học sinh cho lớp này. Hãy chọn lớp bạn phụ trách hoặc liên hệ quản trị viên.";
  }
  return "Không tải được dữ liệu nhóm học sinh. Vui lòng thử lại sau.";
}

export function GroupColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="mb-3 rounded-lg border border-[#cbd7e6] bg-[#f8fbff] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-slate-600">Màu nhóm</span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: value }} />
          Hiển thị ở danh sách nhóm
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {groupColorOptions.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={`Chọn màu ${option.label}`}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border bg-white transition",
                selected ? "border-slate-900 shadow-sm" : "border-[#cbd7e6] hover:border-slate-500",
              )}
            >
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: option.value }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function toStudentGroupPayload(group: StudentGroup, selectedClassId?: string): LmsStudentGroupInput {
  return {
    classId: selectedClassId ?? null,
    color: group.color,
    name: group.name,
    note: group.note,
    studentIds: group.studentIds,
  };
}

export function toUiStudentGroup(group: LmsStudentGroup, existing: StudentGroup | undefined, index: number): StudentGroup {
  return {
    color: group.color ?? existing?.color ?? groupColorOptions[index % groupColorOptions.length].value,
    id: group.id,
    name: group.name,
    note: group.note ?? existing?.note ?? "",
    serverBacked: true,
    studentIds: group.studentIds,
  };
}

export function notifyStudentGroupSyncError(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể đồng bộ nhóm học sinh với máy chủ.";
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function StudentGroupStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-2.5 py-1.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[var(--erg-blue)] shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold tracking-normal text-slate-600">{label}</span>
        <span className="block truncate text-sm font-semibold text-slate-950">{value}</span>
      </span>
    </div>
  );
}

export function StudentSelectionTable({
  students,
  emptyLabel,
  getChecked,
  onCheckedChange,
  headerCheckbox,
  mode,
}: {
  students: ClassroomStudent[];
  emptyLabel: string;
  getChecked: (student: ClassroomStudent) => boolean;
  onCheckedChange: (student: ClassroomStudent, checked: boolean) => void;
  headerCheckbox: {
    ariaLabel: string;
    checked: boolean | "indeterminate";
    onCheckedChange: (checked: boolean | "indeterminate") => void;
  };
  mode: "members" | "available";
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <ul className="divide-y divide-slate-200 xl:hidden">
          <li>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 bg-slate-100 px-3">
              <Checkbox
                slotProps={{ input: { "aria-label": headerCheckbox.ariaLabel } }}
                checked={headerCheckbox.checked === true}
                indeterminate={headerCheckbox.checked === "indeterminate"}
                onChange={(event) => headerCheckbox.onCheckedChange(event.target.checked)}
                size="small"
                sx={{ p: 0 }}
              />
              <span className="text-[13px] font-semibold text-slate-600">Chọn tất cả</span>
            </label>
          </li>
          {students.length > 0 ? (
            students.map((student) => {
              const checked = getChecked(student);
              return (
                <li key={student.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2">
                    <Checkbox
                      slotProps={{ input: { "aria-label": `${checked ? "Bỏ chọn" : "Chọn"} ${student.name}` } }}
                      checked={checked}
                      onChange={(event) => onCheckedChange(student, event.target.checked)}
                      size="small"
                      sx={{ p: 0 }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{student.name}</span>
                      <span className="block truncate text-[13px] font-semibold text-slate-500">{student.className} · {student.gradeLabel}</span>
                    </span>
                    <StudentStatusBadge status={student.status} selected={mode === "available" && checked} />
                  </label>
                </li>
              );
            })
          ) : (
            <li className="p-6 text-center text-sm font-semibold text-slate-600">{emptyLabel}</li>
          )}
        </ul>
        <Table size="small" className="max-xl:hidden">
          <TableHead className="sticky top-0 z-10 bg-[#eef4fb]">
            <TableRow className="hover:bg-[#eef4fb]">
              <TableCell className="w-11 px-3">
                <Checkbox
                  slotProps={{ input: { "aria-label": headerCheckbox.ariaLabel } }}
                  checked={headerCheckbox.checked === true}
                  indeterminate={headerCheckbox.checked === "indeterminate"}
                  onChange={(event) => headerCheckbox.onCheckedChange(event.target.checked)}
                  size="small"
                  sx={{ p: 0 }}
                />
              </TableCell>
              <TableCell className="min-w-[220px] text-[13px] font-semibold text-slate-600">Học sinh</TableCell>
              <TableCell className="min-w-[120px] text-[13px] font-semibold text-slate-600">Lớp</TableCell>
              <TableCell className="min-w-[110px] text-[13px] font-semibold text-slate-600">Khối</TableCell>
              <TableCell className="min-w-[150px] text-[13px] font-semibold text-slate-600">Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => {
                const checked = getChecked(student);
                return (
                  <TableRow key={student.id} data-state={checked ? "selected" : undefined}>
                    <TableCell className="px-3">
                      <Checkbox
                        slotProps={{ input: { "aria-label": `${checked ? "Bỏ chọn" : "Chọn"} ${student.name}` } }}
                        checked={checked}
                        onChange={(event) => onCheckedChange(student, event.target.checked)}
                        size="small"
                        sx={{ p: 0 }}
                      />
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="max-w-[260px]">
                        <div className="truncate text-sm font-semibold text-slate-800">{student.name}</div>
                        <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-500">{student.currentStage}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px] text-[13px] font-medium text-slate-700">{student.className}</TableCell>
                    <TableCell className="min-w-[110px] text-[13px] font-medium text-slate-700">{student.gradeLabel}</TableCell>
                    <TableCell className="min-w-[150px]">
                      <StudentStatusBadge status={student.status} selected={mode === "available" && checked} />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-sm font-semibold text-slate-600">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t border-[#dbe4f0] px-3 py-2 text-[13px] font-semibold text-slate-600">
        {students.length} học sinh{mode === "available" ? " trong danh sách" : " trong nhóm"}
      </div>
    </div>
  );
}

function StudentStatusBadge({ status, selected }: { status: ClassroomStudent["status"]; selected: boolean }) {
  const statusCopy = {
    ahead: "Vượt tiến độ",
    steady: "Ổn định",
    support: "Cần hỗ trợ",
  } satisfies Record<ClassroomStudent["status"], string>;

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-[13px] font-bold",
        selected
          ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"
          : status === "support"
            ? "bg-amber-50 text-amber-600"
            : status === "ahead"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
      )}
    >
      {selected ? "Đã chọn" : statusCopy[status]}
    </span>
  );
}
