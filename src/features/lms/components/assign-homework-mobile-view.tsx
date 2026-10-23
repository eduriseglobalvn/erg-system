import { Calendar, RefreshCw, Search } from "lucide-react";
import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
import { AppSelect } from "@/components/ui/app-select";
import {
  MobileAssignProgress,
  MobileAssignmentGroupList,
  MobileAssignmentResourceList,
  MobileGradeClassList,
  MobileStudentSelectionList,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

interface AssignHomeworkMobileViewProps {
  model: AssignHomeworkController;
}

export function AssignHomeworkMobileView({ model }: AssignHomeworkMobileViewProps) {
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
    selectedResourceIds,
    resourceSearch,
    setResourceSearch,
    mobileValidationError,
    setMobileValidationError,
    apiBacked,
    gradeOptions,
    assignmentClass,
    groupSourceOptions,
    getFallbackStudentsForClass,
    students,
    gradeClasses,
    gradeStudentIdsByClass,
    previewGradeClass,
    previewGradeClassStudents,
    selectedPopupStudentIds,
    filteredPreviewGradeClassStudents,
    allPreviewStudentsSelected,
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    filteredStudents,
    allSelected,
    toggleSelectAll,
    toggleStudent,
    toggleGradeClass,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
    toggleAssignmentGroup,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
    handleNext,
    selectedLevel,
    filteredResourceTopics,
    selectedResourceLabel,
    toggleResourceSelection,
    handleFinish,
  } = model;
    const selectedResource = selectedLevel?.topics.flatMap((topic) => topic.items).find((resource) => selectedResourceIds.has(resource.id));
    const isClassMode = targetType === "class";
    const isGroupMode = targetType === "group";
    const mobileSelectedCount = isClassMode
      ? selectedStudentIds.size
      : isGroupMode
        ? filteredSelectedAssignmentGroupCount
        : selectedGradeClassIds.size;

    return (
      <div className="flex min-h-full min-w-0 flex-col overflow-x-hidden bg-[#f3f6fb] text-slate-900">
        <div className="min-h-0 min-w-0 flex-1 pb-[calc(190px+env(safe-area-inset-bottom,0px))]">
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
                        setSelectedStudentIds(
                          new Set(
                            apiBacked
                              ? []
                              : getFallbackStudentsForClass(event.target.value, nextClass?.className).map((student) => student.id),
                          ),
                        );
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
                      studentIdsByClass={gradeStudentIdsByClass}
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
                    {selectedResource?.title ?? selectedResourceLabel}
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
                    onToggleResource={toggleResourceSelection}
                    resources={filteredResourceTopics.flatMap((topic) => topic.items)}
                    selectedResourceIds={selectedResourceIds}
                  />
                  <div className="rounded-[16px] border border-[#d9e2ef] bg-[#f8fbff] p-3">
                    <div className="text-[13px] font-extrabold text-slate-950">Xac nhan giao bai</div>
                    <div className="mt-2 grid gap-2 text-[12px] font-bold text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span>Ten bai</span>
                        <span className="min-w-0 truncate text-right text-slate-950">{title || "Chua nhap"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Đối tượng</span>
                        <span className="text-slate-950">{mobileSelectedCount} da chon</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Bài tập</span>
                        <span className="text-slate-950">{selectedResourceLabel}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Học liệu</span>
                        <span className="min-w-0 truncate text-right text-slate-950">{selectedResource?.title ?? "Chưa chọn"}</span>
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

        <div className="fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom,0px))] z-50 px-3">
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
