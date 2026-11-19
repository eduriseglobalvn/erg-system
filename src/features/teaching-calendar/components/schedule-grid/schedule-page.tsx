import { useCallback, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { publishTeachingScheduleBatchV2 } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";
import { applyConflictFix, cellKey, classesOverWeeklyLimit, conflictRow, dateOfCell, errorConflicts, moveOrSwap, weeklyLimitMessage, type GridRow, type ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { AccessPanel } from "./access-panel";
import { BatchRenamePopover } from "./batch-rename-popover";
import { CellEditorPopover } from "./cell-editor-popover";
import { ConflictPanel } from "./conflict-panel";
import { ReuseDialog } from "../reuse/reuse-dialog";
import { exportSheets, overviewFileName, scheduleSheet } from "@/features/teaching-calendar/domain/schedule-excel";
import { ScheduleGrid } from "./schedule-grid";
import { ScheduleHeader } from "./schedule-header";
import { ScheduleInfoBar, weeksBetween } from "./schedule-info-bar";
import { STALE_VERSION_MESSAGE, useRenameBatch } from "./use-rename-batch";
import { useGridKeyboard } from "./use-grid-keyboard";
import { parseGridPaste } from "./use-grid-paste";
import { useScheduleIntent } from "./use-schedule-intent";
import { useSchedulePage } from "./use-schedule-page";

const rowText = (row: GridRow) => [row.className, row.roomName ?? row.newRoomName ?? "", row.teacherName ?? ""].join(" / ");

/** Trang «Thời khóa biểu» (6.2): thay dialog 1384px. Moi thay doi la nhap, tu luu sau 1,5 s; xuat bi khoa khi con ERROR. */
export function SchedulePage() {
  const page = useSchedulePage();
  const { batchStatus, catalog, cells, draft, holidays, school, schools, states, template, templates, weekStart } = page;
  const { meta, rows, setRows } = draft;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<{ anchor: HTMLElement; key: string; view?: "teacher" } | null>(null);
  const [renameAnchor, setRenameAnchor] = useState<HTMLElement | null>(null);
  const [unknown, setUnknown] = useState<Map<string, string>>(new Map());
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [pendingSchool, setPendingSchool] = useState<string | null>(null);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const clipboard = useRef<GridRow | null>(null);
  const rename = useRenameBatch({ batchId: meta.batchId ?? "", onRenamed: draft.applyBatch, schoolName: school?.schoolName ?? "", version: meta.version ?? 0 });
  // needsSubject = tiet chua luu duoc: chan roi trang de khong mat.
  const busy = draft.status === "dirty" || draft.status === "saving" || draft.status === "needsSubject";
  const blocker = useBlocker({ enableBeforeUnload: () => busy, shouldBlockFn: () => busy, withResolver: true });

  const setCell = useCallback((key: string, row: GridRow | null) => {
    setUnknown((current) => { const next = new Map(current); next.delete(key); return next; });
    setRows((current) => [...current.filter((item) => cellKey(item.weekday, item.periodNo) !== key), ...(row ? [row] : [])]);
  }, [setRows]);
  const openCell = useCallback((key: string, anchor?: HTMLElement | "teacher") => {
    const view = anchor === "teacher" ? "teacher" : undefined;
    const element = anchor instanceof HTMLElement ? anchor : document.querySelector<HTMLElement>(`[data-cell="${key}"]`);
    if (element) setEditor({ anchor: element, key, view });
  }, []);
  const clearCell = useCallback((key: string) => {
    const previous = cells.get(key);
    if (!previous) return;
    setCell(key, null);
    toast("Đã xoá tiết", { action: { label: "Hoàn tác", onClick: () => setCell(key, previous) }, duration: 5000 });
  }, [cells, setCell]);
  const copyCell = useCallback((key: string) => {
    const row = cells.get(key);
    clipboard.current = row ?? null;
    if (row) void navigator.clipboard?.writeText(rowText(row)).catch(() => undefined);
  }, [cells]);
  const periods = useMemo(() => (template?.slots ?? []).map((slot) => slot.periodNo), [template]);
  const keyboard = useGridKeyboard({ onClear: clearCell, onCopy: copyCell, onOpen: openCell, periods });
  useScheduleIntent({ cells, openCell, periods, ready: !page.loading && Boolean(template), setActive: keyboard.setActive, setCell });

  const onPaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text");
    if (!text || !template) return;
    event.preventDefault();
    if (clipboard.current && text === rowText(clipboard.current)) {
      const [weekday, periodNo] = keyboard.active.split(":").map(Number);
      setCell(keyboard.active, { ...clipboard.current, clientRowId: crypto.randomUUID(), eventId: undefined, periodNo, weekday });
      return;
    }
    const result = parseGridPaste(text, keyboard.active, {
      classes: (catalog?.classes ?? []).filter((item) => item.schoolId === meta.schoolId).map((item) => ({ id: item.id, name: item.label })),
      periods: template.slots.filter((slot) => slot.startTime).map((slot) => slot.periodNo),
      rooms: (catalog?.rooms ?? []).filter((item) => item.id && (!item.schoolId || item.schoolId === meta.schoolId)).map((item) => ({ id: item.id as string, name: item.label })),
      teachers: (catalog?.teachers ?? []).map((item) => ({ id: item.id, name: item.label })),
    });
    setUnknown(new Map(result.unknown.map((item) => [item.key, item.name])));
    setRows((current) => {
      const taken = new Set(result.rows.map((row) => cellKey(row.weekday, row.periodNo)));
      return [...current.filter((row) => !taken.has(cellKey(row.weekday, row.periodNo))), ...result.rows];
    });
  };

  const focusConflict = (conflict: ScheduleConflict) => openCell(cellKey(conflict.weekday, conflict.periodNo));
  const errors = errorConflicts(draft.conflicts).length + unknown.size;
  const overLimit = classesOverWeeklyLimit(rows);
  const weeks = weeksBetween(meta.applyFrom, meta.repeatUntil);
  const programs = useMemo(() => (catalog?.levels ?? []).map((level) => ({
    label: [catalog?.subjects.find((subject) => subject.id === level.subjectId)?.label, level.label].filter(Boolean).join(" · "),
    levelId: level.id, subjectId: level.subjectId,
  })), [catalog]);

  const publish = async () => {
    setConfirmPublish(false);
    setPublishing(true);
    setPublishError(null);
    try {
      const saved = await draft.flush();
      const latest = draft.getMeta();
      if (!saved) { setPublishError("Chưa lưu được thay đổi nên chưa thể áp dụng. Bấm «Thử lại» rồi áp dụng lại."); return; }
      if (!latest.batchId || latest.version === undefined) { setPublishError("Chưa có tiết nào được lưu để áp dụng. Xếp ít nhất một tiết rồi thử lại."); return; }
      const batch = await publishTeachingScheduleBatchV2(latest.batchId, latest.version);
      toast.success(`Đã áp dụng ${batch.affectedEventCount} tiết · đã gửi thông báo cho ${draft.accessChanges.length} giáo viên`);
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) });
      void navigate({ href: adminPath("/calendar") });
    } catch (error) {
      const code = teachingScheduleErrorCode(error);
      setPublishError(code === "PUBLISH_BLOCKED_BY_CONFLICTS" ? `Còn ${errors} xung đột cần xử lý trước khi áp dụng.` : code === "STALE_VERSION" ? STALE_VERSION_MESSAGE : "Chưa áp dụng được. Thử lại sau.");
    } finally {
      setPublishing(false);
    }
  };

  if (page.error) return <ErgErrorState action={<ErgButton onClick={page.refetch} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />;
  if (page.loading || !template) return <ContentPendingSkeleton />;

  const activeRow = editor ? cells.get(editor.key) : undefined;
  const [editWeekday, editPeriod] = editor ? editor.key.split(":").map(Number) : [1, 1];
  const editSlot = template.slots.find((slot) => slot.periodNo === editPeriod) ?? { periodNo: editPeriod };

  return (
    <Stack spacing={1.75} sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
      <ScheduleHeader
        batchLabel={draft.batchLabel} batchStatus={batchStatus} errorCount={errors}
        onExport={() => void exportSheets(() => [scheduleSheet({ rows, schoolName: school?.schoolName ?? "", template, weekStart })], overviewFileName(weekStart))} onPublish={() => setConfirmPublish(true)}
        onRename={setRenameAnchor} onReusePrevious={meta.schoolId ? () => setReuseOpen(true) : undefined} onRetry={() => void draft.flush().then((saved) => { if (saved) setPublishError(null); })} publishing={publishing} rowCount={rows.length}
        savedAt={draft.savedAt} schoolName={school?.schoolName ?? ""} status={draft.status} templateName={template.name}
      />
      {draft.status === "stale" ? <Alert action={<ErgButton onClick={() => window.location.reload()} variant="text">Tải lại</ErgButton>} severity="error">{STALE_VERSION_MESSAGE}</Alert> : null}
      {publishError ? <Alert onClose={() => setPublishError(null)} severity="error">{publishError}</Alert> : null}
      {overLimit.length ? <Alert severity="warning" variant="filled">{weeklyLimitMessage(overLimit)}</Alert> : null}
      <ScheduleInfoBar
        meta={meta} onChange={draft.setMeta}
        onSchoolChange={(id) => (rows.length ? setPendingSchool(id) : draft.setMeta({ schoolId: id }))}
        programs={programs} schools={schools.map((item) => ({ id: item.schoolId, label: item.schoolName }))} templates={templates}
      />
      <Box sx={{ alignItems: "flex-start", display: "grid", gap: 2, gridTemplateColumns: { lg: "minmax(0, 1fr) 360px", xs: "1fr" } }}>
        <Box onPaste={onPaste}>
          <ScheduleGrid
            active={keyboard.active} holidays={holidays} onActivate={keyboard.setActive} onKeyDown={keyboard.onKeyDown}
            onMove={(from, to) => setRows((current) => moveOrSwap(current, from, to))} onOpen={openCell}
            rows={cells} states={states} template={template} unknown={unknown} weekStart={weekStart}
          />
        </Box>
        <Stack spacing={1.5}>
          <ConflictPanel
            conflicts={draft.conflicts} onFix={(conflict) => setRows((current) => applyConflictFix(current, conflict))}
            onGoTo={focusConflict}
            onRemove={(conflict) => { const row = conflictRow(rows, conflict); if (row) clearCell(cellKey(row.weekday, row.periodNo)); }}
            unknownNames={[...unknown.values()]}
          />
          <AccessPanel changes={draft.accessChanges} schoolName={school?.schoolName ?? ""} />
        </Stack>
      </Box>
      <CellEditorPopover
        anchorEl={editor?.anchor ?? null} batchId={meta.batchId} date={dateOfCell(meta.applyFrom, editWeekday)}
        initialView={editor?.view} onChange={(row) => editor && setCell(editor.key, row)} onClose={() => setEditor(null)} row={activeRow}
        schoolId={meta.schoolId} slot={editSlot} weekday={editWeekday}
      />
      <BatchRenamePopover
        anchorEl={renameAnchor} error={rename.error} label={draft.batchLabel} onCancel={() => { rename.clearError(); setRenameAnchor(null); }}
        onChange={rename.clearError} onSave={(label) => rename.rename(label, () => setRenameAnchor(null))} pending={rename.pending}
      />
      <ErgConfirmDialog
        confirmLabel="Áp dụng và gửi" description={`${draft.accessChanges.length} giáo viên · ${draft.accessChanges.reduce((sum, item) => sum + item.classes.filter((c) => c.state === "NEW").length, 0)} lớp mới · ${draft.accessChanges.reduce((sum, item) => sum + item.classes.filter((c) => c.state === "REVOKE").length, 0)} thu hồi`}
        onCancel={() => setConfirmPublish(false)} onConfirm={() => void publish()} open={confirmPublish}
        title={`Áp dụng ${rows.length * Math.max(weeks, 1)} tiết và thông báo cho giáo viên?`}
      />
      <ErgConfirmDialog
        confirmLabel="Đổi trường" description={`Đổi trường sẽ xoá ${rows.length} tiết nháp đang xếp.`} destructive
        onCancel={() => setPendingSchool(null)}
        onConfirm={() => { if (pendingSchool) { setRows(() => []); draft.setMeta({ schoolId: pendingSchool }); } setPendingSchool(null); }}
        open={Boolean(pendingSchool)} title="Đổi trường?"
      />
      <ReuseDialog
        onClose={() => setReuseOpen(false)} onSchoolChange={() => undefined} open={reuseOpen} schoolId={meta.schoolId}
        schools={[{ id: meta.schoolId, name: school?.schoolName ?? "" }]} weekStart={addDaysToDate(weekStart, -7)}
      />
      <ErgConfirmDialog
        confirmLabel="Rời trang" description="Thay đổi đang được lưu. Rời trang bây giờ có thể mất thay đổi gần nhất."
        onCancel={() => blocker.reset?.()} onConfirm={() => blocker.proceed?.()} open={blocker.status === "blocked"} title="Rời trang?"
      />
    </Stack>
  );
}
