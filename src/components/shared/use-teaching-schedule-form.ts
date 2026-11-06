import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  addPeriodsToTime,
  buildScheduleDraft as buildScheduleDraftFromForm,
  buildScheduleDraftKey,
  calculateInclusiveRepeatWeeks,
  mapSessionValue,
  mapWeekdayValue,
  normalizePeriodStart,
  weekdaysOvershootingRange,
} from "./schedule-draft";
import type {
  ErgScheduleCatalog,
  ErgScheduleCreateResult,
  ErgScheduleDraft,
  ErgSchedulePreviewResult,
} from "./erg-calendar-types";
import {
  type ScheduleDraftRow,
  createInitialScheduleRows,
  findScheduleOption,
  getOptionId,
  initialScheduleRows,
  optionLabel,
} from "./teaching-schedule-dialog-model";
import { countPreviewRowErrors, getScheduleSubmitLabel } from "./teaching-schedule-dialog-preview";

export type TeachingScheduleFormOptions = {
  catalog: ErgScheduleCatalog;
  onClose: () => void;
  onPreview?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onPublishBatch?: (batchId: string) => Promise<void> | void;
  onSubmit?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  open: boolean;
};

export function useTeachingScheduleForm({
  catalog,
  onClose,
  onPreview,
  onPublishBatch,
  onSubmit,
  open,
}: TeachingScheduleFormOptions) {
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

  function buildScheduleDraft(resolveMode: ErgScheduleDraft["resolveMode"] = "REJECT") {
    if (dayjs(applyTo).isBefore(dayjs(applyFrom), "day")) {
      setSubmitError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      return null;
    }
    const overshooting = weekdaysOvershootingRange(
      applyFrom,
      applyTo,
      scheduleRows.map((row) => (typeof row.weekday === "number" ? row.weekday : mapWeekdayValue(row.weekday))),
    );
    if (overshooting.length > 0) {
      setSubmitError(`Khoảng ngày không trọn ${repeatWeeks} tuần: buổi cuối của ${overshooting.map((day) => (day === 7 ? "Chủ nhật" : `Thứ ${day + 1}`)).join(", ")} sẽ vượt ngày kết thúc. Hãy chỉnh ngày kết thúc.`);
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

  return {
    addRow,
    applyFrom,
    applyTo,
    assistantOptions,
    bulkNote,
    canSubmitPreviewResult,
    clearPreviewState,
    createdBatchId,
    duplicateWeekTemplate,
    expandedNoteRowId,
    isPreviewing,
    isSubmitting,
    levels,
    previewConflictCount,
    previewResult,
    previewRowLabels,
    publishCreatedBatch,
    removeRow,
    roomDialogOpen,
    rooms,
    scheduleRows,
    schoolClasses,
    selectedSchoolId,
    setBulkNote,
    setCreatedRooms,
    setExpandedNoteRowId,
    setRoomDialogOpen,
    subjects,
    submitButtonLabel,
    submitError,
    submitSchedule,
    totalPeriodCount,
    updateApplyFrom,
    updateApplyTo,
    updatePeriodCount,
    updateRow,
    updateSchool,
    updateStartTime,
  };
}
