import { useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgSelect, ErgTextField, type ErgSelectOption } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { formatDateVi } from "@/domain/formatters/format-date";
import { deleteTeachingScheduleEvent } from "@/features/teaching-calendar/api/teaching-calendar-command-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { editTeachingScheduleSlot } from "@/features/teaching-calendar/api/teaching-calendar-slot-change-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { dayLabel, weekdayName, weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { editPatch, initialDraft, mainTeacherOf, scopeInput, scopeReady, type EditDraft, type ScopeState } from "@/features/teaching-calendar/domain/slot-change-model";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ChangePreview } from "./change-preview";
import { ScopeField, type ScopeOption } from "./scope-field";
import { useSchoolPeriodsOn, useSlotOptions, useSubjectOptions } from "./use-slot-dialog-data";
import { useSlotChange } from "./use-slot-change";

const { color, type } = ergEnterpriseTokens;
const BLOCKED_SUFFIX: Record<string, string> = { BUSY: " · bận", LEAVE: " · nghỉ", TRAVEL: " · không kịp di chuyển" };

type Props = {
  canDelete: boolean;
  event: TeachingCalendarEvent;
  /** `period` = «Dời tiết»: dua con tro vao o Tiet. */
  focus?: "period";
  onClose: () => void;
};

function Field({ children, help, label }: { children: ReactNode; help?: string; label: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography component="span" sx={{ color: color.textSecondary, ...type.noteMedium }}>{label}</Typography>
      {children}
      {help ? <Typography component="span" sx={{ color: color.textMuted, ...type.note }}>{help}</Typography> : null}
    </Stack>
  );
}

const dd = (date: string) => formatDateVi(date).slice(0, 5);

