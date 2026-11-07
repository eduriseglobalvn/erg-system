import type { ReactNode } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
const visuallyHidden = { border: 0, clip: "rect(0 0 0 0)", height: 1, margin: -1, overflow: "hidden", p: 0, position: "absolute", whiteSpace: "nowrap", width: 1 } as const;
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";
import { parseAssignDateTime } from "@/features/lms/components/assign-homework-recipient";
import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { AssignQuizThemeSlot } from "@/features/lms/components/assign-quiz-theme-slot";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
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
    handleAssignmentClassChange,
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
    isSubmitting,
    isClassLoading,
    gradeOptions,
    assignmentClass,
    groupSourceOptions,
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

    const numberAdornment = (unit: string) => ({
      input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
    });
    const dateField = (kind: "start" | "end", label: string, value: string, onChange: (value: string) => void) => (
      <Box sx={{ position: "relative" }}>
        <ErgTextField
          label={label}
          size="small"
          value={formatShortDateTimeVi(parseAssignDateTime(value)) || value}
          onClick={() => setOpenDatePicker(kind)}
          slotProps={{
            htmlInput: { readOnly: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <ErgIconButton
                    label={kind === "start" ? "Chọn ngày bắt đầu" : "Chọn ngày kết thúc"}
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenDatePicker(openDatePicker === kind ? null : kind);
                    }}
                    sx={{ width: 44, height: 44 }}
                  >
                    <CalendarTodayIcon fontSize="small" />
                  </ErgIconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <DateTimePickerPopover open={openDatePicker === kind} value={value} onChange={onChange} onClose={() => setOpenDatePicker(null)} />
      </Box>
    );
    const previewOverlay = ({
      meta,
      onClose,
      onReset,
      search,
      setSearch,
      title: overlayTitle,
      list,
    }: {
      meta: string;
      onClose: () => void;
      onReset: () => void;
      search: string;
      setSearch: (value: string) => void;
      title: string;
      list: ReactNode;
    }) => (
      <Box sx={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>
        <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 2, py: 1.5, boxShadow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap variant="subtitle1" sx={{ fontWeight: "fontWeightBold" }}>{overlayTitle}</Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{meta}</Typography>
            </Box>
            <ErgButton variant="outlined" onClick={onClose} sx={{ height: 40, flexShrink: 0 }}>
              Đóng
            </ErgButton>
          </Box>
          <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
            <ErgSearchField
              placeholder="Tìm học sinh"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 0, flex: 1 }}
            />
            <ErgButton variant="outlined" startIcon={<RefreshIcon fontSize="small" />} onClick={onReset} sx={{ height: 44, flexShrink: 0 }}>
              Đặt lại
            </ErgButton>
          </Box>
        </Box>
        {list}
      </Box>
    );
    const summaryRows: Array<[string, ReactNode, boolean]> = [
      ["Tên bài", title || "Chưa nhập", true],
      ["Đối tượng", `${mobileSelectedCount} đã chọn`, false],
      ["Bài tập", selectedResourceLabel, false],
      ["Học liệu", selectedResource?.title ?? "Chưa chọn", true],
      ["Thời gian", `${maxDurationMinutes} phút`, false],
    ];
    const cardSx = { borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "background.paper", boxShadow: 1 } as const;

    return (
      <Box sx={{ display: "flex", minHeight: "100%", minWidth: 0, flexDirection: "column", overflowX: "hidden", bgcolor: "background.default", color: "text.primary" }}>
        <Box sx={{ minHeight: 0, minWidth: 0, flex: 1, pb: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
          <Typography component="h1" sx={visuallyHidden}>Giao bài</Typography>
          <MobileAssignProgress selectedCount={mobileSelectedCount} step={step} targetType={targetType} />

          <Box sx={{ display: "grid", gap: 1.25, p: 1.5 }}>
            {step === 1 ? (
            <Box component="section" sx={{ ...cardSx, p: 1.5 }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "primary.main" }}>Thiết lập giao bài</Typography>
                <Typography component="h2" variant="subtitle1" sx={{ mt: 0.25, fontWeight: "fontWeightBold" }}>Đối tượng, tên bài và thời gian</Typography>
              </Box>

              <Box sx={{ display: "grid", gap: 1.25 }}>
                <ErgSelect
                  label="Đối tượng giao bài"
                  size="small"
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
                  options={[
                    { label: "Giao theo lớp", value: "class" },
                    { label: "Giao theo khối", value: "grade" },
                    { label: "Giao theo nhóm học tập", value: "group" },
                  ]}
                />

                <ErgTextField
                  label="Tên bài tập"
                  required
                  size="small"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (mobileValidationError) setMobileValidationError("");
                  }}
                  placeholder="Nhập tên bài tập"
                  error={Boolean(mobileValidationError)}
                  helperText={mobileValidationError || undefined}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
                  <ErgTextField
                    label="Số lần làm"
                    size="small"
                    type="number"
                    value={attemptLimit}
                    onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
                    slotProps={{ ...numberAdornment("lần"), htmlInput: { min: 1, max: 20 } }}
                  />
                  <ErgTextField
                    label="Thời gian tối đa"
                    size="small"
                    type="number"
                    value={maxDurationMinutes}
                    onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
                    slotProps={{ ...numberAdornment("phút"), htmlInput: { min: 1, max: 240 } }}
                  />
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                  {dateField("start", "Ngày bắt đầu", startDate, setStartDate)}
                  {dateField("end", "Ngày kết thúc", endDate, setEndDate)}
                </Box>
              </Box>
            </Box>
            ) : null}

            {step === 1 ? (
              <Box component="section" sx={cardSx}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1.5, py: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>
                    {isClassMode ? "Chọn lớp giao bài" : isGroupMode ? "Chọn nhóm giao bài" : "Chọn khối giao bài"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.25, fontWeight: "fontWeightBold" }}>
                    {isClassMode ? `${selectedStudentIds.size}/${students.length} học sinh` : isGroupMode ? `${filteredSelectedAssignmentGroupCount}/${filteredAssignmentGroups.length} nhóm` : `${selectedGradeClassIds.size}/${gradeClasses.length} lớp`}
                  </Typography>
                </Box>

                {isClassMode ? (
                  <Box sx={{ display: "grid", gap: 1.25, p: 1.5 }}>
                    <ErgSelect
                      size="small"
                      value={assignmentClass?.id ?? ""}
                      onChange={(event) => handleAssignmentClassChange(event.target.value)}
                      options={classes.map((classroom) => ({ label: classroom.className, value: classroom.id }))}
                      sx={{ width: 122 }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ErgSearchField
                        placeholder="Tìm học sinh"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        sx={{ minWidth: 0, flex: 1 }}
                      />
                      <ErgButton
                        variant="outlined"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedStudentIds(new Set(students.map((student) => student.id)));
                        }}
                        sx={{ height: 40, flexShrink: 0 }}
                      >
                        Đặt lại
                      </ErgButton>
                    </Box>
                    <MobileStudentSelectionList
                      allSelected={allSelected}
                      isLoading={isClassLoading}
                      onToggleAll={toggleSelectAll}
                      onToggleStudent={toggleStudent}
                      selectedIds={selectedStudentIds}
                      students={filteredStudents}
                    />
                  </Box>
                ) : isGroupMode ? (
                  <Box sx={{ display: "grid", gap: 1.5, p: 1.5 }}>
                    <ErgSelect
                      size="small"
                      value={selectedGroupSource}
                      onChange={(event) => setSelectedGroupSource(event.target.value)}
                      options={[
                        { label: "Tất cả nhóm", value: allGroupSourcesFilterValue },
                        ...groupSourceOptions.map((source) => ({ label: source, value: source })),
                      ]}
                    />
                    <MobileAssignmentGroupList
                      groups={filteredAssignmentGroups}
                      onOpenPreview={openAssignmentGroupPreview}
                      onToggleGroup={toggleAssignmentGroup}
                      selectedGroupIds={selectedAssignmentGroupIds}
                      selectedStudentIdsByGroup={selectedGroupStudentIdsByGroup}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gap: 1.5, p: 1.5 }}>
                    <ErgSelect
                      size="small"
                      value={selectedGradeLabel}
                      onChange={(event) => {
                        setSelectedGradeLabel(event.target.value);
                        setSelectedGradeClassIds(new Set());
                        setPreviewGradeClassId(null);
                      }}
                      options={gradeOptions.map((grade) => ({ label: grade, value: grade }))}
                    />
                    <MobileGradeClassList
                      classes={gradeClasses}
                      onOpenPreview={openGradeClassPreview}
                      onToggleClass={toggleGradeClass}
                      selectedClassIds={selectedGradeClassIds}
                      studentIdsByClass={gradeStudentIdsByClass}
                      selectedStudentIdsByClass={selectedGradeStudentIdsByClass}
                    />
                  </Box>
                )}
              </Box>
            ) : step === 2 ? (
              <Box component="section" sx={cardSx}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>Tài nguyên</Typography>
                  <Typography variant="subtitle1" sx={{ mt: 0.25, fontWeight: "fontWeightBold" }}>
                    {selectedResource?.title ?? selectedResourceLabel}
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, p: 1.5 }}>
                  <ErgSearchField
                    placeholder="Tìm tài nguyên"
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                  />
                  <MobileAssignmentResourceList
                    onToggleResource={toggleResourceSelection}
                    resources={filteredResourceTopics.flatMap((topic) => topic.items)}
                    selectedResourceIds={selectedResourceIds}
                  />
                  <AssignQuizThemeSlot selectedQuizIds={selectedResourceIds} />
                  <Box sx={{ borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "background.default", p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: "fontWeightBold" }}>Xác nhận giao bài</Typography>
                    <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                      {summaryRows.map(([label, value, truncate]) => (
                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, typography: "caption", fontWeight: "fontWeightBold", color: "text.secondary" }}>
                          <span>{label}</span>
                          <Box component="span" sx={{ color: "text.primary", ...(truncate ? { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" } : null) }}>
                            {value}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>

        {previewAssignmentGroup
          ? previewOverlay({
              title: previewAssignmentGroup.name,
              meta: `${selectedGroupPopupStudentIds.size}/${previewAssignmentGroupStudents.length} học sinh đang chọn`,
              onClose: () => setPreviewAssignmentGroupId(null),
              onReset: resetGroupPreviewStudents,
              search: groupStudentSearch,
              setSearch: setGroupStudentSearch,
              list: (
                <MobileStudentSelectionList
                  allSelected={allGroupPopupStudentsSelected}
                  onToggleAll={toggleAllGroupPreviewStudents}
                  onToggleStudent={toggleGroupPreviewStudent}
                  selectedIds={selectedGroupPopupStudentIds}
                  students={filteredPreviewAssignmentGroupStudents}
                />
              ),
            })
          : null}

        {previewGradeClass
          ? previewOverlay({
              title: previewGradeClass.className,
              meta: `${selectedPopupStudentIds.size}/${previewGradeClassStudents.length} học sinh đang chọn`,
              onClose: () => setPreviewGradeClassId(null),
              onReset: resetPreviewStudents,
              search: gradeStudentSearch,
              setSearch: setGradeStudentSearch,
              list: (
                <MobileStudentSelectionList
                  allSelected={allPreviewStudentsSelected}
                  onToggleAll={toggleAllPreviewStudents}
                  onToggleStudent={togglePreviewStudent}
                  selectedIds={selectedPopupStudentIds}
                  students={filteredPreviewGradeClassStudents}
                />
              ),
            })
          : null}

        <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, pt: 1, pb: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ErgButton
              variant="outlined"
              disabled={isSubmitting}
              onClick={step === 1 ? onBack : () => setStep((currentStep) => Math.max(1, currentStep - 1))}
              sx={{ height: 44, flex: 1 }}
            >
              {step === 1 ? "Hủy" : "Quay lại"}
            </ErgButton>
            <ErgButton
              variant="contained"
              disabled={isSubmitting}
              onClick={step < 2 ? handleNext : handleFinish}
              sx={{ height: 44, minWidth: 0, flex: 1.35, px: 2, "&:active": { transform: "scale(0.99)" } }}
            >
              <span>{step < 2 ? "Tiếp theo" : isSubmitting ? "Đang giao..." : "Giao bài"}</span>
            </ErgButton>
          </Box>
        </Box>
      </Box>
    );
}
