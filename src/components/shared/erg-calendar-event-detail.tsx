import type { ReactNode } from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import type { ErgCalendarEvent } from "./erg-calendar-types";
import { estimatePeriodCount } from "./erg-calendar-formatters";
import { eventDetailHeaderSx, eventDetailPaperSx } from "./erg-calendar-workspace-styles";

export function EventDetailPopover({
  anchorEl,
  event,
  onClose,
  renderActions,
}: {
  anchorEl: HTMLElement | null;
  event: ErgCalendarEvent | null;
  onClose: () => void;
  renderActions?: (event: ErgCalendarEvent) => ReactNode;
}) {
  const open = Boolean(anchorEl && event);
  const startTime = event?.startTime ?? event?.time ?? event?.duration.split(" - ")[0] ?? "";
  const endTime = event?.endTime ?? event?.duration.split(" - ")[1] ?? "";

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: eventDetailPaperSx } }}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
    >
      {event ? (
        <Box sx={{ minWidth: 390 }}>
          <Box sx={eventDetailHeaderSx(event.tone)}>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ color: "#FFFFFF", fontSize: 14.5, fontWeight: 900 }}>
                {event.title}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.86)", fontSize: 12.5, fontWeight: 700, mt: 0.4 }}>
                {event.className ?? event.grade ?? "Lịch giảng dạy"} · {event.location}
              </Typography>
            </Box>
            <Box sx={{ color: "#FFFFFF", flexShrink: 0, textAlign: "right" }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, opacity: 0.82 }}>Phòng học</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{event.location}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: "1fr 1fr", p: 2 }}>
            <DetailItem icon={<CalendarTodayRoundedIcon />} label="Ngày diễn ra" value={dayjs(event.date).format("dddd, DD/MM/YYYY")} />
            <DetailItem icon={<SchoolRoundedIcon />} label="Trường" value={event.school ?? "ERG Center"} />
            <DetailItem icon={<AccessTimeRoundedIcon />} label="Bắt đầu" value={startTime} />
            <DetailItem icon={<AccessTimeRoundedIcon />} label="Kết thúc" value={endTime} />
            <DetailItem icon={<ClassRoundedIcon />} label="Số tiết" value={`${event.periodCount ?? estimatePeriodCount(startTime, endTime)} tiết`} />
            <DetailItem icon={<GroupsRoundedIcon />} label="Lớp" value={event.className ?? event.attendees} />
            <DetailItem icon={<SchoolRoundedIcon />} label="Môn học" value={event.subject ?? event.title} />
            <DetailItem icon={<PersonRoundedIcon />} label="Giáo viên phụ trách" value={event.teacher ?? "Chưa phân công"} />
          </Box>

          <Divider />
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", p: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: 800 }}>{event.attendees}</Typography>
              <Typography sx={{ color: "#6B778C", fontSize: 12.25, mt: 0.25 }}>
                {renderActions ? "Quản lý phòng học, ghi chú hoặc hủy sự kiện." : "Lịch đã được trung tâm xuất bản và chỉ đọc trên LMS."}
              </Typography>
            </Box>
            {renderActions ? renderActions(event) : null}
          </Box>
        </Box>
      ) : null}
    </Popover>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ borderBottom: "1px solid #EEF2F7", display: "grid", gap: 1, gridTemplateColumns: "28px minmax(0, 1fr)", minHeight: 72, p: 1.25 }}>
      <Box sx={{ alignItems: "center", color: "#4B5565", display: "flex", justifyContent: "center", pt: 0.2, "& svg": { fontSize: 19 } }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: 850 }}>{label}</Typography>
        <Typography noWrap sx={{ color: "#6B778C", fontSize: 12.5, fontWeight: 600, mt: 0.55 }}>{value}</Typography>
      </Box>
    </Box>
  );
}
