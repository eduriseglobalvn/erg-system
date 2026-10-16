import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  addPeriodsToTime,
  buildScheduleDraft as buildScheduleDraftFromForm,
  buildScheduleDraftKey,
  calculateInclusiveRepeatWeeks,
  mapSessionValue,
  normalizePeriodStart,
} from "@/features/teaching-calendar/model/schedule-draft";
import { CreateTeachingRoomDialog } from "@/features/teaching-calendar/components/create-teaching-room-dialog";
import type {
  ErgScheduleCatalog,
  ErgScheduleCreateResult,
  ErgScheduleDraft,
  ErgSchedulePreviewResult,
} from "./erg-calendar-types";
import {
  type ScheduleDraftRow,
  buildPeriodRangeOptions,
  createInitialScheduleRows,
  findScheduleOption,
  getOptionId,
  getTeacherTone,
  initialScheduleRows,
  optionLabel,
  periodCountOptions,
  previewToneMap,
  sessionOptions,
  weekdayOptions,
} from "./teaching-schedule-dialog-model";
import {
  bulkScheduleLayoutSx,
  commonSettingsGridSx,
  deleteRowButtonSx,
  excelActionCellSx,
  excelGridHeaderSx,
  excelGridRowSx,
  excelTableShellSx,
  noteFieldSx,
  previewIssueRowSx,
  primaryActionSx,
  schedulePreviewIconSx,
  schedulePreviewListSx,
  schedulePreviewPanelSx,
  scheduleSectionSx,
  scheduleSectionTitleSx,
  scheduleSelectSlotProps,
  scheduleSettingsBarSx,
  secondaryActionSx,
  teacherChipDotSx,
  teacherChipSx,
  teachingDialogContentSx,
  teachingDialogPaperSx,
  teachingDialogTitleSx,
  teachingDialogTitleTextSx,
  timeRangeCellSx,
} from "./teaching-schedule-dialog-styles";

function teacherSelectSlotProps(teacherId: string, label: string, muted = false) {
  return {
    select: {
      ...scheduleSelectSlotProps.select,
      renderValue: () => <TeacherColorChip label={label} muted={muted} teacherId={teacherId || "none"} />,
    },
  };
}

