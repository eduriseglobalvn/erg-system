import { useMemo, useState } from "react";
import { Layers, Plus, Search, Users, UsersRound } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/dashboard-kit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type StudentGroup = {
  id: string;
  name: string;
  note: string;
  color: string;
  studentIds: string[];
};

const allClassesFilterValue = "all-classes";
const groupColorOptions = [
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

export function StudentGroupsPage({
  classes,
  selectedClass,
  selectedSchoolName,
  onBack,
}: {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  onBack: () => void;
}) {
  const [groups, setGroups] = useState<StudentGroup[]>([
    {
      id: "g-1",
      name: "Nhóm A (Khá)",
      note: "Nhóm học sinh làm thêm bài nâng cao sau buổi học.",
      color: groupColorOptions[0].value,
      studentIds: classroomStudents.filter((student) => student.status === "ahead").slice(0, 6).map((student) => student.id),
    },
    {
      id: "g-2",
      name: "Nhóm B (Cần hỗ trợ)",
      note: "Nhóm cần giao bài ngắn theo checkpoint và theo dõi tiến độ sát hơn.",
      color: groupColorOptions[2].value,
      studentIds: classroomStudents.filter((student) => student.status === "support").slice(0, 6).map((student) => student.id),
    },
  ]);
  const [selectedGroupId, setSelectedGroupId] = useState("g-1");
  const [newGroupName, setNewGroupName] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [classFilter, setClassFilter] = useState(selectedClass?.id ?? allClassesFilterValue);

  const currentGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const groupStudents = useMemo(
    () => classroomStudents.filter((student) => currentGroup?.studentIds.includes(student.id)),
    [currentGroup],
  );
  const selectedClassCount = useMemo(
    () => new Set(groupStudents.map((student) => student.classId)).size,
    [groupStudents],
  );
  const normalizedSearch = studentSearch.trim().toLowerCase();
  const visibleStudents = classroomStudents.filter((student) => {
    const matchesClass = classFilter === allClassesFilterValue || student.classId === classFilter;
    const matchesSearch =
      !normalizedSearch ||
      student.name.toLowerCase().includes(normalizedSearch) ||
      student.className.toLowerCase().includes(normalizedSearch) ||
      student.gradeLabel.toLowerCase().includes(normalizedSearch);

    return matchesClass && matchesSearch;
  });
  const groupSummaryByClass = classes
    .map((classroom) => ({
      classroom,
      count: groupStudents.filter((student) => student.classId === classroom.id).length,
    }))
    .filter((entry) => entry.count > 0);
  const allVisibleStudentsSelected =
    visibleStudents.length > 0 && visibleStudents.every((student) => currentGroup?.studentIds.includes(student.id));
  const someVisibleStudentsSelected =
    visibleStudents.some((student) => currentGroup?.studentIds.includes(student.id)) && !allVisibleStudentsSelected;
  const allGroupStudentsSelected = groupStudents.length > 0;

  function createGroup() {
    const name = newGroupName.trim();
    if (!name) return;

    const nextGroup = {
      id: `g-${Date.now()}`,
      name,
      note: "",
      color: groupColorOptions[groups.length % groupColorOptions.length].value,
      studentIds: [],
    };
    setGroups((current) => [...current, nextGroup]);
    setSelectedGroupId(nextGroup.id);
    setNewGroupName("");
  }

  function updateGroup(updater: (group: StudentGroup) => StudentGroup) {
    if (!currentGroup) return;
    setGroups((current) => current.map((group) => (group.id === currentGroup.id ? updater(group) : group)));
  }

  function deleteGroup() {
    if (!currentGroup || groups.length <= 1) return;

    const nextGroups = groups.filter((group) => group.id !== currentGroup.id);
    setGroups(nextGroups);
    setSelectedGroupId(nextGroups[0]?.id ?? "");
  }

  function addStudent(studentId: string) {
    updateGroup((group) =>
      group.studentIds.includes(studentId)
        ? group
        : { ...group, studentIds: [...group.studentIds, studentId] },
    );
  }

  function removeStudent(studentId: string) {
    updateGroup((group) => ({ ...group, studentIds: group.studentIds.filter((id) => id !== studentId) }));
  }

  function setStudentSelected(studentId: string, selected: boolean) {
    if (selected) {
      addStudent(studentId);
      return;
    }

    removeStudent(studentId);
  }

  function setVisibleStudentsSelected(selected: boolean) {
    const visibleStudentIds = visibleStudents.map((student) => student.id);
    updateGroup((group) => {
      if (selected) {
        return { ...group, studentIds: Array.from(new Set([...group.studentIds, ...visibleStudentIds])) };
      }

      return { ...group, studentIds: group.studentIds.filter((id) => !visibleStudentIds.includes(id)) };
    });
  }

  function clearGroupStudents() {
    updateGroup((group) => ({ ...group, studentIds: [] }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 py-4 xl:px-6">
      <div className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid items-center gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-500">
              Bài tập / <span className="text-slate-600">Quản lý nhóm học sinh</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">Quản lý nhóm học sinh</h1>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-600">
              Tạo nhóm và bóc học sinh từ nhiều lớp khác nhau trong {selectedSchoolName}.
            </p>
          </div>
          <div className="grid min-w-[520px] grid-cols-3 gap-2 max-xl:min-w-0">
            <StudentGroupStat icon={Users} label="Số nhóm" value={String(groups.length)} />
            <StudentGroupStat icon={UsersRound} label="Trong nhóm" value={`${groupStudents.length} học sinh`} />
            <StudentGroupStat icon={Layers} label="Nguồn lớp" value={`${selectedClassCount} lớp`} />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button variant="outline" className="h-9 rounded-lg px-3 text-[14px]" onClick={onBack}>Về danh sách bài tập</Button>
            <Button className="h-9 rounded-lg bg-[var(--erg-blue)] px-4 text-[14px] hover:bg-[var(--erg-blue-hover)]" onClick={createGroup}>Tạo nhóm</Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-3 shadow-[var(--shadow-xs)]">
          <h2 className="mb-2 text-[13px] font-bold text-slate-600">Danh sách nhóm</h2>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{
                    backgroundColor: selectedGroupId === group.id ? group.color : undefined,
                    borderLeftColor: group.color,
                  }}
                  className={cn(
                    "w-full rounded-lg border border-l-4 px-3 py-2.5 text-left text-[13px] font-bold transition",
                    selectedGroupId === group.id
                      ? "border-transparent text-white shadow-sm"
                      : "border-[#dbe4f0] bg-white text-slate-700 hover:bg-slate-50/75",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{group.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[13px] font-bold",
                        selectedGroupId === group.id ? "bg-white/20 text-white" : "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
                      )}
                    >
                      {group.studentIds.length} HS
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-[13px] font-semibold",
                      selectedGroupId === group.id ? "text-white/85" : "text-slate-500",
                    )}
                  >
                    {group.note || "Chưa có ghi chú"}
                  </span>
                </button>
              ))}
            </div>

            <div className="shrink-0 space-y-2 border-t border-[#dbe4f0] pt-2.5">
              <input
                type="text"
                placeholder="Tên nhóm mới..."
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createGroup();
                }}
                className="w-full rounded-lg border border-[#d7e0ec] bg-white px-3 py-2 text-[14px] font-semibold text-slate-900 focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              />
              <button
                type="button"
                onClick={createGroup}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--erg-blue)] py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--erg-blue-hover)]"
              >
                <Plus className="h-3.5 w-3.5" /> Tạo nhóm
              </button>
            </div>
          </div>
        </section>

        {currentGroup ? (
          <section className="grid min-h-0 gap-3 overflow-hidden 2xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
            <div className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <label className="mb-1 block text-[13px] font-semibold text-slate-600">Tên nhóm</label>
                  <input
                    type="text"
                    value={currentGroup.name}
                    onChange={(event) => updateGroup((group) => ({ ...group, name: event.target.value }))}
                    className="w-full max-w-sm border-b border-transparent pb-1 text-lg font-semibold text-slate-900 focus:border-[#cbd7e6] focus:outline-none"
                  />
                </div>
                <Button variant="outline" className="h-9 rounded-lg px-3 text-[14px]" onClick={deleteGroup} disabled={groups.length <= 1}>Xóa nhóm</Button>
              </div>

              <GroupColorPicker
                value={currentGroup.color}
                onChange={(color) => updateGroup((group) => ({ ...group, color }))}
              />

              <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">Ghi chú</label>
              <textarea
                value={currentGroup.note}
                onChange={(event) => updateGroup((group) => ({ ...group, note: event.target.value }))}
                placeholder="Mục tiêu nhóm, lịch ôn tập, ghi chú khi giao bài..."
                className="mb-3 min-h-16 resize-none rounded-lg border border-[#d7e0ec] bg-white px-3 py-2 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              />

              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Học sinh trong nhóm</h3>
                  <p className="text-[13px] font-semibold text-slate-500">Bỏ chọn checkbox để đưa học sinh ra khỏi nhóm.</p>
                </div>
                <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-[13px] font-bold text-[var(--erg-blue)]">{groupStudents.length} học sinh</span>
              </div>

              <div className="mb-3 flex max-h-16 flex-wrap gap-2 overflow-y-auto pr-1">
                {groupSummaryByClass.map(({ classroom, count }) => (
                  <span key={classroom.id} className="rounded-md border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1 text-[13px] font-bold text-slate-700">
                    {classroom.className}: {count}
                  </span>
                ))}
              </div>

              <StudentSelectionTable
                students={groupStudents}
                emptyLabel="Chưa có học sinh nào trong nhóm. Chọn học sinh từ danh sách bên cạnh."
                getChecked={() => true}
                onCheckedChange={(student, checked) => {
                  if (!checked) removeStudent(student.id);
                }}
                headerCheckbox={{
                  ariaLabel: "Bỏ chọn tất cả học sinh trong nhóm",
                  checked: allGroupStudentsSelected,
                  onCheckedChange: (checked) => {
                    if (!checked) clearGroupStudents();
                  },
                }}
                mode="members"
              />
            </div>

            <div className="flex min-h-0 flex-col rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
              <div className="shrink-0 border-b border-[#dbe4f0] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h3>
                    <p className="text-[13px] font-semibold text-slate-500">Chọn checkbox để thêm học sinh vào nhóm hiện tại.</p>
                  </div>
                  <span className="rounded-md border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1 text-[13px] font-bold text-slate-700">
                    {visibleStudents.length} học sinh
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <AppSelect
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    className="h-10 min-w-[220px] rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)]"
                  >
                    <option value={allClassesFilterValue}>Tất cả lớp</option>
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>{classroom.className}</option>
                    ))}
                  </AppSelect>
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Tìm học sinh hoặc lớp..."
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-3 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-3">
                <StudentSelectionTable
                  students={visibleStudents}
                  emptyLabel="Không tìm thấy học sinh phù hợp với bộ lọc hiện tại."
                  getChecked={(student) => currentGroup.studentIds.includes(student.id)}
                  onCheckedChange={(student, checked) => setStudentSelected(student.id, checked)}
                  headerCheckbox={{
                    ariaLabel: "Chọn tất cả học sinh đang hiển thị",
                    checked: allVisibleStudentsSelected || (someVisibleStudentsSelected && "indeterminate"),
                    onCheckedChange: (checked) => setVisibleStudentsSelected(Boolean(checked)),
                  }}
                  mode="available"
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex items-center justify-center rounded-lg border border-[#cbd7e6] bg-white p-8 text-sm font-semibold text-slate-600 shadow-[var(--shadow-xs)]">
            Vui lòng tạo hoặc chọn một nhóm.
          </section>
        )}
      </div>
    </div>
  );
}

function GroupColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
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

function StudentGroupStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
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

function StudentSelectionTable({
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
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#eef4fb]">
            <TableRow className="hover:bg-[#eef4fb]">
              <TableHead className="w-11 px-3">
                <Checkbox
                  aria-label={headerCheckbox.ariaLabel}
                  checked={headerCheckbox.checked}
                  onCheckedChange={headerCheckbox.onCheckedChange}
                />
              </TableHead>
              <TableHead className="min-w-[220px] text-[13px] font-semibold text-slate-600">Học sinh</TableHead>
              <TableHead className="min-w-[120px] text-[13px] font-semibold text-slate-600">Lớp</TableHead>
              <TableHead className="min-w-[110px] text-[13px] font-semibold text-slate-600">Khối</TableHead>
              <TableHead className="min-w-[150px] text-[13px] font-semibold text-slate-600">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => {
                const checked = getChecked(student);
                return (
                  <TableRow key={student.id} data-state={checked ? "selected" : undefined}>
                    <TableCell className="px-3">
                      <Checkbox
                        aria-label={`${checked ? "Bỏ chọn" : "Chọn"} ${student.name}`}
                        checked={checked}
                        onCheckedChange={(value) => onCheckedChange(student, Boolean(value))}
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
