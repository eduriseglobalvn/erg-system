import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
      <Box>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
          <ErgIconButton label="Sửa" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "edit")} size="small"><EditOutlinedIcon fontSize="small" /></ErgIconButton>
          <ErgIconButton label="Nhân bản" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "copy")} size="small"><ContentCopyOutlinedIcon fontSize="small" /></ErgIconButton>
          {canDelete ? <ErgIconButton label="Xoá" onClick={() => setConfirm(true)} size="small"><DeleteOutlinedIcon fontSize="small" /></ErgIconButton> : null}
          {showClose ? <ErgIconButton label="Đóng" onClick={onClose} size="small"><CloseIcon fontSize="small" /></ErgIconButton> : null}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ typography: "subtitle1" }}>{[event.className, event.subjectName, event.levelName].filter(Boolean).join(" · ")}</Typography>
          {draft ? <Chip label="Nháp" size="small" /> : null}
        </Stack>
        <Typography sx={{ typography: "body2" }}>{dayLabel(event.date)} · Tiết {event.periodStart} · {event.startTime} – {event.endTime}</Typography>
        {repeatUntil ? <Typography sx={{ color: "text.secondary", typography: "body2" }}>Hằng tuần, đến {formatDateVi(repeatUntil)}</Typography> : null}
        <Typography sx={{ color: "text.secondary", typography: "body2" }}>{[event.schoolName, event.roomName].filter(Boolean).join(" · ")}</Typography>
        <Typography sx={{ alignItems: "center", display: "flex", gap: 0.75, typography: "body2" }}>{main ? <Box aria-hidden component="span" sx={{ bgcolor: teacherTone(event.teachers.find((teacher) => teacher.role === "MAIN")?.userId).border, borderRadius: "50%", flexShrink: 0, height: 8, width: 8 }} /> : null}GV: {main ?? "—"} · Trợ giảng: {assistant ?? "—"}</Typography>
        {own.map((conflict) => {
          const text = conflict.kind === "TRAVEL_TIME" && conflict.travel
            ? `Không kịp di chuyển: tiết trước ở ${conflict.other?.schoolName ?? conflict.travel.fromSchoolName}, hết ${conflict.travel.previousEndTime} → chỉ ${conflict.travel.gapMinutes}′ (cần ≥ ${conflict.travel.requiredMinutes}′)`
            : `Trùng: ${popoverConflictLine(conflict)}${conflict.other?.batchLabel ? ` (${conflict.other.batchLabel}, ${conflict.other.batchStatus === "PUBLISHED" ? "đã xuất bản" : "nháp"})` : ""}`;
          return <Box key={conflict.id} sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: "6px", color: scheduleTokens.clash.text, mt: 1, p: 1, typography: "caption" }}>{text}</Box>;
        })}
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Link component="button" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "teacher")} sx={{ typography: "caption" }} type="button" underline="hover">Đổi giáo viên</Link>
          <Link component="button" disabled={!event.batchId} onClick={() => onOpenSchedule(event, "move")} sx={{ typography: "caption" }} type="button" underline="hover">Dời tiết</Link>
        </Stack>
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
    <Popover anchorEl={anchorEl} onClose={rest.onClose} open={Boolean(anchorEl)} slotProps={{ paper: { sx: { borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, p: 1.5, width: 360 } } }}>
      <EventDetails event={event} {...rest} />
    </Popover>
  );
}