/** Dialog «Sửa tiết» (board AdminSlotEdit) cho tiet da xuat ban: gui `editTeachingScheduleSlot`, xem truoc bang dryRun. */
export function SlotEditDialog({ canDelete, event, focus, onClose }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EditDraft>(() => initialDraft(event));
  const [scope, setScope] = useState<ScopeState>({ dates: [], kind: "THIS_ONLY" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const periods = useSchoolPeriodsOn(event.schoolId, event.date);
  const options = useSlotOptions(event, draft.newDate || event.date, draft.periodNo);
  const subjects = useSubjectOptions(event);
  const main = mainTeacherOf(event);
  const patch = useMemo(() => editPatch(event, draft, scope), [draft, event, scope]);
  const input = patch && scopeReady(scope) ? { ...patch, eventId: event.id, scope: scopeInput(scope) } : null;
  const change = useSlotChange("edit", input, editTeachingScheduleSlot, onClose);
  const remove = useMutation({
    meta: { silent: true },
    mutationFn: () => deleteTeachingScheduleEvent({ eventId: event.id, tenantId: getDefaultTenantId() }, "lcms"),
    onSuccess: async () => {
      toast.success("Đã xoá tiết");
      await queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) });
      onClose();
    },
  });

  const set = <K extends keyof EditDraft>(key: K, value: EditDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const periodOptions: ErgSelectOption[] = periods.map((slot) => ({ label: `Tiết ${slot.periodNo} · ${slot.startTime} – ${slot.endTime}`, value: slot.periodNo }));
  if (!periodOptions.some((option) => option.value === draft.periodNo)) periodOptions.push({ label: `Tiết ${draft.periodNo}`, value: draft.periodNo });
  const rooms: ErgSelectOption[] = (options.data?.rooms ?? []).filter((room) => room.roomId).map((room) => ({ disabled: room.state === "BUSY" && room.roomId !== draft.roomId, label: `${room.roomName}${room.state === "BUSY" ? " · bận" : ""}`, value: room.roomId as string }));
  if (!rooms.some((room) => room.value === draft.roomId)) rooms.push({ label: event.roomName ?? (draft.roomId || "Chưa chọn phòng"), value: draft.roomId });
  const subjectOptions: ErgSelectOption[] = (subjects.data ?? []).map((subject) => ({ label: subject.label, value: subject.id }));
  if (draft.subjectId && !subjectOptions.some((subject) => subject.value === draft.subjectId)) subjectOptions.push({ label: event.subjectName ?? draft.subjectId, value: draft.subjectId });
  const assistants: ErgSelectOption[] = [{ label: "Không có", value: "" }, ...(options.data?.teachers ?? []).filter((teacher) => teacher.teacherId !== main?.userId).map((teacher) => ({
    disabled: teacher.state in BLOCKED_SUFFIX && teacher.teacherId !== draft.assistantId, label: `${teacher.teacherName}${BLOCKED_SUFFIX[teacher.state] ?? ""}`, value: teacher.teacherId,
  }))];
  if (draft.assistantId && !assistants.some((assistant) => assistant.value === draft.assistantId)) assistants.push({ label: event.assistantName ?? draft.assistantId, value: draft.assistantId });

  const periodChanged = draft.periodNo !== event.periodStart;
  const weekday = weekdayName(weekdayIndex(event.date));
  const count = change.affected === undefined ? "" : ` (${change.affected} tiết)`;
  const scopes: ScopeOption[] = [
    { kind: "THIS_ONLY", sub: periodChanged ? `Các tuần sau giữ Tiết ${event.periodStart}` : "Các tuần sau giữ nguyên", title: `Chỉ tiết này (${dd(event.date)})` },
    { kind: "FROM_DATE_TO_END", sub: `Mọi ${weekday} của ${event.className} từ ${dd(event.date)} đến hết đợt thay đổi theo${scope.kind === "FROM_DATE_TO_END" ? count : ""}`, title: `Từ ${dd(event.date)} đến hết đợt` },
    { kind: "SELECTED_DATES", sub: "Chỉ các ngày bạn chọn trong đợt", title: "Chọn ngày…" },
  ];
  const note = scope.kind === "THIS_ONLY" ? undefined : "Đổi ngày chỉ áp dụng cho «Chỉ tiết này».";
  const blocked = change.previewState.kind === "blocked";

  return (
    <>
      <ErgDialog
        actions={(
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
            {canDelete ? <ErgButton color="error" onClick={() => setConfirmDelete(true)} variant="text">Xoá tiết</ErgButton> : null}
            <Box sx={{ flex: 1 }} />
            <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
            <ErgButton disabled={!input || blocked || Boolean(change.previewError) || change.previewLoading} loading={change.saving} onClick={change.submit} variant="contained">Lưu thay đổi</ErgButton>
          </Box>
        )}
        description={`${event.className} · ${event.schoolName} · Đã xuất bản`}
        maxWidth={false} onClose={onClose} open sx={{ "& .MuiDialog-paper": { maxWidth: 480 } }} title="Sửa tiết"
      >
        <Stack spacing={1.75}>
          <Field help={note} label="Ngày">
            <ErgTextField compact disabled={scope.kind !== "THIS_ONLY"} onChange={(e) => set("newDate", e.target.value)} slotProps={{ htmlInput: { "aria-label": "Ngày" } }} type="date" value={draft.newDate} />
            <Typography component="span" sx={{ color: color.textMuted, ...type.note }}>{dayLabel(draft.newDate || event.date)}</Typography>
          </Field>
          <Field help={periodChanged ? `Đang là Tiết ${event.periodStart}` : undefined} label="Tiết">
            <ErgSelect autoFocus={focus === "period"} onChange={(e) => set("periodNo", Number(e.target.value))} options={periodOptions} size="small" slotProps={{ htmlInput: { "aria-label": "Tiết" } }} value={draft.periodNo} />
          </Field>
          <Field help="Đổi lớp thì xoá tiết này và thêm tiết mới." label="Lớp">
            <ErgTextField compact disabled slotProps={{ htmlInput: { "aria-label": "Lớp" } }} value={event.className} />
          </Field>
          <Field label="Phòng"><ErgSelect onChange={(e) => set("roomId", String(e.target.value))} options={rooms} size="small" slotProps={{ htmlInput: { "aria-label": "Phòng" }, select: { displayEmpty: true } }} value={draft.roomId} /></Field>
          <Field label="Môn / chương trình"><ErgSelect onChange={(e) => set("subjectId", String(e.target.value))} options={subjectOptions} size="small" slotProps={{ htmlInput: { "aria-label": "Môn" } }} value={draft.subjectId} /></Field>
          <Field help="Đổi người dạy dùng nút «Đổi giáo viên» để chọn dạy thay hay đổi hẳn." label="Giáo viên">
            <ErgTextField compact disabled slotProps={{ htmlInput: { "aria-label": "Giáo viên" } }} value={main?.displayName ?? "—"} />
          </Field>
          <Field label="Trợ giảng"><ErgSelect onChange={(e) => set("assistantId", String(e.target.value))} options={assistants} size="small" slotProps={{ htmlInput: { "aria-label": "Trợ giảng" }, select: { displayEmpty: true } }} value={draft.assistantId} /></Field>
          <ChangePreview error={change.previewError} loading={change.previewLoading} state={change.previewState} />
          <ScopeField onChange={setScope} options={scopes} scope={scope} />
          <Typography sx={{ color: color.textMuted, ...type.note }}>Tiết đã xuất bản: {main?.displayName ?? "giáo viên"} và trường nhận thông báo đổi giờ.</Typography>
          {change.saveError ? <Typography color="error" role="alert" sx={type.note}>{change.saveError}</Typography> : null}
          {remove.isError ? <Typography color="error" role="alert" sx={type.note}>Chưa xoá được tiết. Thử lại sau.</Typography> : null}
        </Stack>
      </ErgDialog>
      <ErgConfirmDialog
        confirmLabel="Xoá" description="Tiết sẽ bị huỷ khỏi lịch giáo viên." destructive
        onCancel={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); remove.mutate(); }}
        open={confirmDelete} title="Xoá tiết này?"
      />
    </>
  );
}
