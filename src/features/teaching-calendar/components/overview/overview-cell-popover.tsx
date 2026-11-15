import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import { addDaysToDate, conflictKindName, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import type { OverviewChip, OverviewConflict } from "@/features/teaching-calendar/domain/overview-model";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ink, tone, type } from "./overview-styles";

type Props = {
  anchorEl: HTMLElement | null;
  chip: OverviewChip | null;
  conflict?: OverviewConflict;
  onChangeTeacher: () => void;
  onClose: () => void;
  onEdit: () => void;
  schoolName: string;
  subjectName?: string | null;
  weekStart: string;
};

/** Cau giai thich trung gio theo board 6.6: «Q.Vương cũng dạy 8A2 ở THCS Nguyễn Du cùng giờ.» */
export function conflictSentence(conflict: OverviewConflict): string {
  const { other } = conflict;
  if (conflict.kind === "TEACHER_TIME" && other) return `${other.teacherName} cũng dạy ${other.className} ở ${other.schoolName ?? other.schoolShortName} cùng giờ.`;
  return conflictLines(conflict as never).otherLine;
}

/** Popover khung gio (6.6, board AdminOverview «Chi tiết khung giờ»): rong 320, bo card, bong `float`. */
export function OverviewCellPopover({ anchorEl, chip, conflict, onChangeTeacher, onClose, onEdit, schoolName, subjectName, weekStart }: Props) {
  const cell = chip?.cell;
  const date = chip ? addDaysToDate(weekStart, chip.weekday - 1) : "";
  const periods = chip ? (chip.firstPeriod === chip.lastPeriod ? `${chip.firstPeriod}` : `${chip.firstPeriod}–${chip.lastPeriod}`) : "";
  const rows: Array<[string, string]> = cell ? [
    ["Lớp", cell.className ?? ""], ["Phòng", cell.roomName ?? ""], ["Giáo viên", cell.teacherName ?? ""], ["Trợ giảng", cell.assistantName || "Không có"],
    ["Môn", subjectName ?? ""], ["Trạng thái", [cell.status === "DRAFT" ? "Nháp" : "Đã áp dụng", cell.batchLabel].filter(Boolean).join(" · ")],
  ] : [];
  return (
    <Popover
      anchorEl={anchorEl} anchorOrigin={{ horizontal: "left", vertical: "bottom" }} onClose={onClose} open={Boolean(anchorEl && chip)}
      slotProps={{ paper: { "aria-label": "Chi tiết khung giờ", role: "dialog", sx: { borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, mt: 0.5, width: 320 } } }}
    >
      <Box sx={{ ...type(13), display: "flex", flexDirection: "column", gap: "10px", p: "14px" }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <Box component="strong" sx={type(14, 600)}>{weekdayName(chip?.weekday ?? 1)} {formatDateVi(date).slice(0, 5)} · {chip?.startTime} – {chip?.endTime}</Box>
            <Box component="span" sx={{ ...type(12), color: ink.textMuted }}>{schoolName} · Tiết {periods} ({chip?.session === "MORNING" ? "sáng" : "chiều"})</Box>
          </Box>
          <ButtonBase aria-label="Đóng" onClick={onClose} sx={{ ...type(18), color: ink.textMuted, height: 32, m: "-6px -6px 0 0", width: 32 }}>×</ButtonBase>
        </Box>
        {conflict ? (
          <Box sx={{ ...type(12), bgcolor: tone.clash.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: tone.clash.text, px: "10px", py: 1 }}>
            <Box component="strong" sx={type(12, 600)}>{conflict.kind === "TEACHER_TIME" ? "Trùng giờ" : conflictKindName(conflict.kind)}</Box>{conflictSentence(conflict) ? ` — ${conflictSentence(conflict)}` : ""}
          </Box>
        ) : null}
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ display: "grid", gap: 1, gridTemplateColumns: "88px 1fr" }}>
            <Box component="span" sx={{ color: ink.textMuted }}>{label}</Box>
            <Box component="span" sx={type(13, 500)}>{value}</Box>
          </Box>
        ))}
        <Box sx={{ borderTop: `1px solid ${ink.divider}`, display: "flex", gap: 1, pt: "10px" }}>
          <ErgButton onClick={onEdit} sx={{ ...type(14, 500), color: ink.text, flex: 1, height: 36 }} variant="outlined">Sửa tiết</ErgButton>
          <ErgButton onClick={onChangeTeacher} sx={{ flex: 1, height: 36 }} variant="text">Đổi giáo viên</ErgButton>
        </Box>
      </Box>
    </Popover>
  );
}