export function TeachingScheduleDialog({
  catalog,
  onClose,
  onCreateRoom,
  onPreview,
  onPublishBatch,
  onSubmit,
  open,
}: {
  catalog: ErgScheduleCatalog;
  onClose: () => void;
  onCreateRoom?: (input: { roomName: string; schoolId: string }) => Promise<{ id: string; label: string; schoolId: string }> | { id: string; label: string; schoolId: string };
  onPreview?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onPublishBatch?: (batchId: string) => Promise<void> | void;
  onSubmit?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  open: boolean;
}) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => catalog.schools[0]?.id ?? "");
  const [applyFrom, setApplyFrom] = useState(() => dayjs().startOf("week").format("YYYY-MM-DD"));
  const [applyTo, setApplyTo] = useState(() => dayjs().startOf("week").add(6, "day").format("YYYY-MM-DD"));
  const [bulkNote, setBulkNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewDraftKey, setPreviewDraftKey] = useState("");
  const [previewResult, setPreviewResult] = useState<ErgSchedulePreviewResult | null>(null);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [createdRooms, setCreatedRooms] = useState<Array<{ id: string; name: string; schoolId: string }>>([]);
  const schoolClasses = useMemo(
    () => catalog.classes.filter((classroom) => classroom.schoolId === selectedSchoolId),
    [catalog.classes, selectedSchoolId],
  );
  const repeatWeeks = useMemo(() => calculateInclusiveRepeatWeeks(applyFrom, applyTo), [applyFrom, applyTo]);
  const subjects = catalog.subjects ?? [];
  const levels = catalog.levels ?? [];
  const rooms = [...(catalog.rooms ?? []), ...createdRooms];
  const assistantOptions = catalog.assistantTeachers ?? catalog.teachers;
  const [expandedNoteRowId, setExpandedNoteRowId] = useState<string | null>(null);
  const [scheduleRows, setScheduleRows] = useState<ScheduleDraftRow[]>(() =>
    createInitialScheduleRows(
      catalog.classes.filter((classroom) => classroom.schoolId === (catalog.schools[0]?.id ?? "")),
      catalog,
    ),
  );
  const previewCount = scheduleRows.filter((row) => row.classId && row.mainTeacherId).length * Math.max(1, repeatWeeks);
  const totalPeriodCount = scheduleRows.reduce((total, row) => total + Number(row.periodCount || 1), 0) * Math.max(1, repeatWeeks);
  const previewRowErrorCount = previewResult ? countPreviewRowErrors(previewResult) : 0;
  const previewConflictCount = previewResult?.conflicts.length ?? 0;
  const canSubmitPreviewResult = !previewResult || previewRowErrorCount === 0;
  const submitButtonLabel = getScheduleSubmitLabel({
    hasPreview: Boolean(onPreview),
    isPreviewing,
    isSubmitting,
    previewConflictCount,
    previewReady: Boolean(previewResult),
    previewCount,
  });
  const previewRowLabels = useMemo(() => {
    const classNameById = new Map(schoolClasses.map((classroom) => [classroom.id, classroom.name]));
    const teacherNameById = new Map(catalog.teachers.map((teacher) => [teacher.id, teacher.name]));
    return new Map(scheduleRows.map((row) => [
      row.id,
      `${row.weekday} · ${classNameById.get(row.classId) ?? "Chưa chọn lớp"} · ${teacherNameById.get(row.mainTeacherId) ?? "Chưa chọn"}`,
    ]));
  }, [catalog.teachers, schoolClasses, scheduleRows]);

  useEffect(() => {
    if (!open) {
      setSubmitError("");
      setIsSubmitting(false);
      setIsPreviewing(false);
      clearPreviewState();
      setCreatedBatchId(null);
    }
  }, [open]);

  function clearPreviewState() {
    setPreviewResult(null);
    setPreviewDraftKey("");
  }

  function updateApplyFrom(nextApplyFrom: string) {
    clearPreviewState();
    setApplyFrom(nextApplyFrom);
    if (dayjs(applyTo).isBefore(dayjs(nextApplyFrom), "day")) {
      setApplyTo(nextApplyFrom);
    }
  }

  function updateApplyTo(nextApplyTo: string) {
    clearPreviewState();
    setApplyTo(nextApplyTo);
  }

  function updateSchool(nextSchoolId: string) {
    const nextClasses = catalog.classes.filter((classroom) => classroom.schoolId === nextSchoolId);
    setSelectedSchoolId(nextSchoolId);
    setScheduleRows(createInitialScheduleRows(nextClasses, catalog));
    setSubmitError("");
    clearPreviewState();
  }

  function updateRow(rowId: string, patch: Partial<ScheduleDraftRow>) {
    clearPreviewState();
    setScheduleRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function updatePeriodCount(rowId: string, nextPeriodCount: string) {
    clearPreviewState();
    setScheduleRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              end: addPeriodsToTime(row.start, nextPeriodCount),
              period: normalizePeriodStart(nextPeriodCount, row.period),
              periodCount: nextPeriodCount,
            }
          : row,
      ),
    );
  }

  function updateStartTime(rowId: string, nextStartTime: string) {
    clearPreviewState();
    setScheduleRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              end: addPeriodsToTime(nextStartTime, row.periodCount),
              start: nextStartTime,
            }
          : row,
      ),
    );
  }

  function addRow() {
    clearPreviewState();
    const previous = scheduleRows.at(-1) ?? initialScheduleRows[0];
    setScheduleRows((rows) => [...rows, { ...previous, id: `row-${Date.now()}` }]);
  }

  function duplicateWeekTemplate() {
    clearPreviewState();
    const copies = scheduleRows.map((row, index) => ({ ...row, id: `row-copy-${Date.now()}-${index}` }));
    setScheduleRows((rows) => [...rows, ...copies]);
  }

  function removeRow(rowId: string) {
    clearPreviewState();
    setScheduleRows((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  function getTeacherName(teacherId: string) {
    return catalog.teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Chưa chọn";
  }

  function getAssistantName(teacherId: string) {
    return assistantOptions.find((teacher) => teacher.id === teacherId)?.name ?? "Không có";
  }

  function buildScheduleDraft(resolveMode: ErgScheduleDraft["resolveMode"] = "REJECT") {
    if (dayjs(applyTo).isBefore(dayjs(applyFrom), "day")) {
      setSubmitError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      return null;
    }

    try {
      return buildScheduleDraftFromForm({
        applyFrom,
        note: bulkNote,
        repeatWeeks,
        resolveMode,
        rows: scheduleRows.map((row) => {
        const roomOption = findScheduleOption(rooms, row.room);
        return {
          assistantTeacherId: row.assistantTeacherId,
          classId: row.classId,
          end: row.end,
          id: row.id,
          levelId: getOptionId(row.level),
          mainTeacherId: row.mainTeacherId,
          note: row.note,
          periodCount: row.periodCount,
          periodStart: row.period,
          roomId: roomOption && typeof roomOption !== "string" ? roomOption.id : undefined,
          roomName: roomOption ? optionLabel(roomOption) : row.room || undefined,
          session: mapSessionValue(row.session),
          start: row.start,
          subjectId: getOptionId(row.subject),
          weekday: row.weekday,
        };
        }),
        schoolId: selectedSchoolId,
      }, catalog);
    } catch {
      setSubmitError("Cần ít nhất một dòng có lớp, môn học và giáo viên chính.");
      return null;
    }
  }

  async function submitSchedule(forceResolveConflicts = false) {
    if (!onSubmit) {
      onClose();
      return;
    }

    const draft = buildScheduleDraft(forceResolveConflicts ? "DELETE_CONFLICTING" : "REJECT");
    if (!draft) return;

    const draftKey = buildScheduleDraftKey(draft);
    const hasFreshPreview = Boolean(previewResult && previewDraftKey === draftKey);
    const shouldPreview = Boolean(onPreview && !hasFreshPreview && !forceResolveConflicts);

    if (shouldPreview && onPreview) {
      setIsPreviewing(true);
      setSubmitError("");
      try {
        const result = await onPreview({ ...draft, resolveMode: "REJECT" });
        setPreviewResult(result);
        setPreviewDraftKey(draftKey);
        return;
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Không thể kiểm tra xung đột. Vui lòng thử lại.");
        return;
      } finally {
        setIsPreviewing(false);
      }
    }

    if (previewResult && !canSubmitPreviewResult) {
      setSubmitError("Cần xử lý lỗi dữ liệu trong bảng lịch trước khi tạo.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await onSubmit(draft);
      if (!result.batchId) {
        setSubmitError("Backend chưa tạo batch. Vui lòng kiểm tra lỗi hoặc xung đột và thử lại.");
        return;
      }
      setCreatedBatchId(result.batchId);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo lịch. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function publishCreatedBatch() {
    if (!createdBatchId || !onPublishBatch) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onPublishBatch(createdBatchId);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể xuất bản lịch. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open} slotProps={{ paper: { sx: teachingDialogPaperSx } }} sx={{ zIndex: 3200 }}>
      <DialogTitle sx={teachingDialogTitleSx}>
        <Typography sx={teachingDialogTitleTextSx}>Tạo lịch giảng dạy</Typography>
      </DialogTitle>
      <DialogContent sx={teachingDialogContentSx}>
        {createdBatchId ? (
          <Box sx={{ backgroundColor: "success.50", border: "1px solid", borderColor: "success.light", borderRadius: 2, mb: 2, p: 2 }}>
            <Typography sx={{ color: "success.dark", fontWeight: 900 }}>Đã tạo bản nháp lịch giảng dạy</Typography>
            <Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, mt: 0.5 }}>{createdBatchId}</Typography>
          </Box>
        ) : null}
        <Box sx={bulkScheduleLayoutSx}>
          <Box sx={scheduleSettingsBarSx}>
            <Box sx={commonSettingsGridSx}>
              <TextField
                fullWidth
                label="Trường"
                onChange={(event) => updateSchool(event.target.value)}
                select
                size="small"
                slotProps={{ ...scheduleSelectSlotProps, inputLabel: { shrink: true } }}
                value={selectedSchoolId}
              >
                {catalog.schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Áp dụng từ" onChange={(event) => updateApplyFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={applyFrom} />
              <TextField
                fullWidth
                label="Áp dụng đến"
                onChange={(event) => updateApplyTo(event.target.value)}
                size="small"
                slotProps={{ input: { inputProps: { min: applyFrom } }, inputLabel: { shrink: true } }}
                type="date"
                value={applyTo}
              />
              <TextField
                fullWidth
                label="Ghi chú"
                onChange={(event) => { clearPreviewState(); setBulkNote(event.target.value); }}
                placeholder="VD: áp dụng học kỳ 2, ưu tiên phòng máy..."
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={bulkNote}
              />
            </Box>
          </Box>

          <Box sx={scheduleSectionSx}>
            <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.25, justifyContent: "space-between", mb: 1.25 }}>
              <Box>
                <Typography sx={scheduleSectionTitleSx}>Bảng lịch</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                {onCreateRoom ? <Button onClick={() => setRoomDialogOpen(true)} startIcon={<AddRoundedIcon />} sx={secondaryActionSx} variant="outlined">Tạo phòng</Button> : null}
                <Button onClick={duplicateWeekTemplate} startIcon={<ContentCopyRoundedIcon />} sx={secondaryActionSx} variant="outlined">Nhân đôi dòng</Button>
                <Button onClick={addRow} startIcon={<AddRoundedIcon />} sx={primaryActionSx} variant="contained">Thêm dòng</Button>
              </Stack>
            </Box>
            <Box data-excel-schedule-table sx={excelTableShellSx}>
              <Box sx={excelGridHeaderSx}>
                {["Thứ", "Ca", "Số tiết", "Tiết", "Giờ", "Môn", "Level", "Lớp", "Phòng", "GV chính", "Trợ giảng", "Ghi chú", ""].map((label, index, labels) => (
                  <Typography
                    key={label}
                    sx={index === labels.length - 1 ? { justifyContent: "center" } : undefined}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Stack spacing={0}>
              {scheduleRows.map((row) => (
                <Box key={row.id} sx={excelGridRowSx(expandedNoteRowId === row.id, row.mainTeacherId)}>
                  <TextField onChange={(event) => updateRow(row.id, { weekday: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.weekday}>
                    {weekdayOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { session: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.session}>
                    {sessionOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updatePeriodCount(row.id, event.target.value)} select size="small" slotProps={scheduleSelectSlotProps} value={row.periodCount}>
                    {periodCountOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { period: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.period}>
                    {buildPeriodRangeOptions(row.periodCount).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <Box sx={timeRangeCellSx}>
                    <TextField onChange={(event) => updateStartTime(row.id, event.target.value)} placeholder="13:00" size="small" value={row.start} />
                    <Typography aria-hidden sx={{ color: "#98A2B3", fontSize: 12, fontWeight: 900 }}>-</Typography>
                    <TextField onChange={(event) => updateRow(row.id, { end: event.target.value })} placeholder="13:45" size="small" value={row.end} />
                  </Box>
                  <TextField onChange={(event) => updateRow(row.id, { subject: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.subject}>
                    {subjects.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { level: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.level}>
                    {levels.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { classId: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.classId}>
                    {schoolClasses.map((classroom) => <MenuItem key={classroom.id} value={classroom.id}>{classroom.name}</MenuItem>)}
                  </TextField>
                  <TextField onChange={(event) => updateRow(row.id, { room: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.room}>
                    {rooms.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                  </TextField>
                  <TextField
                    onChange={(event) => updateRow(row.id, { mainTeacherId: event.target.value })}
                    select
                    size="small"
                    slotProps={teacherSelectSlotProps(row.mainTeacherId, getTeacherName(row.mainTeacherId))}
                    value={row.mainTeacherId}
                  >
                    {catalog.teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    onChange={(event) => updateRow(row.id, { assistantTeacherId: event.target.value })}
                    select
                    size="small"
                    slotProps={teacherSelectSlotProps(row.assistantTeacherId, getAssistantName(row.assistantTeacherId), !row.assistantTeacherId)}
                    value={row.assistantTeacherId}
                  >
                    <MenuItem value=""><TeacherColorChip label="Không có" muted teacherId="none" /></MenuItem>
                    {assistantOptions.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    multiline
                    maxRows={expandedNoteRowId === row.id ? 6 : 1}
                    minRows={expandedNoteRowId === row.id ? 3 : 1}
                    onBlur={() => setExpandedNoteRowId(null)}
                    onChange={(event) => updateRow(row.id, { note: event.target.value })}
                    onFocus={() => setExpandedNoteRowId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        setExpandedNoteRowId(null);
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="Ghi chú"
                    size="small"
                    sx={noteFieldSx(expandedNoteRowId === row.id)}
                    value={row.note}
                  />
                  <Box sx={excelActionCellSx}>
                    <IconButton aria-label="Xóa dòng lịch" disabled={scheduleRows.length === 1} onClick={() => removeRow(row.id)} sx={deleteRowButtonSx}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
            </Box>
          </Box>
          {previewResult ? (
            <SchedulePreviewPanel result={previewResult} rowLabels={previewRowLabels} />
          ) : null}

        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #EEF2F7", px: 3, py: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 700 }}>
            {scheduleRows.length} dòng · {totalPeriodCount} tiết
          </Typography>
          {submitError ? <Typography sx={{ color: "#B42318", fontSize: 12.25, fontWeight: 750, mt: 0.35 }}>{submitError}</Typography> : null}
        </Box>
        {createdBatchId ? (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Để ở bản nháp</Button>
            {onPublishBatch ? <Button disabled={isSubmitting} onClick={() => void publishCreatedBatch()} sx={primaryActionSx} variant="contained">Xuất bản ngay</Button> : null}
          </>
        ) : (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Hủy</Button>
            <Button disabled={isSubmitting || isPreviewing || !canSubmitPreviewResult} onClick={() => submitSchedule(previewConflictCount > 0)} sx={primaryActionSx} variant="contained">{submitButtonLabel}</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
    {onCreateRoom ? (
      <CreateTeachingRoomDialog
        onClose={() => setRoomDialogOpen(false)}
        onCreate={onCreateRoom}
        onCreated={(room) => setCreatedRooms((current) => current.some((item) => item.id === room.id) ? current : [...current, { id: room.id, name: room.label, schoolId: room.schoolId }])}
        open={roomDialogOpen}
        schoolId={selectedSchoolId}
      />
    ) : null}
    </>
  );
}

function SchedulePreviewPanel({
  result,
  rowLabels,
}: {
  result: ErgSchedulePreviewResult;
  rowLabels: Map<string, string>;
}) {
  const rowErrors = result.rowResults.flatMap((row) => row.errors.map((error) => ({ ...error, clientRowId: row.clientRowId })));
  const rowWarnings = result.rowResults.flatMap((row) => row.warnings.map((warning) => ({ ...warning, clientRowId: row.clientRowId })));
  const hasConflicts = result.conflicts.length > 0;
  const hasErrors = rowErrors.length > 0;
  const tone = hasErrors ? previewToneMap.error : hasConflicts ? previewToneMap.warning : previewToneMap.success;
  const title = hasErrors
    ? "Cần sửa dữ liệu trước khi tạo lịch"
    : hasConflicts
      ? "Phát hiện lịch trùng"
      : "Preview hợp lệ, có thể tạo lịch";
  const Icon = hasErrors ? ErrorOutlineRoundedIcon : hasConflicts ? WarningAmberRoundedIcon : CheckCircleOutlineRoundedIcon;

  return (
    <Box sx={schedulePreviewPanelSx(tone)}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, minWidth: 0 }}>
          <Box sx={schedulePreviewIconSx(tone)}>
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: tone.text, fontSize: 14, fontWeight: 950 }}>{title}</Typography>
            <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 650, mt: 0.25 }}>
              {result.previewEventCount} lịch · {result.teacherScheduleCount} phân công giáo viên · {result.totalPeriodCount} tiết
            </Typography>
          </Box>
        </Box>
        {hasConflicts && !hasErrors ? (
          <Typography sx={{ color: "#8A4600", flexShrink: 0, fontSize: 12, fontWeight: 850 }}>
            Bấm tạo để thay thế lịch trùng
          </Typography>
        ) : null}
      </Box>

      {hasConflicts || hasErrors || rowWarnings.length ? (
        <Stack spacing={0.65} sx={schedulePreviewListSx}>
          {rowErrors.map((error) => (
            <PreviewIssueRow key={`error-${error.clientRowId}-${error.code}-${error.message}`} message={error.message} rowLabel={rowLabels.get(error.clientRowId) ?? error.clientRowId} tone="error" />
          ))}
          {result.conflicts.map((conflict) => (
            <PreviewIssueRow key={`conflict-${conflict.clientRowId ?? "batch"}-${conflict.code}-${conflict.existingEventId ?? ""}`} message={conflict.message} rowLabel={conflict.clientRowId ? rowLabels.get(conflict.clientRowId) ?? conflict.clientRowId : "Toàn bộ batch"} tone="warning" />
          ))}
          {rowWarnings.map((warning) => (
            <PreviewIssueRow key={`warning-${warning.clientRowId}-${warning.code}-${warning.message}`} message={warning.message} rowLabel={rowLabels.get(warning.clientRowId) ?? warning.clientRowId} tone="info" />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function PreviewIssueRow({
  message,
  rowLabel,
  tone,
}: {
  message: string;
  rowLabel: string;
  tone: "error" | "warning" | "info";
}) {
  const color = tone === "error" ? "#B42318" : tone === "warning" ? "#A35200" : "#0B5CAD";
  return (
    <Box sx={previewIssueRowSx}>
      <Typography noWrap sx={{ color: "#253041", fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
        {rowLabel}
      </Typography>
      <Typography sx={{ color, fontSize: 12.25, fontWeight: 700, lineHeight: 1.45 }}>
        {message}
      </Typography>
    </Box>
  );
}

function countPreviewRowErrors(result: ErgSchedulePreviewResult) {
  return result.rowResults.reduce((total, row) => total + row.errors.length, 0);
}

function getScheduleSubmitLabel({
  hasPreview,
  isPreviewing,
  isSubmitting,
  previewConflictCount,
  previewCount,
  previewReady,
}: {
  hasPreview: boolean;
  isPreviewing: boolean;
  isSubmitting: boolean;
  previewConflictCount: number;
  previewCount: number;
  previewReady: boolean;
}) {
  if (isPreviewing) return "Đang kiểm tra...";
  if (isSubmitting) return "Đang tạo...";
  if (hasPreview && !previewReady) return "Kiểm tra xung đột";
  if (previewConflictCount > 0) return `Tạo và xử lý ${previewConflictCount} lịch trùng`;
  return `Tạo ${previewCount} lịch dạy`;
}

function TeacherColorChip({ label, muted = false, teacherId }: { label: string; muted?: boolean; teacherId: string }) {
  const tone = muted ? { bg: "#F8FAFC", border: "#D9E2EF", text: "#667085" } : getTeacherTone(teacherId);

  return (
    <Tooltip arrow title={label}>
      <Box component="span" sx={teacherChipSx(tone, muted)} title={label}>
        <Box component="span" sx={teacherChipDotSx(tone.text)} />
        <Typography component="span" noWrap sx={{ color: tone.text, fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
