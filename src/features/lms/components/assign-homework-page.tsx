import { useState } from "react";
import { Calendar, RefreshCw, Search } from "lucide-react";

import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { AssignHomeworkFooter } from "@/features/lms/components/assign-homework-footer";
import { allGroupSourcesFilterValue, assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import { mockAssignmentResources } from "@/features/lms/components/assign-homework-resources";
import { getClassStudents, getMockBirthDate, getMockStudentLevel, StudentLevelBadge } from "@/features/lms/components/assign-homework-student-utils";

import { classroomStudents, defaultClassId } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";
import { LmsCheckbox } from "@/components/ui/lms-kit";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";


interface AssignHomeworkPageProps {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  onBack: () => void;
  onCreateAssignment: (title: string, subject: string) => void;
}

export function AssignHomeworkPage({ classes, selectedClass, onBack, onCreateAssignment }: AssignHomeworkPageProps) {
  const [step, setStep] = useState(1);
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
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
  const getStudentsForClass = (classId?: string, className?: string) => {
    const directStudents = getClassStudents(classId);
    if (directStudents.length > 0) return directStudents;

    const normalizedClassName = className?.replace(/^Lớp\s+/i, "").trim().toLowerCase();
    const matchedStudents = normalizedClassName
      ? classroomStudents.filter((student) => student.className.replace(/^Lớp\s+/i, "").trim().toLowerCase() === normalizedClassName)
      : [];

    return matchedStudents.length > 0 ? matchedStudents : getClassStudents(defaultClassId);
  };
  const students = getStudentsForClass(assignmentClass?.id, assignmentClass?.className);
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () => new Set(getStudentsForClass(selectedClass?.id ?? defaultClassId, selectedClass?.className).map((student) => student.id)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedResourceId, setSelectedResourceId] = useState<string>("res-1");
  const [resourceSearch, setResourceSearch] = useState("");
  const [mobileValidationError, setMobileValidationError] = useState("");

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
      setMobileValidationError("Vui lòng nhập tên bài tập trước khi tiếp tục.");
      return;
    }
    setMobileValidationError("");
    setStep((currentStep) => Math.min(2, currentStep + 1));
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

  if (isMobile) {
    const selectedResource = mockAssignmentResources.find((resource) => resource.id === selectedResourceId);
    const isClassMode = targetType === "class";
    const isGroupMode = targetType === "group";
    const mobileSelectedCount = isClassMode
      ? selectedStudentIds.size
      : isGroupMode
        ? filteredSelectedAssignmentGroupCount
        : selectedGradeClassIds.size;

    return (
      <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-[#f3f6fb] text-slate-900">
        <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(150px+env(safe-area-inset-bottom,0px))]">
          <MobileAssignProgress selectedCount={mobileSelectedCount} step={step} targetType={targetType} />

          <div className="grid gap-2.5 p-3">
            {step === 1 ? (
            <section className="rounded-[16px] border border-[#d9e2ef] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
              <div className="mb-3">
                <div className="text-[13px] font-extrabold text-[#0f6cbd]">Thiết lập giao bài</div>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-slate-950">Đối tượng, tên bài và thời gian</h2>
              </div>

              <div className="grid gap-2.5">
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-bold text-slate-600">Đối tượng giao bài</span>
                  <AppSelect
                    value={targetType}
                    onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
                    className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                  >
                    <option value="class">Giao theo lớp</option>
                    <option value="grade">Giao theo khối</option>
                    <option value="group">Giao theo nhóm học tập</option>
                  </AppSelect>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[12px] font-bold text-slate-600">Tên bài tập <span className="text-rose-500">*</span></span>
                  <input
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (mobileValidationError) setMobileValidationError("");
                    }}
                    className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                    placeholder="Nhập tên bài tập"
                  />
                  {mobileValidationError ? <span className="text-[12px] font-bold text-rose-600">{mobileValidationError}</span> : null}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-[12px] font-bold text-slate-600">Số lần làm</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={attemptLimit}
                        onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
                        className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 pr-12 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-500">lần</span>
                    </div>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[12px] font-bold text-slate-600">Thời gian tối đa</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={maxDurationMinutes}
                        onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
                        className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 pr-12 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-500">phút</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[12px] font-bold text-slate-600">Ngày bắt đầu</span>
                    <div className="relative">
                      <input
                        readOnly
                        value={startDate}
                        onClick={() => setOpenDatePicker("start")}
                        className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                      />
                      <button
                        type="button"
                        aria-label="Chọn ngày bắt đầu"
                        onClick={() => setOpenDatePicker(openDatePicker === "start" ? null : "start")}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[12px] text-slate-400 transition hover:bg-[#eef7ff] hover:text-[#0f6cbd]"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                    <DateTimePickerPopover open={openDatePicker === "start"} value={startDate} onChange={setStartDate} onClose={() => setOpenDatePicker(null)} />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[12px] font-bold text-slate-600">Ngày kết thúc</span>
                    <div className="relative">
                      <input
                        readOnly
                        value={endDate}
                        onClick={() => setOpenDatePicker("end")}
                        className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white px-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                      />
                      <button
                        type="button"
                        aria-label="Chọn ngày kết thúc"
                        onClick={() => setOpenDatePicker(openDatePicker === "end" ? null : "end")}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[12px] text-slate-400 transition hover:bg-[#eef7ff] hover:text-[#0f6cbd]"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                    <DateTimePickerPopover open={openDatePicker === "end"} value={endDate} onChange={setEndDate} onClose={() => setOpenDatePicker(null)} />
                  </label>
                </div>
              </div>
            </section>
            ) : null}

            {step === 1 ? (
              <section className="rounded-[16px] border border-[#d9e2ef] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
                <div className="border-b border-[#dbe4f0] px-3 py-2.5">
                  <div className="text-[13px] font-bold text-slate-500">
                    {isClassMode ? "Chọn lớp giao bài" : isGroupMode ? "Chọn nhóm giao bài" : "Chọn khối giao bài"}
                  </div>
                  <div className="mt-0.5 text-[14px] font-extrabold text-slate-950">
                    {isClassMode ? `${selectedStudentIds.size}/${students.length} học sinh` : isGroupMode ? `${filteredSelectedAssignmentGroupCount}/${filteredAssignmentGroups.length} nhóm` : `${selectedGradeClassIds.size}/${gradeClasses.length} lớp`}
                  </div>
                </div>

                {isClassMode ? (
                  <div className="grid gap-2.5 p-3">
                    <AppSelect
                      value={assignmentClass?.id ?? ""}
                      onChange={(event) => {
                        setAssignmentClassId(event.target.value);
                        const nextClass = classes.find((classroom) => classroom.id === event.target.value);
                        setSelectedStudentIds(new Set(getStudentsForClass(event.target.value, nextClass?.className).map((student) => student.id)));
                        setSearchQuery("");
                      }}
                      className="h-10 w-[122px] rounded-[13px] border border-[#cbd7e6] bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                    >
                      {classes.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>{classroom.className}</option>
                      ))}
                    </AppSelect>
                    <div className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f6cbd]" />
                        <input
                          type="text"
                          placeholder="Tìm học sinh"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          className="h-10 w-full rounded-[13px] border border-[#cbd7e6] bg-white pl-10 pr-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[#0f6cbd] focus:ring-2 focus:ring-[#0f6cbd]/15"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedStudentIds(new Set(students.map((student) => student.id)));
                        }}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-[13px] border border-[#cbd7e6] bg-white px-2.5 text-[12px] font-bold text-slate-700"
                      >
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Đặt lại
                      </button>
                    </div>
                    <MobileStudentSelectionList
                      allSelected={allSelected}
                      onToggleAll={toggleSelectAll}
                      onToggleStudent={toggleStudent}
                      selectedIds={selectedStudentIds}
                      students={filteredStudents}
                    />
                  </div>
                ) : isGroupMode ? (
                  <div className="grid gap-3 p-3">
                    <AppSelect
                      value={selectedGroupSource}
                      onChange={(event) => setSelectedGroupSource(event.target.value)}
                      className="h-11 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    >
                      <option value={allGroupSourcesFilterValue}>Tất cả nhóm</option>
                      {groupSourceOptions.map((source) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </AppSelect>
                    <MobileAssignmentGroupList
                      groups={filteredAssignmentGroups}
                      onOpenPreview={openAssignmentGroupPreview}
                      onToggleGroup={toggleAssignmentGroup}
                      selectedGroupIds={selectedAssignmentGroupIds}
                      selectedStudentIdsByGroup={selectedGroupStudentIdsByGroup}
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 p-3">
                    <AppSelect
                      value={selectedGradeLabel}
                      onChange={(event) => {
                        setSelectedGradeLabel(event.target.value);
                        setSelectedGradeClassIds(new Set());
                        setPreviewGradeClassId(null);
                      }}
                      className="h-11 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    >
                      {gradeOptions.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </AppSelect>
                    <MobileGradeClassList
                      classes={gradeClasses}
                      onOpenPreview={openGradeClassPreview}
                      onToggleClass={toggleGradeClass}
                      selectedClassIds={selectedGradeClassIds}
                      selectedStudentIdsByClass={selectedGradeStudentIdsByClass}
                    />
                  </div>
                )}
              </section>
            ) : step === 2 ? (
              <section className="rounded-[18px] border border-[#d9e2ef] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <div className="border-b border-[#dbe4f0] px-4 py-3">
                  <div className="text-[13px] font-bold text-slate-500">Tài nguyên</div>
                  <div className="mt-0.5 text-[15px] font-extrabold text-slate-950">
                    {selectedResource?.name ?? "Chọn một tài nguyên"}
                  </div>
                </div>
                <div className="grid gap-3 p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input
                      type="text"
                      placeholder="Tìm tài nguyên"
                      value={resourceSearch}
                      onChange={(event) => setResourceSearch(event.target.value)}
                      className="h-11 w-full rounded-[14px] border border-[#cbd7e6] bg-white pl-10 pr-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                  <MobileAssignmentResourceList
                    onSelectResource={setSelectedResourceId}
                    resources={filteredResources}
                    selectedResourceId={selectedResourceId}
                  />
                  <div className="rounded-[16px] border border-[#d9e2ef] bg-[#f8fbff] p-3">
                    <div className="text-[13px] font-extrabold text-slate-950">Xac nhan giao bai</div>
                    <div className="mt-2 grid gap-2 text-[12px] font-bold text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span>Ten bai</span>
                        <span className="min-w-0 truncate text-right text-slate-950">{title || "Chua nhap"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Doi tuong</span>
                        <span className="text-slate-950">{mobileSelectedCount} da chon</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Học liệu</span>
                        <span className="min-w-0 truncate text-right text-slate-950">{selectedResource?.name ?? "Chưa chọn"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Thoi gian</span>
                        <span className="text-slate-950">{maxDurationMinutes} phut</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {previewAssignmentGroup ? (
          <div className="fixed inset-0 z-[70] flex flex-col bg-[#f3f6fb] text-slate-900">
            <div className="shrink-0 border-b border-[#d9e2ef] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-slate-950">{previewAssignmentGroup.name}</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">
                    {selectedGroupPopupStudentIds.size}/{previewAssignmentGroupStudents.length} học sinh đang chọn
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAssignmentGroupId(null)}
                  className="h-10 shrink-0 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                  <input
                    type="text"
                    placeholder="Tìm học sinh"
                    value={groupStudentSearch}
                    onChange={(event) => setGroupStudentSearch(event.target.value)}
                    className="h-11 w-full rounded-[14px] border border-[#cbd7e6] bg-white pl-10 pr-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={resetGroupPreviewStudents}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Đặt lại
                </button>
              </div>
            </div>
            <MobileStudentSelectionList
              allSelected={allGroupPopupStudentsSelected}
              onToggleAll={toggleAllGroupPreviewStudents}
              onToggleStudent={toggleGroupPreviewStudent}
              selectedIds={selectedGroupPopupStudentIds}
              students={filteredPreviewAssignmentGroupStudents}
            />
          </div>
        ) : null}

        {previewGradeClass ? (
          <div className="fixed inset-0 z-[70] flex flex-col bg-[#f3f6fb] text-slate-900">
            <div className="shrink-0 border-b border-[#d9e2ef] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-slate-950">{previewGradeClass.className}</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">
                    {selectedPopupStudentIds.size}/{previewGradeClassStudents.length} học sinh đang chọn
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewGradeClassId(null)}
                  className="h-10 shrink-0 rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                  <input
                    type="text"
                    placeholder="Tìm học sinh"
                    value={gradeStudentSearch}
                    onChange={(event) => setGradeStudentSearch(event.target.value)}
                    className="h-11 w-full rounded-[14px] border border-[#cbd7e6] bg-white pl-10 pr-3 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={resetPreviewStudents}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Đặt lại
                </button>
              </div>
            </div>
            <MobileStudentSelectionList
              allSelected={allPreviewStudentsSelected}
              onToggleAll={toggleAllPreviewStudents}
              onToggleStudent={togglePreviewStudent}
              selectedIds={selectedPopupStudentIds}
              students={filteredPreviewGradeClassStudents}
            />
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom,0px)+8px)] z-50 px-3">
          <div className="rounded-[18px] border border-[#d9e2ef] bg-white p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={step === 1 ? onBack : () => setStep((currentStep) => Math.max(1, currentStep - 1))}
                className="flex h-11 flex-1 items-center justify-center rounded-[14px] border border-[#d7e0ec] bg-white text-[14px] font-bold text-slate-700"
              >
                {step === 1 ? "Hủy" : "Quay lại"}
              </button>
              <button
                type="button"
                onClick={step < 2 ? handleNext : handleFinish}
                className="flex h-11 min-w-0 flex-[1.35] items-center justify-center rounded-[14px] px-4 text-center text-[14px] font-extrabold shadow-[0_10px_20px_rgba(15,108,189,0.28)] ring-1 ring-white/30 transition active:scale-[0.99]"
                style={{ backgroundColor: "#0f6cbd", color: "#ffffff" }}
              >
                <span>{step < 2 ? "Tiếp theo" : "Giao bài"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#f3f6fb] overflow-hidden text-slate-900 md:bg-[#f8fafc]">

      {/* Main workspace body - flex flex-col to enable layout flexing */}
      <div className="flex-1 flex flex-col min-h-0">
        {isMobile ? (
          <MobileAssignProgress step={step} targetType={targetType} selectedCount={selectedStudentIds.size} />
        ) : null}
        {step === 1 ? (
          <div className="w-full h-full px-4 py-4 space-y-4 flex flex-col min-h-0 md:px-8 md:py-6">

            {/* Card: Assignment setup */}
            <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-5 py-4 shadow-[var(--shadow-xs)]">
              <div className="mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Thiết lập giao bài</h2>
                  <p className="mt-1 text-[13px] font-semibold text-slate-600">Chọn đối tượng, đặt tên bài và thời gian làm bài trong một hàng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(260px,1fr)_150px_170px_220px_220px]">
                <label className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-slate-600">Đối tượng giao bài</span>
                  <div className="relative">
                    <AppSelect
                      value={targetType}
                      onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
                      className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    >
                      <option value="grade">Giao theo khối</option>
                      <option value="class">Giao theo lớp</option>
                      <option value="group">Giao theo nhóm học tập</option>
                    </AppSelect>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-slate-600">Tên bài tập <span className="text-rose-400">*</span></span>
                  <input
                    type="text"
                    placeholder="Nhập tên bài tập..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-slate-600">Số lần làm</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={attemptLimit}
                      onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-11 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-600">lần</span>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-slate-600">Thời gian tối đa</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={maxDurationMinutes}
                      onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-12 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-600">phút</span>
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-slate-600">Ngày bắt đầu</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={startDate}
                      readOnly
                      onClick={() => setOpenDatePicker("start")}
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
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
                  <span className="text-[13px] font-semibold text-slate-600">Ngày kết thúc</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={endDate}
                      readOnly
                      onClick={() => setOpenDatePicker("end")}
                      className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
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
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[13px] font-bold tracking-normal text-slate-500">Chọn lớp giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={assignmentClass?.id ?? ""}
                          onChange={(event) => {
                            setAssignmentClassId(event.target.value);
                            setSelectedStudentIds(new Set(getClassStudents(event.target.value).map((student) => student.id)));
                            setSearchQuery("");
                          }}
                          className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          {classes.map((classroom) => (
                            <option key={classroom.id} value={classroom.id}>
                              {classroom.className}
                            </option>
                          ))}
                        </AppSelect>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {selectedStudentIds.size}/{students.length} học sinh
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                      <input type="text" placeholder="Tìm học sinh..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-52 rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]" />
                    </div>
                    <button type="button"
                      onClick={() => { setSearchQuery(""); setSelectedStudentIds(new Set(students.map((s) => s.id))); }}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                      <RefreshCw className="h-3 w-3" /> Đặt lại
                    </button>
                  </div>
                </div>
                <MobileStudentSelectionList
                  allSelected={allSelected}
                  onToggleAll={toggleSelectAll}
                  onToggleStudent={toggleStudent}
                  selectedIds={selectedStudentIds}
                  students={filteredStudents}
                />
                <StudentSelectionTable
                  allSelected={allSelected}
                  className="hidden md:flex"
                  onToggleAll={toggleSelectAll}
                  onToggleStudent={toggleStudent}
                  selectedIds={selectedStudentIds}
                  students={filteredStudents}
                />
              </section>
            ) : targetType === "group" ? (
              <section className="relative flex min-h-0 flex-1 flex-col overflow-visible rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[13px] font-bold tracking-normal text-slate-500">Lọc nhóm giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={selectedGroupSource}
                          onChange={(event) => setSelectedGroupSource(event.target.value)}
                          className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          <option value={allGroupSourcesFilterValue}>Tất cả nhóm</option>
                          {groupSourceOptions.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </AppSelect>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {filteredSelectedAssignmentGroupCount}/{filteredAssignmentGroups.length} nhóm
                      </div>
                    </div>
                  </div>
                  <p className="max-w-md text-[13px] font-semibold text-slate-500">
                    Chọn các nhóm cần giao bài. Click vào tên nhóm để xem và tinh chỉnh danh sách học sinh trong nhóm đó.
                  </p>
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto">
                  <MobileAssignmentGroupList
                    groups={filteredAssignmentGroups}
                    onOpenPreview={openAssignmentGroupPreview}
                    onToggleGroup={toggleAssignmentGroup}
                    selectedGroupIds={selectedAssignmentGroupIds}
                    selectedStudentIdsByGroup={selectedGroupStudentIdsByGroup}
                  />
                  <table className="erg-data-table hidden w-full border-collapse text-sm md:table">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#dbe4f0]">
                        <th className="py-3 px-5 w-12">
                          <AssignmentCheckbox checked={allAssignmentGroupsSelected} onChange={toggleAllAssignmentGroups} label="Chọn tất cả nhóm học sinh" />
                        </th>
                        <th className="py-3 px-4 w-14 text-center text-[13px] font-bold text-slate-600 tracking-normal">STT</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal">Nhóm học sinh</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-48">Phân loại</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Sỉ số</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Đã chọn</th>
                      </tr>
                    </thead>
                    <tbody>
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
                            className={cn("transition-colors", isChecked ? "text-white" : "bg-white hover:bg-[#f8fbff]")}
                          >
                            <td className="py-3 px-5 text-center">
                              <AssignmentCheckbox checked={isChecked} onChange={() => toggleAssignmentGroup(group.id)} label={`Chọn nhóm ${group.name}`} />
                            </td>
                            <td className={cn("py-3 px-4 text-center text-[13px] font-semibold", isChecked ? "text-white/80" : "text-slate-400")}>{index + 1}</td>
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
                            <td className={cn("py-3 px-4 text-[13px] font-semibold", isChecked ? "text-white/80" : "text-slate-500")}>{group.source}</td>
                            <td className={cn("py-3 px-4 text-[13px] font-semibold", isChecked ? "text-white" : "text-slate-700")}>{group.studentIds.length} học sinh</td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex rounded-md px-2.5 py-1 text-[13px] font-bold",
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
                      className="fixed left-1/2 top-1/2 z-50 flex h-[min(680px,calc(100vh-48px))] w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-md shadow-slate-900/10"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">{previewAssignmentGroup.name}</h4>
                            <p className="text-[13px] font-semibold text-slate-500">
                              {selectedGroupPopupStudentIds.size}/{previewAssignmentGroupStudents.length} học sinh đang chọn
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={toggleAllGroupPreviewStudents}
                              className="h-9 px-3 rounded-lg bg-[var(--erg-blue)] text-[13px] font-semibold text-white hover:bg-[#028cc9] transition">
                              {allGroupPopupStudentsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                            <button type="button"
                              onClick={resetGroupPreviewStudents}
                              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                              <RefreshCw className="h-3 w-3" /> Đặt lại
                            </button>
                            <button type="button"
                              onClick={() => setPreviewAssignmentGroupId(null)}
                              className="h-9 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                              Đóng
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                          <input
                            type="text"
                            placeholder="Tìm học sinh trong nhóm..."
                            value={groupStudentSearch}
                            onChange={(event) => setGroupStudentSearch(event.target.value)}
                            className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                          />
                        </div>
                      </div>
                      <StudentSelectionTable
                        allSelected={allGroupPopupStudentsSelected}
                        className="border-t border-[#cbd7e6]"
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
              <section className="relative flex min-h-0 flex-1 flex-col overflow-visible rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
                <div className="px-6 py-3.5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                  <div className="flex min-w-0 flex-wrap items-end gap-3">
                    <label className="grid min-w-[260px] gap-1.5">
                      <span className="text-[13px] font-bold tracking-normal text-slate-500">Chọn khối giao bài</span>
                      <div className="relative">
                        <AppSelect
                          value={selectedGradeLabel}
                          onChange={(event) => {
                            setSelectedGradeLabel(event.target.value);
                            setSelectedGradeClassIds(new Set());
                            setPreviewGradeClassId(null);
                          }}
                          className="h-9 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-9 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        >
                          {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </AppSelect>
                      </div>
                    </label>
                    <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2">
                      <div className="text-[13px] font-bold tracking-normal text-[var(--erg-blue)]">Đã chọn</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--erg-blue)]">
                        {selectedGradeClassIds.size}/{gradeClasses.length} lớp
                      </div>
                    </div>
                  </div>
                  <p className="max-w-md text-[13px] font-semibold text-slate-500">
                    Chọn các lớp cần giao trong khối. Click vào tên lớp để xem và tinh chỉnh danh sách học sinh của lớp đó.
                  </p>
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto">
                  <MobileGradeClassList
                    classes={gradeClasses}
                    onOpenPreview={openGradeClassPreview}
                    onToggleClass={toggleGradeClass}
                    selectedClassIds={selectedGradeClassIds}
                    selectedStudentIdsByClass={selectedGradeStudentIdsByClass}
                  />
                  <table className="erg-data-table hidden w-full border-collapse text-sm md:table">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#dbe4f0]">
                        <th className="py-3 px-5 w-12">
                          <AssignmentCheckbox checked={allGradeClassesSelected} onChange={toggleAllGradeClasses} label="Chọn tất cả lớp trong khối" />
                        </th>
                        <th className="py-3 px-4 w-14 text-center text-[13px] font-bold text-slate-600 tracking-normal">STT</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal">Lớp</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-48">Trường</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Sỉ số</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Đã chọn</th>
                        <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-36">Bài đang mở</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeClasses.map((classroom, index) => {
                        const isChecked = selectedGradeClassIds.has(classroom.id);
                        const classStudents = getClassStudents(classroom.id);
                        const selectedStudentCount = selectedGradeStudentIdsByClass[classroom.id]?.length ?? classStudents.length;
                        return (
                          <tr
                            key={classroom.id}
                            className={cn(
                              "transition-colors",
                              isChecked ? "bg-[var(--erg-blue-light)] hover:bg-[var(--erg-blue-light)]" : "bg-white hover:bg-[#f8fbff]",
                            )}
                          >
                            <td className="py-3 px-5 text-center">
                              <AssignmentCheckbox checked={isChecked} onChange={() => toggleGradeClass(classroom.id)} label={`Chọn lớp ${classroom.className}`} />
                            </td>
                            <td className="py-3 px-4 text-center text-[13px] text-slate-500 font-semibold">{index + 1}</td>
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
                            <td className="py-3 px-4 text-[13px] font-semibold text-slate-600">{classroom.schoolName}</td>
                            <td className="py-3 px-4 text-[13px] font-semibold text-slate-700">{classroom.studentCount} học sinh</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex rounded-md bg-[var(--erg-blue-light)] px-2.5 py-1 text-[13px] font-bold text-[var(--erg-blue)]">
                                {selectedStudentCount}/{classStudents.length} HS
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[13px] font-semibold text-slate-700">{classroom.activeAssignments} bài</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {previewGradeClass ? (
                    <div
                      className="fixed left-1/2 top-1/2 z-50 flex h-[min(680px,calc(100vh-48px))] w-[min(1120px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-md shadow-slate-900/10"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900">{previewGradeClass.className}</h4>
                            <p className="text-[13px] font-semibold text-slate-500">
                              {selectedPopupStudentIds.size}/{previewGradeClassStudents.length} học sinh đang chọn
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={resetPreviewStudents}
                              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                              <RefreshCw className="h-3 w-3" /> Đặt lại
                            </button>
                            <button type="button"
                              onClick={() => setPreviewGradeClassId(null)}
                              className="h-9 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:bg-[#f8fbff]">
                              Đóng
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--erg-blue)]" />
                          <input
                            type="text"
                            placeholder="Tìm học sinh trong lớp..."
                            value={gradeStudentSearch}
                            onChange={(event) => setGradeStudentSearch(event.target.value)}
                            className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white pl-8 pr-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                          />
                        </div>
                      </div>
                      <StudentSelectionTable
                        allSelected={allPreviewStudentsSelected}
                        className="border-t border-[#cbd7e6]"
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
          <div className="w-full h-full px-4 py-4 flex flex-col min-h-0 md:px-8 md:py-6">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
              <div className="lms-modal-header shrink-0 border-b border-[#dbe4f0] px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Chọn tài nguyên bài tập</h2>
                    <p className="mt-1 text-[13px] font-semibold text-slate-600">
                      Chọn đề hoặc bộ câu hỏi từ thư viện hệ thống. Danh sách được chia theo danh mục để dễ tìm.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{attemptLimit} lần làm</span>
                    <span className="rounded-md border border-[#b8d6fa] bg-white px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{maxDurationMinutes} phút tối đa</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                    <input type="text" placeholder="Tìm theo tên, danh mục hoặc môn học..." value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full rounded-lg border border-[#d7e0ec] bg-white py-2.5 pl-9 pr-4 text-[14px] font-semibold text-slate-900 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]" />
                  </div>
                  <span className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2 text-[13px] font-bold text-slate-700">
                    {filteredResources.length} tài nguyên phù hợp
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fbff] p-4">
                {resourcesByCategory.map(({ category, resources }) => (
                  <div key={category} className="mb-4 overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[var(--shadow-xs)] last:mb-0">
                    <div className="flex items-center justify-between gap-3 border-b border-[#dbe4f0] bg-[#f8fbff] px-5 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
                        <p className="mt-0.5 text-[13px] font-semibold text-slate-500">{resources.length} tài nguyên trong danh mục</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-bold text-slate-600 shadow-sm">
                        Category
                      </span>
                    </div>
                    <MobileAssignmentResourceList
                      onSelectResource={setSelectedResourceId}
                      resources={resources}
                      selectedResourceId={selectedResourceId}
                    />
                    <div className="hidden overflow-x-auto md:block">
                      <table className="erg-data-table min-w-[980px] w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="py-3 px-5 w-12" />
                            <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal">Tên tài nguyên</th>
                            <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Khối lớp</th>
                            <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Môn học</th>
                            <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-32">Số lần làm</th>
                            <th className="py-3 px-4 text-left text-[13px] font-bold text-slate-600 tracking-normal w-40">Thời gian tối đa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resources.map((res) => (
                            <tr key={res.id} onClick={() => setSelectedResourceId(res.id)}
                              className={cn("cursor-pointer transition-colors",
                                selectedResourceId === res.id ? "bg-[var(--erg-blue-light)] hover:bg-[var(--erg-blue-light)]" : "bg-white hover:bg-[#f8fbff]")}>
                              <td className="py-4 px-5">
                                <div className={cn(
                                  "mx-auto flex items-center justify-center h-[18px] w-[18px] rounded-full border transition",
                                  selectedResourceId === res.id ? "border-[var(--erg-blue)]" : "border-slate-300"
                                )}>
                                  {selectedResourceId === res.id && <div className="h-[8px] w-[8px] rounded-full bg-[var(--erg-blue)]" />}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-medium text-[var(--erg-blue)]">{res.name}</td>
                              <td className="py-4 px-4 text-[13px] font-semibold text-slate-600">{res.grade}</td>
                              <td className="py-4 px-4">
                                <span className="inline-flex rounded-md border border-[#dbe4f0] bg-[#f8fbff] px-2 py-0.5 text-[13px] font-bold text-slate-700">{res.subject}</span>
                              </td>
                              <td className="py-4 px-4 text-[13px] font-semibold text-slate-700">{res.attemptLimit} lần</td>
                              <td className="py-4 px-4 text-[13px] font-semibold text-slate-700">{res.maxDurationMinutes} phút</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {resourcesByCategory.length === 0 ? (
                  <div className="flex h-full min-h-60 items-center justify-center rounded-lg border border-dashed border-[#cbd7e6] bg-white text-center text-sm font-semibold text-slate-500">
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
    <span
      className="mx-auto inline-flex items-center justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      <LmsCheckbox
        aria-label={label}
        checked={checked}
        onCheckedChange={() => onChange()}
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
      <table className="erg-data-table min-w-[1160px] w-full border-separate border-spacing-0 text-[14px]">
        <thead>
          <tr className="bg-[#eef4fb] text-[13px] font-bold tracking-normal text-slate-700">
            <th className="sticky left-0 top-0 z-40 w-12 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-center">
              <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh" />
            </th>
            <th className="sticky left-12 top-0 z-40 w-14 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-center">STT</th>
            <th className="sticky left-[104px] top-0 z-40 w-52 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Học sinh</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Ngày sinh</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Lớp</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Xếp loại</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Bài hiện tại</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Tiến độ</th>
            <th className="top-0 border-b border-r border-[#cbd7e6] bg-[#eef4fb] px-3 py-3 text-left">Hoạt động gần nhất</th>
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

type AssignmentGroupItem = (typeof assignmentGroups)[number];
type AssignmentResourceItem = (typeof mockAssignmentResources)[number];

function MobileAssignProgress({
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

function MobileStudentSelectionList({
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

function MobileAssignmentGroupList({
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

function MobileGradeClassList({
  classes,
  onOpenPreview,
  onToggleClass,
  selectedClassIds,
  selectedStudentIdsByClass,
}: {
  classes: ClassroomSnapshot[];
  onOpenPreview: (classId: string) => void;
  onToggleClass: (classId: string) => void;
  selectedClassIds: Set<string>;
  selectedStudentIdsByClass: Record<string, string[]>;
}) {
  return (
    <div className="grid gap-3 bg-[#f3f6fb] p-3 md:hidden">
      {classes.map((classroom) => {
        const checked = selectedClassIds.has(classroom.id);
        const students = getClassStudents(classroom.id);
        const selectedCount = selectedStudentIdsByClass[classroom.id]?.length ?? students.length;
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

function MobileAssignmentResourceList({
  onSelectResource,
  resources,
  selectedResourceId,
}: {
  onSelectResource: (resourceId: string) => void;
  resources: AssignmentResourceItem[];
  selectedResourceId: string;
}) {
  return (
    <div className="grid gap-3 bg-[#f3f6fb] p-3 md:hidden">
      {resources.map((resource) => {
        const selected = selectedResourceId === resource.id;
        return (
          <button
            key={resource.id}
            type="button"
            className={cn(
              "min-h-[76px] rounded-[16px] border px-3 py-3 text-left shadow-[0_10px_26px_rgba(96,165,250,0.08)] transition active:scale-[0.99]",
              selected ? "border-[#b8d6fa] bg-[#eff7ff]" : "border-white bg-white",
            )}
            onClick={() => onSelectResource(resource.id)}
          >
            <span className="block truncate text-[14px] font-bold text-slate-950">{resource.name}</span>
            <span className="mt-1 flex flex-wrap gap-1.5 text-[12px] font-semibold text-slate-600">
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.grade}</span>
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.subject}</span>
              <span className="rounded-md border border-[#d9e2ef] bg-white px-2 py-0.5">{resource.maxDurationMinutes} phút</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
