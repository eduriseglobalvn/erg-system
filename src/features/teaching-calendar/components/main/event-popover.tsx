import { useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { popoverConflictLine } from "@/features/teaching-calendar/domain/conflict-copy";
import { dayLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";
import type { ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { teacherTone } from "../shared/teacher-tone";

const color = ergEnterpriseTokens.color;

type Props = {
  anchorEl: HTMLElement | null;
  canDelete: boolean;
  conflicts: readonly ScheduleConflict[];
  event: TeachingCalendarEvent | null;
  onClose: () => void;
  repeatUntil?: string;
  onDelete: (event: TeachingCalendarEvent) => Promise<void>;
  /** `edit` -> trang xep lich focus o; `copy` -> mo o ke ben voi du lieu copy; `teacher` -> doi GV; `move` -> che do keo. */
  onOpenSchedule: (event: TeachingCalendarEvent, intent: "edit" | "copy" | "teacher" | "move") => void;
};

type DetailsProps = Omit<Props, "anchorEl" | "event"> & { event: TeachingCalendarEvent; /** Ngay cuoi cua dot lap (yyyy-MM-dd) khi biet; dot da xuat ban chua co trong hop dong su kien. */ repeatUntil?: string; showClose?: boolean };

/** Noi dung chi tiet tiet (6.1): dung chung cho popover desktop va bottom sheet mobile (6.8). */
export function EventDetails({ canDelete, conflicts, event, onClose, onDelete, onOpenSchedule, repeatUntil, showClose = true }: DetailsProps) {
  const [confirm, setConfirm] = useState(false);
  const main = event.teachers.find((teacher) => teacher.role === "MAIN")?.displayName;
  const assistant = event.teachers.find((teacher) => teacher.role === "ASSISTANT")?.displayName;
  const own = conflicts.filter((conflict) => conflict.mine.eventId === event.id && conflict.severity === "ERROR");
  const draft = event.status === "DRAFT";
  return (
    <>
      <Box sx={{ color: color.textSecondary, display: "flex", flexDirection: "column", fontSize: "0.8125rem", gap: 1 }}>
        <Stack direction="row" spacing={0.5} sx={{ color: color.textMuted, justifyContent: "flex-end" }}>
          <ErgIconButton label="Sửa" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "edit")} size="small"><EditOutlinedIcon fontSize="small" /></ErgIconButton>
          <ErgIconButton label="Nhân bản" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "copy")} size="small"><ContentCopyOutlinedIcon fontSize="small" /></ErgIconButton>
          {canDelete ? <ErgIconButton label="Xoá" onClick={() => setConfirm(true)} size="small"><DeleteOutlinedIcon fontSize="small" /></ErgIconButton> : null}
          {showClose ? <ErgIconButton label="Đóng" onClick={onClose} size="small"><CloseIcon fontSize="small" /></ErgIconButton> : null}
        </Stack>
        <Box sx={{ display: "flex", gap: "10px" }}>
          <Box aria-hidden component="span" sx={{ bgcolor: teacherTone(event.teachers.find((teacher) => teacher.role === "MAIN")?.userId).border, borderRadius: "4px", flexShrink: 0, height: 12, mt: "4px", width: 12 }} />
          <Box>
            <Box sx={{ color: color.text, typography: "h5", fontSize: "1rem" }}>{[event.className, event.subjectName, event.levelName].filter(Boolean).join(" · ")}</Box>
            <Box>{dayLabel(event.date)} · Tiết {event.periodStart} · {event.startTime} – {event.endTime}</Box>
            {repeatUntil ? <Box>Hằng tuần, đến {formatDateVi(repeatUntil)}</Box> : null}
          </Box>
        </Box>
        <Box>{[event.schoolName, event.roomName].filter(Boolean).join(" · ")}</Box>
        <Box>GV: <Box component="strong" sx={{ color: color.text, typography: "subtitle2", fontSize: "0.8125rem" }}>{main ?? "—"}</Box> · Trợ giảng: {assistant ?? "—"}</Box>
        {own.map((conflict) => {
          const text = conflict.kind === "TRAVEL_TIME" && conflict.travel
            ? `Không kịp di chuyển: tiết trước ở ${conflict.other?.schoolName ?? conflict.travel.fromSchoolName}, hết ${conflict.travel.previousEndTime} → chỉ ${conflict.travel.gapMinutes}′ (cần ≥ ${conflict.travel.requiredMinutes}′)`
            : `Trùng: ${popoverConflictLine(conflict)}${conflict.other?.batchLabel ? ` (${conflict.other.batchLabel}, ${conflict.other.batchStatus === "PUBLISHED" ? "đã xuất bản" : "nháp"})` : ""}`;
          return <Box key={conflict.id} sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: scheduleTokens.clash.text, px: "10px", py: 1 }}>{text}</Box>;
        })}
        <Box sx={{ alignItems: "center", borderTop: `1px solid ${color.divider}`, display: "flex", gap: 1, pt: 1 }}>
          <Link component="button" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "teacher")} sx={{ typography: "subtitle2", fontSize: "0.8125rem" }} type="button" underline="none">Đổi giáo viên</Link>
          <Link component="button" color="inherit" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "move")} sx={{ fontSize: "0.8125rem" }} type="button" underline="none">Dời tiết</Link>
          {draft ? <Box component="span" sx={{ bgcolor: scheduleTokens.neutral.bg, borderRadius: "999px", color: scheduleTokens.neutral.text, fontSize: "0.75rem", ml: "auto", px: 1, py: "1px" }}>Nháp</Box> : null}
        </Box>
      </Box>
      <ErgConfirmDialog
        confirmLabel="Xoá" description="Hành động này sẽ huỷ tiết khỏi lịch giáo viên." destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); void onDelete(event).then(onClose).catch(() => undefined /* loi da co toast toan cuc (MutationCache) */); }}
        open={confirm} title="Xoá tiết này?"
      />
    </>
  );
}

/** Popover su kien (6.1): thanh icon Sua / Nhan ban / Xoa / Dong, thong tin tiet, khoi do khi xung dot, link Doi giao vien / Doi tiet. */
export function EventPopover({ anchorEl, event, ...rest }: Props) {
  if (!event) return null;
  return (
    <Popover anchorEl={anchorEl} onClose={rest.onClose} open={Boolean(anchorEl)} slotProps={{ paper: { sx: { borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, px: 2, py: "14px", width: 320 } } }}>
      <EventDetails event={event} {...rest} />
    </Popover>
  );
}
