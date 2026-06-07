import { useEffect, useState } from "react";
import { Calendar, Check, ChevronDown, RefreshCw, Search } from "lucide-react";

import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { AssignHomeworkFooter } from "@/features/lms/components/assign-homework-footer";
import { allGroupSourcesFilterValue, assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import { mockAssignmentResources } from "@/features/lms/components/assign-homework-resources";
import { getClassStudents, getMockBirthDate, getMockStudentLevel, StudentLevelBadge } from "@/features/lms/components/assign-homework-student-utils";

import { classroomStudents, defaultClassId } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";


interface AssignHomeworkPageProps {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  onBack: () => void;
  onCreateAssignment: (title: string, subject: string) => void;
}

export function AssignHomeworkPage({ classes, selectedClass, onBack, onCreateAssignment }: AssignHomeworkPageProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("a");
  const subject = "Tiếng Anh";
  const [startDate, setStartDate] = useState("03/06/2026 14:40:35");
  const [endDate, setEndDate] = useState("10/06/2026 14:40:35");
  const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(null);
  const [targetType, setTargetType] = useState<"grade" | "class" | "group">("class");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(45);
  const [assignmentClassId, setAssignmentClassId] = useState(selectedClass?.id ?? defaultClassId);
  const gradeOptions = Array.from(new Set(classes.map((classroom) => classroom.gradeLabel))).filter(Boolean);
  const [selectedGradeLabel, setSelectedGradeLabel] = useState(selectedClass?.gradeLabel ?? gradeOptions[0] ?? "");
  const [selectedGradeClassIds, setSelectedGradeClassIds] = useState<Set<string>>(new Set());
  const [previewGradeClassId, setPreviewGradeClassId] = useState<string | null>(null);
  const [gradeStudentSearch, setGradeStudentSearch] = useState("");
  const [selectedGradeStudentIdsByClass, setSelectedGradeStudentIdsByClass] = useState<Record<string, string[]>>({});
  const groupSourceOptions = Array.from(new Set(assignmentGroups.map((group) => group.source)));
  const [selectedGroupSource, setSelectedGroupSource] = useState(allGroupSourcesFilterValue);
  const [selectedAssignmentGroupIds, setSelectedAssignmentGroupIds] = useState<Set<string>>(new Set());
  const [previewAssignmentGroupId, setPreviewAssignmentGroupId] = useState<string | null>(null);
  const [groupStudentSearch, setGroupStudentSearch] = useState("");
  const [selectedGroupStudentIdsByGroup, setSelectedGroupStudentIdsByGroup] = useState<Record<string, string[]>>({});
  
  const assignmentClass = classes.find((classroom) => classroom.id === assignmentClassId) ?? selectedClass ?? classes[0];
  const students = getClassStudents(assignmentClass?.id);
  const gradeClasses = classes.filter((classroom) => classroom.gradeLabel === selectedGradeLabel);
  const previewGradeClass = gradeClasses.find((classroom) => classroom.id === previewGradeClassId) ?? null;
  const previewGradeClassStudents = getClassStudents(previewGradeClass?.id);
  const selectedPopupStudentIds = new Set(previewGradeClassId ? selectedGradeStudentIdsByClass[previewGradeClassId] ?? [] : []);
  const filteredPreviewGradeClassStudents = previewGradeClassStudents.filter((student) =>
    student.name.toLowerCase().includes(gradeStudentSearch.trim().toLowerCase()),
  );
  const allGradeClassesSelected = gradeClasses.length > 0 && gradeClasses.every((classroom) => selectedGradeClassIds.has(classroom.id));
  const allPreviewStudentsSelected =
    filteredPreviewGradeClassStudents.length > 0 &&
    filteredPreviewGradeClassStudents.every((student) => selectedPopupStudentIds.has(student.id));
  const filteredAssignmentGroups = assignmentGroups.filter(
    (group) => selectedGroupSource === allGroupSourcesFilterValue || group.source === selectedGroupSource,
  );
  const previewAssignmentGroup = assignmentGroups.find((group) => group.id === previewAssignmentGroupId) ?? null;
  const previewAssignmentGroupStudents = classroomStudents.filter((student) => previewAssignmentGroup?.studentIds.includes(student.id));
  const selectedGroupPopupStudentIds = new Set(previewAssignmentGroupId ? selectedGroupStudentIdsByGroup[previewAssignmentGroupId] ?? [] : []);
  const filteredPreviewAssignmentGroupStudents = previewAssignmentGroupStudents.filter((student) =>
    student.name.toLowerCase().includes(groupStudentSearch.trim().toLowerCase()),
  );
  const allAssignmentGroupsSelected =
    filteredAssignmentGroups.length > 0 && filteredAssignmentGroups.every((group) => selectedAssignmentGroupIds.has(group.id));
  const filteredSelectedAssignmentGroupCount = filteredAssignmentGroups.filter((group) => selectedAssignmentGroupIds.has(group.id)).length;
  const allGroupPopupStudentsSelected =
    filteredPreviewAssignmentGroupStudents.length > 0 &&
    filteredPreviewAssignmentGroupStudents.every((student) => selectedGroupPopupStudentIds.has(student.id));
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedResourceId, setSelectedResourceId] = useState<string>("res-1");
  const [resourceSearch, setResourceSearch] = useState("");

  useEffect(() => {
    if (students.length) {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  }, [students.length]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id));
  
  const toggleSelectAll = () => {
    const next = new Set(selectedStudentIds);
    if (allSelected) {
      filteredStudents.forEach(s => next.delete(s.id));
    } else {
      filteredStudents.forEach(s => next.add(s.id));
    }
    setSelectedStudentIds(next);
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const toggleGradeClass = (classId: string) => {
    const next = new Set(selectedGradeClassIds);
    if (next.has(classId)) {
      next.delete(classId);
    } else {
      next.add(classId);
    }
    setSelectedGradeClassIds(next);
  };

  const toggleAllGradeClasses = () => {
    setSelectedGradeClassIds(allGradeClassesSelected ? new Set() : new Set(gradeClasses.map((classroom) => classroom.id)));
  };

  const openGradeClassPreview = (classId: string) => {
    const classStudents = getClassStudents(classId);
    setPreviewGradeClassId(classId);
    setGradeStudentSearch("");
    setSelectedGradeStudentIdsByClass((current) => ({
      ...current,
      [classId]: current[classId] ?? classStudents.map((student) => student.id),
    }));
  };

  const togglePreviewStudent = (studentId: string) => {
    if (!previewGradeClassId) return;
    const next = new Set(selectedPopupStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedGradeStudentIdsByClass((current) => ({ ...current, [previewGradeClassId]: Array.from(next) }));
  };

  const toggleAllPreviewStudents = () => {
    if (!previewGradeClassId) return;
    const next = new Set(selectedPopupStudentIds);
    if (allPreviewStudentsSelected) {
      filteredPreviewGradeClassStudents.forEach((student) => next.delete(student.id));
    } else {
      filteredPreviewGradeClassStudents.forEach((student) => next.add(student.id));
    }
    setSelectedGradeStudentIdsByClass((current) => ({ ...current, [previewGradeClassId]: Array.from(next) }));
  };

  const resetPreviewStudents = () => {
    if (!previewGradeClassId) return;
    setGradeStudentSearch("");
    setSelectedGradeStudentIdsByClass((current) => ({
      ...current,
      [previewGradeClassId]: previewGradeClassStudents.map((student) => student.id),
    }));
  };

  const toggleAssignmentGroup = (groupId: string) => {
    const next = new Set(selectedAssignmentGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedAssignmentGroupIds(next);
  };

  const toggleAllAssignmentGroups = () => {
    setSelectedAssignmentGroupIds((current) => {
      const next = new Set(current);
      if (allAssignmentGroupsSelected) {
        filteredAssignmentGroups.forEach((group) => next.delete(group.id));
      } else {
        filteredAssignmentGroups.forEach((group) => next.add(group.id));
      }
      return next;
    });
  };

  const openAssignmentGroupPreview = (groupId: string) => {
    const group = assignmentGroups.find((item) => item.id === groupId);
    setPreviewAssignmentGroupId(groupId);
    setGroupStudentSearch("");
    setSelectedGroupStudentIdsByGroup((current) => ({
      ...current,
      [groupId]: current[groupId] ?? group?.studentIds ?? [],
    }));
  };

  const toggleGroupPreviewStudent = (studentId: string) => {
    if (!previewAssignmentGroupId) return;
    const next = new Set(selectedGroupPopupStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedGroupStudentIdsByGroup((current) => ({ ...current, [previewAssignmentGroupId]: Array.from(next) }));
  };

  const toggleAllGroupPreviewStudents = () => {
    if (!previewAssignmentGroupId) return;
    const next = new Set(selectedGroupPopupStudentIds);
    if (allGroupPopupStudentsSelected) {
      filteredPreviewAssignmentGroupStudents.forEach((student) => next.delete(student.id));
    } else {
      filteredPreviewAssignmentGroupStudents.forEach((student) => next.add(student.id));
    }
    setSelectedGroupStudentIdsByGroup((current) => ({ ...current, [previewAssignmentGroupId]: Array.from(next) }));
  };

  const resetGroupPreviewStudents = () => {
    if (!previewAssignmentGroupId) return;
    setGroupStudentSearch("");
    setSelectedGroupStudentIdsByGroup((current) => ({
      ...current,
      [previewAssignmentGroupId]: previewAssignmentGroup?.studentIds ?? [],
    }));
  };

  const handleNext = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tên bài tập");
      return;
    }
    setStep(2);
  };

  const handleFinish = () => {
    onCreateAssignment(title, subject);
  };

  const filteredResources = mockAssignmentResources.filter((r) =>
    r.name.toLowerCase().includes(resourceSearch.trim().toLowerCase()) ||
    r.category.toLowerCase().includes(resourceSearch.trim().toLowerCase()) ||
    r.subject.toLowerCase().includes(resourceSearch.trim().toLowerCase())
  );
  const resourcesByCategory = Array.from(new Set(filteredResources.map((resource) => resource.category))).map((category) => ({
    category,
    resources: filteredResources.filter((resource) => resource.category === category),
  }));

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] overflow-hidden text-slate-900">

      {/* Main workspace body - flex flex-col to enable layout flexing */}
      <div className="flex-1 flex flex-col min-h-0">
        {step === 1 ? (
          <div className="w-full h-full px-8 py-6 space-y-4 flex flex-col min-h-0">

            {/* Card: Assignment setup */}
            <section className="shrink-0 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/20">
              <div className="mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Thiết lập giao bài</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Chọn đối tượng, đặt tên bài và thời gian làm bài trong một hàng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(260px,1fr)_150px_170px_220px_220px]">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Đối tượng giao bài</span>
                  <div className="relative">
                    <AppSelect
                      value={targetType}
                      onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
                      className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    >
                      <option value="grade">Giao theo khối</option>
                      <option value="class">Giao theo lớp</option>
                      <option value="group">Giao theo nhóm học tập</option>
                    </AppSelect>
                    <div className="pointer-events-none absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Tên bài tập <span className="text-rose-400">*</span></span>
                  <input
                    type="text"
                    placeholder="Nhập tên bài tập..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Số lần làm</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={attemptLimit}
                      onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">lần</span>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Thời gian tối đa</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={maxDurationMinutes}
                      onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm font-medium text-slate-800 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">phút</span>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Ngày bắt đầu</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={startDate}
                      readOnly
                      onClick={() => setOpenDatePicker("start")}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <button
                      type="button"
                      onClick={() => setOpenDatePicker(openDatePicker === "start" ? null : "start")}
                      className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-300 transition hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]"
                      aria-label="Chọn ngày bắt đầu"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <DateTimePickerPopover
                      open={openDatePicker === "start"}
                      value={startDate}
                      onChange={setStartDate}
                      onClose={() => setOpenDatePicker(null)}
                    />
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Ngày kết thúc</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={endDate}
                      readOnly
                      onClick={() => setOpenDatePicker("end")}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <button
                      type="button"
                      onClick={() => setOpenDatePicker(openDatePicker === "end" ? null : "end")}
                      className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-300 transition hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]"
                      aria-label="Chọn ngày kết thúc"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <DateTimePickerPopover
                      open={openDatePicker === "end"}
                      value={endDate}
                      onChange={setEndDate}
                      onClose={() => setOpenDatePicker(null)}
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* Card: Student list, group picker, or grade selector */}
            {targetType === "class" ? (
              <section className="bg-white rounded-lg border border-slate-200 shadow-sm shadow-slate-200/20 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[11px] font-semibold tracking-normal text-slate-400">Chọn lớp giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={assignmentClass?.id ?? ""}
                          onChange={(event) => {
                            setAssignmentClassId(event.target.value);
                            setSelectedStudentIds(new Set(getClassStudents(event.target.value).map((student) => student.id)));
                            setSearchQuery("");
                          }}
                          className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          {classes.map((classroom) => (
                            <option key={classroom.id} value={classroom.id}>
                              {classroom.className}
                            </option>
                          ))}
                        </AppSelect>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[11px] font-semibold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {selectedStudentIds.size}/{students.length} học sinh
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none" />
                      <input type="text" placeholder="Tìm học sinh..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[var(--erg-blue)] transition" />
                    </div>
                    <button type="button"
                      onClick={() => { setSearchQuery(""); setSelectedStudentIds(new Set(students.map((s) => s.id))); }}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition">
                      <RefreshCw className="h-3 w-3" /> Đặt lại
                    </button>
                  </div>
                </div>
                <StudentSelectionTable
                  allSelected={allSelected}
                  onToggleAll={toggleSelectAll}
                  onToggleStudent={toggleStudent}
                  selectedIds={selectedStudentIds}
                  students={filteredStudents}
                />
              </section>
            ) : targetType === "group" ? (
              <section className="relative bg-white rounded-lg border border-slate-200 shadow-sm shadow-slate-200/20 overflow-visible flex flex-col flex-1 min-h-0">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[11px] font-semibold tracking-normal text-slate-400">Lọc nhóm giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={selectedGroupSource}
                          onChange={(event) => setSelectedGroupSource(event.target.value)}
                          className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          <option value={allGroupSourcesFilterValue}>Tất cả nhóm</option>
                          {groupSourceOptions.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </AppSelect>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[11px] font-semibold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {filteredSelectedAssignmentGroupCount}/{filteredAssignmentGroups.length} nhóm
                      </div>
                    </div>
                  </div>
                  <p className="max-w-md text-xs font-semibold text-slate-400">
                    Chọn các nhóm cần giao bài. Click vào tên nhóm để xem và tinh chỉnh danh sách học sinh trong nhóm đó.
                  </p>
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-slate-100">
                        <th className="py-3 px-5 w-12">
                          <button type="button" onClick={toggleAllAssignmentGroups} className={cn(
                            "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded border-2 transition",
                            allAssignmentGroupsSelected ? "bg-[var(--erg-blue)] border-[var(--erg-blue)] text-white" : "border-slate-300 bg-white"
                          )}>
                            {allAssignmentGroupsSelected && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                          </button>
                        </th>
                        <th className="py-3 px-4 w-14 text-center text-[11px] font-semibold text-slate-500 tracking-normal">STT</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal">Nhóm học sinh</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-48">Phân loại</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Sỉ số</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Đã chọn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredAssignmentGroups.map((group, index) => {
                        const isChecked = selectedAssignmentGroupIds.has(group.id);
                        const selectedStudentCount = selectedGroupStudentIdsByGroup[group.id]?.length ?? group.studentIds.length;
                        return (
                          <tr
                            key={group.id}
                            style={{
                              backgroundColor: isChecked ? group.color : undefined,
                              borderLeft: `4px solid ${group.color}`,
                            }}
                            className={cn("transition-colors", isChecked ? "text-white" : "bg-white hover:bg-slate-50")}
                          >
                            <td className="py-3 px-5 text-center">
                              <button type="button" onClick={() => toggleAssignmentGroup(group.id)} style={{
                                backgroundColor: isChecked ? "rgba(255,255,255,0.2)" : undefined,
                                borderColor: isChecked ? "rgba(255,255,255,0.7)" : undefined,
                              }} className={cn(
                                "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded border-2 transition",
                                isChecked ? "text-white" : "border-slate-300 bg-white"
                              )}>
                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                              </button>
                            </td>
                            <td className={cn("py-3 px-4 text-center text-xs font-semibold", isChecked ? "text-white/80" : "text-slate-400")}>{index + 1}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => openAssignmentGroupPreview(group.id)}
                                className={cn(
                                  "inline-flex items-center gap-2 font-semibold hover:underline",
                                  isChecked ? "text-white hover:text-white" : "text-[var(--erg-blue)] hover:text-[var(--erg-blue)]",
                                )}
                              >
                                {group.name}
                              </button>
                            </td>
                            <td className={cn("py-3 px-4 text-xs font-semibold", isChecked ? "text-white/80" : "text-slate-500")}>{group.source}</td>
                            <td className={cn("py-3 px-4 text-xs font-medium", isChecked ? "text-white" : "text-slate-700")}>{group.studentIds.length} học sinh</td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold",
                                isChecked ? "bg-white/20 text-white" : "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
                              )}>
                                {selectedStudentCount}/{group.studentIds.length} HS
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {previewAssignmentGroup ? (
                    <div
                      className="fixed left-1/2 top-1/2 z-50 flex h-[680px] w-[min(1120px,calc(100vw-160px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-400/50"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="lms-modal-header border-b border-slate-100 px-5 py-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">{previewAssignmentGroup.name}</h4>
                            <p className="text-xs font-semibold text-slate-400">
                              {selectedGroupPopupStudentIds.size}/{previewAssignmentGroupStudents.length} học sinh đang chọn
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={toggleAllGroupPreviewStudents}
                              className="h-8 px-3 rounded-lg bg-[var(--erg-blue)] text-xs font-medium text-white hover:bg-[#028cc9] transition">
                              {allGroupPopupStudentsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                            <button type="button"
                              onClick={resetGroupPreviewStudents}
                              className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition">
                              <RefreshCw className="h-3 w-3" /> Đặt lại
                            </button>
                            <button type="button"
                              onClick={() => setPreviewAssignmentGroupId(null)}
                              className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition">
                              Đóng
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Tìm học sinh trong nhóm..."
                            value={groupStudentSearch}
                            onChange={(event) => setGroupStudentSearch(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--erg-blue)]"
                          />
                        </div>
                      </div>
                      <StudentSelectionTable
                        allSelected={allGroupPopupStudentsSelected}
                        className="border-t border-slate-100"
                        onToggleAll={toggleAllGroupPreviewStudents}
                        onToggleStudent={toggleGroupPreviewStudent}
                        selectedIds={selectedGroupPopupStudentIds}
                        students={filteredPreviewAssignmentGroupStudents}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <section className="relative bg-white rounded-lg border border-slate-200 shadow-sm shadow-slate-200/20 overflow-visible flex flex-col flex-1 min-h-0">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[11px] font-semibold tracking-normal text-slate-400">Chọn khối giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={selectedGradeLabel}
                          onChange={(event) => {
                            setSelectedGradeLabel(event.target.value);
                            setSelectedGradeClassIds(new Set());
                            setPreviewGradeClassId(null);
                          }}
                          className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b8d6fa] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </AppSelect>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[11px] font-semibold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {selectedGradeClassIds.size}/{gradeClasses.length} lớp
                      </div>
                    </div>
                  </div>
                  <p className="max-w-md text-xs font-semibold text-slate-400">
                    Chọn các lớp cần giao trong khối. Click vào tên lớp để xem và tinh chỉnh danh sách học sinh của lớp đó.
                  </p>
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-slate-100">
                        <th className="py-3 px-5 w-12">
                          <button type="button" onClick={toggleAllGradeClasses} className={cn(
                            "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded border-2 transition",
                            allGradeClassesSelected ? "bg-[var(--erg-blue)] border-[var(--erg-blue)] text-white" : "border-slate-300 bg-white"
                          )}>
                            {allGradeClassesSelected && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                          </button>
                        </th>
                        <th className="py-3 px-4 w-14 text-center text-[11px] font-semibold text-slate-500 tracking-normal">STT</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal">Lớp</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-48">Trường</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Sỉ số</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Đã chọn</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-36">Bài đang mở</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {gradeClasses.map((classroom, index) => {
                        const isChecked = selectedGradeClassIds.has(classroom.id);
                        const classStudents = getClassStudents(classroom.id);
                        const selectedStudentCount = selectedGradeStudentIdsByClass[classroom.id]?.length ?? classStudents.length;
                        return (
                          <tr
                            key={classroom.id}
                            className={cn(
                              "transition-colors",
                              isChecked ? "bg-[var(--erg-blue-light)] hover:bg-[var(--erg-blue-light)]" : "bg-white hover:bg-slate-50",
                            )}
                          >
                            <td className="py-3 px-5 text-center">
                              <button type="button" onClick={() => toggleGradeClass(classroom.id)} className={cn(
                                "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded border-2 transition",
                                isChecked ? "bg-[var(--erg-blue)] border-[var(--erg-blue)] text-white" : "border-slate-300 bg-white"
                              )}>
                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-slate-400 font-semibold">{index + 1}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openGradeClassPreview(classroom.id);
                                }}
                                className="font-medium text-[var(--erg-blue)] hover:text-[var(--erg-blue)] hover:underline"
                              >
                                {classroom.className}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-500">{classroom.schoolName}</td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-700">{classroom.studentCount} học sinh</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex rounded-md bg-[var(--erg-blue-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--erg-blue)]">
                                {selectedStudentCount}/{classStudents.length} HS
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-700">{classroom.activeAssignments} bài</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {previewGradeClass ? (
                    <div
                      className="fixed left-1/2 top-1/2 z-50 flex h-[680px] w-[min(1120px,calc(100vw-160px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-400/50"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="lms-modal-header border-b border-slate-100 px-5 py-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">{previewGradeClass.className}</h4>
                            <p className="text-xs font-semibold text-slate-400">
                              {selectedPopupStudentIds.size}/{previewGradeClassStudents.length} học sinh đang chọn
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={resetPreviewStudents}
                              className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition">
                              <RefreshCw className="h-3 w-3" /> Đặt lại
                            </button>
                            <button type="button"
                              onClick={() => setPreviewGradeClassId(null)}
                              className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition">
                              Đóng
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Tìm học sinh trong lớp..."
                            value={gradeStudentSearch}
                            onChange={(event) => setGradeStudentSearch(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[var(--erg-blue)]"
                          />
                        </div>
                      </div>
                      <StudentSelectionTable
                        allSelected={allPreviewStudentsSelected}
                        className="border-t border-slate-100"
                        onToggleAll={toggleAllPreviewStudents}
                        onToggleStudent={togglePreviewStudent}
                        selectedIds={selectedPopupStudentIds}
                        students={filteredPreviewGradeClassStudents}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="w-full h-full px-8 py-6 flex flex-col min-h-0">
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm shadow-slate-200/20 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="shrink-0 lms-modal-header border-b border-slate-100 px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Chọn tài nguyên bài tập</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Chọn đề hoặc bộ câu hỏi từ thư viện hệ thống. Danh sách được chia theo danh mục để dễ tìm.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-xs font-medium text-[var(--erg-blue)]">{attemptLimit} lần làm</span>
                    <span className="rounded-md border border-[#b8d6fa] bg-white px-3 py-1 text-xs font-medium text-[var(--erg-blue)]">{maxDurationMinutes} phút tối đa</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                    <input type="text" placeholder="Tìm theo tên, danh mục hoặc môn học..." value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-slate-700 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]" />
                  </div>
                  <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                    {filteredResources.length} tài nguyên phù hợp
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-4">
                {resourcesByCategory.map(({ category, resources }) => (
                  <div key={category} className="mb-4 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm last:mb-0">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#f8fbff] px-5 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">{resources.length} tài nguyên trong danh mục</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                        Category
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-[980px] w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-100">
                            <th className="py-3 px-5 w-12" />
                            <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal">Tên tài nguyên</th>
                            <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Khối lớp</th>
                            <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Môn học</th>
                            <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-32">Số lần làm</th>
                            <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 tracking-normal w-40">Thời gian tối đa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {resources.map((res) => (
                            <tr key={res.id} onClick={() => setSelectedResourceId(res.id)}
                              className={cn("cursor-pointer transition-colors",
                                selectedResourceId === res.id ? "bg-[var(--erg-blue-light)] hover:bg-[var(--erg-blue-light)]" : "bg-white hover:bg-slate-50")}>
                              <td className="py-4 px-5">
                                <div className={cn(
                                  "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded-full border-2 transition",
                                  selectedResourceId === res.id ? "border-[var(--erg-blue)]" : "border-slate-300"
                                )}>
                                  {selectedResourceId === res.id && <div className="h-[8px] w-[8px] rounded-full bg-[var(--erg-blue)]" />}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-medium text-[var(--erg-blue)]">{res.name}</td>
                              <td className="py-4 px-4 text-xs font-semibold text-slate-500">{res.grade}</td>
                              <td className="py-4 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">{res.subject}</span>
                              </td>
                              <td className="py-4 px-4 text-xs font-medium text-slate-700">{res.attemptLimit} lần</td>
                              <td className="py-4 px-4 text-xs font-medium text-slate-700">{res.maxDurationMinutes} phút</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {resourcesByCategory.length === 0 ? (
                  <div className="flex h-full min-h-60 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-center text-sm font-semibold text-slate-400">
                    Không tìm thấy tài nguyên phù hợp với từ khóa hiện tại.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>

      <AssignHomeworkFooter
        step={step}
        onBack={onBack}
        onPreviousStep={() => setStep(1)}
        onNext={step === 1 ? handleNext : handleFinish}
      />
    </div>
  );
}

function AssignmentCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={cn(
        "mx-auto flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition",
        checked ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white" : "border-slate-300 bg-white text-transparent",
      )}
    >
      {checked ? <Check className="h-2.5 w-2.5 stroke-[3.5]" /> : null}
    </button>
  );
}

function StudentProgressCell({ value }: { value: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-md bg-slate-100">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function StudentSelectionTable({
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
      <table className="min-w-[1160px] w-full border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-semibold tracking-normal text-slate-500">
            <th className="sticky left-0 top-0 z-40 w-12 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center">
              <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh" />
            </th>
            <th className="sticky left-12 top-0 z-40 w-14 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center">STT</th>
            <th className="sticky left-[104px] top-0 z-40 w-52 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Học sinh</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Ngày sinh</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Lớp</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Xếp loại</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Bài hiện tại</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Tiến độ</th>
            <th className="top-0 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">Hoạt động gần nhất</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const isChecked = selectedIds.has(student.id);
            const level = getMockStudentLevel(student.status);
            return (
              <tr key={student.id} className={cn("group transition-colors", isChecked ? "bg-[var(--erg-blue-light)]" : "bg-white hover:bg-slate-50")}>
                <td className="sticky left-0 z-20 border-b border-r border-slate-100 bg-inherit px-3 py-2 text-center">
                  <AssignmentCheckbox checked={isChecked} onChange={() => onToggleStudent(student.id)} label={`Chọn ${student.name}`} />
                </td>
                <td className="sticky left-12 z-20 border-b border-r border-slate-100 bg-inherit px-3 py-2 text-center text-xs font-semibold text-slate-500">
                  {index + 1}
                </td>
                <td className="sticky left-[104px] z-20 border-b border-r border-slate-100 bg-inherit px-3 py-2 font-medium text-[var(--erg-blue)]">
                  {student.name}
                </td>
                <td className="border-b border-r border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{getMockBirthDate(index)}</td>
                <td className="border-b border-r border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{student.className}</td>
                <td className="border-b border-r border-slate-100 px-3 py-2">
                  <StudentLevelBadge level={level} />
                </td>
                <td className="border-b border-r border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{student.currentAssignment}</td>
                <td className="border-b border-r border-slate-100 px-3 py-2">
                  <StudentProgressCell value={student.progressRate} />
                </td>
                <td className="border-b border-r border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">{student.lastActivity}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
