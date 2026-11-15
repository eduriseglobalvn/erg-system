import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Tag = { bg: string; color: string; label: string };

/** Tag the tiet (6.8, 2.3-2): «Trùng GV» > «Nháp» > «Đã xuất bản» (khong «Đã giao»). */
export function mobileCardTag(event: TeachingCalendarEvent, clash: boolean): Tag {
  if (clash) return { bg: scheduleTokens.clash.bg, color: scheduleTokens.clash.text, label: "Trùng GV" };
  if (event.status === "DRAFT") return { bg: scheduleTokens.published.bg, color: scheduleTokens.published.text, label: "Nháp" };
  return { bg: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text, label: "Đã xuất bản" };
}

/** The tiet (6.8): cot gio bat dau/ket thuc, noi dung «mon · cap», «lop · phong», ten giao vien. */
export function AdminMobileCard({ event, onClick, tag }: { event: TeachingCalendarEvent; onClick: () => void; tag: Tag }) {
  const main = event.teachers.find((teacher) => teacher.role === "MAIN")?.displayName;
  return (
    <ButtonBase onClick={onClick} sx={{ alignItems: "stretch", bgcolor: tag.label === "Trùng GV" ? scheduleTokens.clash.bg : "background.paper", border: 1, borderColor: "divider", borderLeft: `4px ${event.status === "DRAFT" ? "dashed" : "solid"} ${tag.label === "Trùng GV" ? scheduleTokens.clash.edge : ergEnterpriseTokens.color.primary}`, borderRadius: "14px", gap: 1.5, p: 1.5, textAlign: "left", width: "100%" }}>
      <Box sx={{ color: "text.secondary", minWidth: 44, typography: "caption" }}>
        <Typography sx={{ color: "text.primary", typography: "subtitle2" }}>{event.startTime}</Typography>
        {event.endTime}
      </Box>
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography noWrap sx={{ typography: "subtitle2" }}>{[event.subjectName, event.levelName].filter(Boolean).join(" · ") || event.title}</Typography>
          <Chip label={tag.label} size="small" sx={{ bgcolor: tag.bg, color: tag.color }} />
        </Stack>
        <Typography sx={{ typography: "body2" }}>{[event.className, event.roomName].filter(Boolean).join(" · ")}</Typography>
        {main ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>{main}</Typography> : null}
      </Stack>
    </ButtonBase>
  );
}
