import { Calendar, RefreshCw, Search } from "lucide-react";
import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { AssignHomeworkFooter } from "@/features/lms/components/assign-homework-footer";
import { assignmentSubjects } from "@/features/lms/classroom/components/class-students-workspace.constants";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import {
  AssignmentCheckbox,
  MobileAssignProgress,
  MobileAssignmentGroupList,
  MobileGradeClassList,
  MobileStudentSelectionList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

interface AssignHomeworkDesktopViewProps {
  model: AssignHomeworkController;
}

export function AssignHomeworkDesktopView({ model }: AssignHomeworkDesktopViewProps) {
  const {
    classes,
    onBack,
    step,
    setStep,
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openDatePicker,
    setOpenDatePicker,
    targetType,
    setTargetType,
    attemptLimit,
    setAttemptLimit,
    maxDurationMinutes,
    setMaxDurationMinutes,
    setAssignmentClassId,
    selectedGradeLabel,
    setSelectedGradeLabel,
    selectedGradeClassIds,
    setSelectedGradeClassIds,
    setPreviewGradeClassId,
    gradeStudentSearch,
    setGradeStudentSearch,
    selectedGradeStudentIdsByClass,
    selectedGroupSource,
    setSelectedGroupSource,
    selectedAssignmentGroupIds,
    setPreviewAssignmentGroupId,
    groupStudentSearch,
    setGroupStudentSearch,
    selectedGroupStudentIdsByGroup,
    selectedStudentIds,
    setSelectedStudentIds,
    searchQuery,
    setSearchQuery,
    setSelectedLevelId,
    selectedResourceIds,
    resourceSearch,
    setResourceSearch,
    isMobile,
    apiBacked,
    gradeOptions,
    assignmentClass,
    groupSourceOptions,
    getFallbackStudentsForClass,
    students,
    gradeClasses,
    getGradeStudentsForClassId,
    gradeStudentIdsByClass,
    previewGradeClass,
    previewGradeClassStudents,
    selectedPopupStudentIds,
    filteredPreviewGradeClassStudents,
    allGradeClassesSelected,
    allPreviewStudentsSelected,
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    allAssignmentGroupsSelected,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    filteredStudents,
    allSelected,
    toggleSelectAll,
    toggleStudent,
    toggleGradeClass,
    toggleAllGradeClasses,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
    toggleAssignmentGroup,
    toggleAllAssignmentGroups,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
    handleNext,
    selectedSubject,
    selectedLevel,
    filteredResourceTopics,
    filteredResourceCount,
    selectedResourceLabel,
    handleSubjectChange,
    toggleResourceSelection,
    handleFinish,
  } = model;
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
            <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-4 py-3 shadow-[var(--shadow-xs)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">Thiết lập giao bài</h2>
                <span className="hidden rounded-md bg-[#f8fbff] px-2.5 py-1 text-[12px] font-bold text-slate-500 xl:inline-flex">
                  {selectedStudentIds.size} học sinh đã chọn
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[210px_minmax(260px,1fr)_130px_160px_210px_210px]">
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
                            const nextClass = classes.find((classroom) => classroom.id === event.target.value);
                            setSelectedStudentIds(
                              new Set(
                                apiBacked
                                  ? []
                                  : getFallbackStudentsForClass(event.target.value, nextClass?.className).map((student) => student.id),
                              ),
                            );
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
                    studentIdsByClass={gradeStudentIdsByClass}
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
                        const classStudents = getGradeStudentsForClassId(classroom.id);
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Chọn bài tập</h2>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-500">{selectedSubject?.label ?? "Môn học"} · {selectedLevel?.label ?? "Level"} · {selectedResourceLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-[var(--erg-blue-light)] px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{attemptLimit} lần làm</span>
                    <span className="rounded-md border border-[#b8d6fa] bg-white px-3 py-1 text-[13px] font-semibold text-[var(--erg-blue)]">{maxDurationMinutes} phút tối đa</span>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden bg-[#f8fbff]">
                <aside className="min-h-0 border-r border-[#dbe4f0] bg-white p-4">
                  <div className="grid gap-3">
                    <label className="grid gap-1.5">
                      <span className="text-[12px] font-bold text-slate-600">Môn học</span>
                      <AppSelect
                        value={selectedSubject?.id ?? ""}
                        onChange={(event) => handleSubjectChange(event.target.value)}
                        className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                      >
                        {assignmentSubjects.map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </AppSelect>
                    </label>
                    <div className="grid gap-2">
                      <div className="text-[12px] font-bold text-slate-600">Level</div>
                      {selectedSubject?.levels.map((level) => {
                        const active = level.id === selectedLevel?.id;
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => {
                              setSelectedLevelId(level.id);
                              setResourceSearch("");
                            }}
                            className={cn(
                              "rounded-lg border px-3 py-2.5 text-left transition",
                              active ? "border-[#9ec9f4] bg-[#eef7ff] shadow-[0_8px_20px_rgba(15,108,189,0.08)]" : "border-[#dbe4f0] bg-white hover:border-[#b8d6fa] hover:bg-[#f8fbff]",
                            )}
                          >
                            <span className={cn("block text-[13px] font-extrabold", active ? "text-[#0f6cbd]" : "text-slate-900")}>{level.label}</span>
                            <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">{level.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                <div className="flex min-h-0 flex-col">
                  <div className="shrink-0 border-b border-[#dbe4f0] bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative min-w-[320px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
                        <input
                          type="text"
                          placeholder="Tìm bài trong level đang chọn..."
                          value={resourceSearch}
                          onChange={(event) => setResourceSearch(event.target.value)}
                          className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-4 text-[14px] font-semibold text-slate-900 transition focus:border-[var(--erg-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        />
                      </div>
                      <span className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2 text-[13px] font-bold text-slate-700">
                        {filteredResourceCount} bài phù hợp
                      </span>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="grid gap-3">
                      {filteredResourceTopics.map((topic) => (
                        <section key={topic.id} className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[var(--shadow-xs)]">
                          <div className="flex items-center justify-between gap-3 border-b border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">{topic.label}</h3>
                              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{topic.items.length} bài trong chủ đề</p>
                            </div>
                            <span className="rounded-full border border-[#dbe4f0] bg-white px-2.5 py-1 text-[12px] font-bold text-slate-600">
                              {selectedSubject?.label}
                            </span>
                          </div>
                          <div className="divide-y divide-[#edf2f7]">
                            {topic.items.map((item) => {
                              const checked = selectedResourceIds.has(item.id);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleResourceSelection(item.id)}
                                  className={cn(
                                    "grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition",
                                    checked ? "bg-[#eef7ff]" : "bg-white hover:bg-[#f8fbff]",
                                  )}
                                >
                                  <AssignmentCheckbox checked={checked} onChange={() => toggleResourceSelection(item.id)} label={`Chọn ${item.title}`} />
                                  <span className="min-w-0">
                                    <span className={cn("block truncate text-[14px] font-bold", checked ? "text-[#0f6cbd]" : "text-slate-900")}>{item.title}</span>
                                    <span className="mt-1 flex flex-wrap gap-1.5 text-[12px] font-semibold text-slate-500">
                                      <span>{item.activityLabel}</span>
                                      <span>·</span>
                                      <span>{item.questionCount} câu</span>
                                      <span>·</span>
                                      <span>{item.durationLabel}</span>
                                    </span>
                                  </span>
                                  <span className={cn("rounded-md border px-2.5 py-1 text-[12px] font-extrabold", item.kind === "test" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[#B8EDF7] bg-[#E6F9FD] text-[#007A91]")}>
                                    {item.kind === "test" ? "Test" : "Train"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                    {filteredResourceTopics.length === 0 ? (
                      <div className="flex h-full min-h-60 items-center justify-center rounded-lg border border-dashed border-[#cbd7e6] bg-white text-center text-sm font-semibold text-slate-500">
                        Không tìm thấy bài phù hợp trong level đang chọn.
                      </div>
                    ) : null}
                  </div>
                </div>
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
