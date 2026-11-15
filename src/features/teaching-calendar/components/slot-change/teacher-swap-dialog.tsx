import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { formatDateVi } from "@/domain/formatters/format-date";
import { swapTeachingScheduleTeacher } from "@/features/teaching-calendar/api/teaching-calendar-slot-change-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { weekdayIndex, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { mainTeacherOf, NOTE_MAX, scopeReady, swapInput, SWAP_REASONS, type ScopeState, type SwapReason } from "@/features/teaching-calendar/domain/slot-change-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { TeacherPick } from "../pickers/teacher-pick";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { teacherTone } from "../shared/teacher-tone";
import { ChangePreview } from "./change-preview";
import { ScopeField, type ScopeOption } from "./scope-field";
import { useSlotOptions } from "./use-slot-dialog-data";
import { useSlotChange } from "./use-slot-change";

const { color, radius, type } = ergEnterpriseTokens;
const dd = (date: string) => formatDateVi(date).slice(0, 5);
const initialsOf = (name: string) => name.split(/[\s.]+/).filter(Boolean).slice(-2).map((word) => word[0]?.toLocaleUpperCase("vi")).join("");

type Props = { event: TeachingCalendarEvent; onClose: () => void };

function Person({ id, initials, name, note }: { id: string; initials: string; name: string; note?: string }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
      <Avatar sx={{ bgcolor: teacherTone(id).background, color: teacherTone(id).text, height: 28, ...type.microStrong, width: 28 }}>{initials}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={type.smallStrong}>{name}{note ? <Box component="span" sx={{ color: color.textMuted, fontWeight: "fontWeightRegular" }}> · {note}</Box> : null}</Box>
      </Box>
    </Stack>
  );
}

/** Dialog «Đổi giáo viên» (board AdminTeacherSwap) cho tiet da xuat ban: gui `swapTeachingScheduleTeacher`, xem truoc bang dryRun. */
export function TeacherSwapDialog({ event, onClose }: Props) {
  const [scope, setScope] = useState<ScopeState>({ dates: [], kind: "THIS_ONLY" });
  const [reason, setReason] = useState<SwapReason | null>(null);
  const [note, setNote] = useState("");
  const [teacher, setTeacher] = useState<{ id: string; name: string } | null>(null);
  const options = useSlotOptions(event, event.date, event.periodStart);
  const current = mainTeacherOf(event);
  const candidates = (options.data?.teachers ?? []).filter((item) => item.teacherId !== current?.userId);
  const picked = candidates.find((item) => item.teacherId === teacher?.id);
  const input = teacher && scopeReady(scope) && note.length <= NOTE_MAX ? swapInput(event, scope, teacher.id, reason, note) : null;
  const change = useSlotChange("swap", input, swapTeachingScheduleTeacher, onClose);
  const weekday = weekdayName(weekdayIndex(event.date));
  const count = change.affected === undefined ? "" : ` (${change.affected} tiết)`;
  const scopes: ScopeOption[] = [
    { kind: "THIS_ONLY", sub: `Dạy thay ${dd(event.date)} · từ tuần sau ${current?.displayName ?? "giáo viên cũ"} dạy lại`, title: "Chỉ tiết này" },
    { kind: "FROM_DATE_TO_END", sub: `Mọi ${weekday} tiết ${event.periodStart} của ${event.className} trong đợt${scope.kind === "FROM_DATE_TO_END" ? count : ""}`, title: `Từ ${dd(event.date)} đến hết đợt` },
    { kind: "SELECTED_DATES", sub: "Ví dụ: giáo viên nghỉ dài, chọn từng ngày", title: "Chọn ngày…" },
  ];
  const blocked = change.previewState.kind === "blocked";
  const after = teacher ? [
    picked?.classAccess === "NEW" ? `${teacher.name} được cấp quyền lớp ${event.className}; tiết hiện trong lịch dạy của ${teacher.name}.` : `Tiết hiện trong lịch dạy của ${teacher.name}.`,
    `Tiết này bỏ khỏi lịch của ${current?.displayName ?? "giáo viên cũ"}.`,
    `Báo cho cả 2 giáo viên và trường.`,
  ] : [];

  return (
    <ErgDialog
      actions={(
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton disabled={!input || blocked || Boolean(change.previewError) || change.previewLoading} loading={change.saving} onClick={change.submit} variant="contained">Đổi giáo viên</ErgButton>
        </>
      )}
      description={`${event.className} · ${weekday} ${dd(event.date)} · Tiết ${event.periodStart} (${event.startTime} – ${event.endTime}) · ${event.schoolName}`}
      maxWidth={false} onClose={onClose} open sx={{ "& .MuiDialog-paper": { maxWidth: 480 } }} title="Đổi giáo viên"
    >
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", bgcolor: color.surfaceMuted, borderRadius: `${radius.control}px`, px: 1.5, py: 1.25 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}><Person id={current?.userId ?? ""} initials={initialsOf(current?.displayName ?? "")} name={current?.displayName ?? "—"} note="đang dạy" /></Box>
          <Box aria-hidden sx={{ color: color.textMuted, ...type.pageLead }}>→</Box>
          {teacher ? <Person id={teacher.id} initials={picked?.initials ?? initialsOf(teacher.name)} name={teacher.name} /> : <Typography sx={{ color: color.textMuted, ...type.small }}>Chọn giáo viên mới</Typography>}
        </Stack>
        <ScopeField onChange={setScope} options={scopes} scope={scope} />
        <Stack spacing={0.75}>
          <Typography sx={{ color: color.textSecondary, ...type.noteMedium }}>Lý do</Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {SWAP_REASONS.map((item) => {
              const on = reason === item.value;
              return (
                <Chip
                  aria-pressed={on} clickable key={item.value} label={item.label} onClick={() => setReason(on ? null : item.value)} variant="outlined"
                  sx={{ bgcolor: on ? scheduleTokens.published.bg : undefined, borderColor: on ? color.primary : color.border, color: on ? scheduleTokens.published.text : color.textSecondary, height: 32, ...(on ? type.smallStrong : type.small) }}
                />
              );
            })}
          </Stack>
        </Stack>
        <Stack spacing={0.75}>
          <Typography sx={{ color: color.textSecondary, ...type.noteMedium }}>Giáo viên mới</Typography>
          {options.isPending ? <Typography sx={{ color: color.textMuted, ...type.small }}>Đang tải giáo viên…</Typography> : null}
          {options.isError ? <Typography color="error" role="alert" sx={type.small}>Không tải được danh sách giáo viên.</Typography> : null}
          {options.data ? <TeacherPick className={event.className} inDialog onClose={onClose} onSelect={(item) => item && setTeacher(item)} selectedId={teacher?.id} teachers={candidates} /> : null}
        </Stack>
        <ErgTextField compact helperText={`${note.length}/${NOTE_MAX}`} label="Ghi chú (không bắt buộc)" onChange={(e) => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: NOTE_MAX } }} value={note} />
        <ChangePreview error={change.previewError} loading={change.previewLoading} state={change.previewState} />
        {after.length ? (
          <Box role="status" sx={{ bgcolor: scheduleTokens.published.bg, borderRadius: `${radius.control}px`, color: scheduleTokens.published.text, px: 1.5, py: 1.25, ...type.note, lineHeight: 1.6 }}>
            <Box component="strong" sx={type.label}>Sau khi đổi:</Box>
            {after.map((line) => <Box key={line}>• {line}</Box>)}
          </Box>
        ) : null}
        {change.saveError ? <Typography color="error" role="alert" sx={type.note}>{change.saveError}</Typography> : null}
      </Stack>
    </ErgDialog>
  );
}
