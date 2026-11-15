import { Fragment } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";

import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { dayLabel } from "../../domain/schedule-copy";
import { SEMIBOLD, SIZE, t } from "./teacher-board-styles";

type Props = { anchor: HTMLElement | null; event: TeachingCalendarEvent | null; isNew: boolean; onClose: () => void };

const pill = { alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.chip}px`, color: t.schedule.published.text, display: "inline-flex", fontSize: SIZE.chip, fontWeight: SEMIBOLD, height: 18, px: 1 } as const;

/** Popover chi tiet tiet day (board «TG 9A3, Thứ 5 tiết 4»): 300 px, ten lop, vai tro, nguoi day chinh / tro giang, «Mở lớp học →». */
export function TeacherEventPopover({ anchor, event, isNew, onClose }: Props) {
  const assistant = event?.myRole === "ASSISTANT";
  const rows: [string, string][] = event ? [
    ["Vai trò", assistant ? "Trợ giảng" : "Dạy chính"],
    ...(assistant && event.mainTeacherName ? [["Dạy chính", event.mainTeacherName] as [string, string]] : []),
    ...(!assistant && event.assistantName ? [["Trợ giảng", event.assistantName] as [string, string]] : []),
  ] : [];
  return (
    <Popover
      anchorEl={anchor} anchorOrigin={{ horizontal: "right", vertical: "top" }} onClose={onClose} open={Boolean(anchor && event)}
      slotProps={{ paper: { sx: { borderRadius: `${t.radius.card}px`, boxShadow: t.shadow.float, fontSize: SIZE.panel, p: 2, width: 300 } } }}
    >
      {event ? (
        <Box aria-label={`${assistant ? "TG " : ""}${event.className}, ${dayLabel(event.date)} tiết ${event.periodStart}`} role="dialog" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Typography sx={{ typography: "h5" }}>{event.className} · Tiết {event.periodStart}</Typography>
            {assistant ? <Box component="span" sx={pill}>Trợ giảng</Box> : null}
            {isNew ? <Box component="span" sx={pill}>Mới</Box> : null}
            {event.status === "CANCELLED" ? <Box component="span" sx={pill}>Đã huỷ</Box> : null}
          </Box>
          <Box sx={{ color: t.color.textSecondary }}>{dayLabel(event.date)} · {event.startTime} – {event.endTime}<br />{[event.roomName, event.schoolName].filter(Boolean).join(" · ")}</Box>
          <Box sx={{ borderTop: `1px solid ${t.color.divider}`, display: "grid", gap: "4px 8px", gridTemplateColumns: "96px 1fr", pt: 1 }}>
            {rows.map(([label, value]) => <Fragment key={label}><span style={{ color: t.color.textMuted }}>{label}</span><span>{value}</span></Fragment>)}
          </Box>
          <Link href={`${teacherPath("/attendance")}?classId=${event.classId}&date=${event.date}&scheduleId=${event.id}`} sx={{ color: t.color.primary, fontWeight: SEMIBOLD, textDecoration: "none" }} underline="none">Mở lớp học →</Link>
        </Box>
      ) : null}
    </Popover>
  );
}
