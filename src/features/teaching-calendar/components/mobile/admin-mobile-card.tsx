import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Tag = { bg: string; color: string; label: string };

const color = ergEnterpriseTokens.color;

/** Tag the tiet (6.8, 2.3-2): «Trùng GV» > «Nháp» > «Đã xuất bản» (khong «Đã giao»). Mau theo board: nhap xam, xuat ban xanh nhat, trung nen trang. */
export function mobileCardTag(event: TeachingCalendarEvent, clash: boolean): Tag {
  if (clash) return { bg: "background.paper", color: scheduleTokens.clash.text, label: "Trùng GV" };
  if (event.status === "DRAFT") return { bg: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text, label: "Nháp" };
  return { bg: scheduleTokens.published.bg, color: scheduleTokens.published.text, label: "Đã xuất bản" };
}

/** Vien/nen the theo board: xuat ban = vien trai 4px primary; nhap = nen nhat + vien net dut; trung = nen hong + vien hong dam. */
function cardSx(event: TeachingCalendarEvent, clash: boolean) {
  if (clash) return { bgcolor: scheduleTokens.clash.bg, border: `1px solid ${scheduleTokens.clash.line}` };
  if (event.status === "DRAFT") return { bgcolor: color.surfaceMuted, border: `1px dashed ${color.textSoft}` };
  return { bgcolor: "background.paper", border: `1px solid ${color.border}`, borderLeft: `4px solid ${color.primary}` };
}

/** The tiet (6.8): cot gio 52px, noi dung «mon · cap» + tag, «lop · phong», ten giao vien. */
export function AdminMobileCard({ event, onClick, tag }: { event: TeachingCalendarEvent; onClick: () => void; tag: Tag }) {
  const main = event.teachers.find((teacher) => teacher.role === "MAIN")?.displayName;
  return (
    <ButtonBase onClick={onClick} sx={{ alignItems: "flex-start", borderRadius: `${ergEnterpriseTokens.radius.card}px`, gap: "10px", justifyContent: "flex-start", p: 1.5, textAlign: "left", width: "100%", ...cardSx(event, tag.label === "Trùng GV") }}>
      <Box sx={{ typography: "subtitle2", fontSize: "0.8125rem", color: color.textSecondary, flex: "0 0 52px", width: 52 }}>
        {event.startTime}
        <Box sx={{ typography: "body2", color: color.textMuted, fontSize: "0.6875rem" }}>{event.endTime}</Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", gap: "6px", justifyContent: "space-between" }}>
          <Box component="span" sx={{ typography: "subtitle2" }}>{[event.subjectName, event.levelName].filter(Boolean).join(" · ") || event.title}</Box>
          <Box component="span" sx={{ typography: "subtitle2", bgcolor: tag.bg, borderRadius: "999px", color: tag.color, flexShrink: 0, fontSize: "0.6875rem", height: 18, lineHeight: "16px", px: 1, py: "1px", whiteSpace: "nowrap" }}>{tag.label}</Box>
        </Box>
        <Box sx={{ color: color.textSecondary, fontSize: "0.75rem" }}>{[event.className, event.roomName].filter(Boolean).join(" · ")}</Box>
        {main ? <Box sx={{ color: color.textMuted, fontSize: "0.75rem" }}>{main}</Box> : null}
      </Box>
    </ButtonBase>
  );
}
