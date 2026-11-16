import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { schoolPlainName } from "../../domain/schedule-copy";
import type { TeacherRoleFilter } from "../../domain/teacher-events";
import { toMinutes } from "../../domain/teacher-week-model";
import { TeacherRoleToggle } from "./teacher-calendar-extras";
import { LEAVE, MEDIUM, SEMIBOLD, SIZE, t } from "./teacher-board-styles";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const pill = { alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.chip}px`, color: t.schedule.published.text, display: "inline-flex", fontSize: SIZE.chip, fontWeight: SEMIBOLD, height: 18, px: 1 } as const;

type TabsProps = { days: readonly string[]; events: readonly TeachingCalendarEvent[]; leave: ReadonlyMap<string, string>; onSelect: (day: string) => void; selected: string };

/** Thanh 6 ngay (board mobile): o 62 px, «T2 · 09 · 1 tiết / nghỉ phép / trống». */
export function TeacherDayTabs({ days, events, leave, onSelect, selected }: TabsProps) {
  return (
    <Box aria-label="Ngày trong tuần" role="tablist" sx={{ display: "grid", gap: "4px", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", px: 1.5, py: "6px" }}>
      {days.map((day) => {
        const count = events.filter((event) => event.date === day && event.status !== "CANCELLED").length;
        const active = day === selected;
        const off = leave.has(day);
        return (
          <ButtonBase
            aria-selected={active} key={day} onClick={() => onSelect(day)} role="tab"
            sx={{ bgcolor: active ? t.color.primary : off ? LEAVE.bg : t.color.surface, borderRadius: "12px", color: active ? t.color.surface : off ? LEAVE.text : t.color.text, flexDirection: "column", gap: "1px", height: 62, justifyContent: "center" }}
          >
            <span style={{ fontSize: SIZE.chip }}>{DOW[new Date(`${day}T00:00:00Z`).getUTCDay()]}</span>
            <span style={{ fontSize: "1rem", fontWeight: SEMIBOLD }}>{day.slice(8)}</span>
            <span style={{ fontSize: SIZE.micro }}>{off ? "nghỉ phép" : count ? `${count} tiết` : "trống"}</span>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

type ListProps = { events: readonly TeachingCalendarEvent[]; leaveDay: boolean; newBatchIds: ReadonlySet<string>; now: Date; onOpen: (event: TeachingCalendarEvent, anchor: HTMLElement) => void };

function EventCard({ event, isNew, next, now, onOpen }: { event: TeachingCalendarEvent; isNew: boolean; next: boolean; now: Date; onOpen: ListProps["onOpen"] }) {
  const assistant = event.myRole === "ASSISTANT";
  const cancelled = event.status === "CANCELLED";
  const done = new Date(event.endAt) < now;
  const left = Math.ceil((new Date(event.startAt).getTime() - now.getTime()) / 60_000);
  const place = [event.roomName, event.schoolName].filter(Boolean).join(" · ");
  const withLine = assistant ? `Dạy chính: ${event.mainTeacherName ?? "—"}` : event.assistantName ? `Trợ giảng: ${event.assistantName}` : "";
  const tag = (label: string): ReactNode => <Box component="span" sx={pill}>{label}</Box>;
  return (
    <ButtonBase
      aria-label={`Tiết ${event.periodStart}, ${event.className}`} onClick={(click) => onOpen(event, click.currentTarget)}
      sx={{
        alignItems: "center", bgcolor: done || cancelled ? t.color.surfaceMuted : t.color.surface, border: next ? `2px solid ${t.color.primary}` : `1px solid ${done || cancelled ? t.color.divider : t.color.border}`,
        borderLeft: assistant ? `3px dashed ${t.color.primary}` : undefined, borderRadius: `${t.radius.card}px`, display: "flex", gap: "10px", justifyContent: "flex-start", minHeight: 44, opacity: done && !cancelled ? 0.6 : 1, p: 1.5, textAlign: "left", textDecoration: cancelled ? "line-through" : "none", width: "100%",
      }}
    >
      <Box sx={{ flex: "0 0 56px", width: 56 }}>
        <Box sx={{ fontSize: SIZE.panel, fontWeight: SEMIBOLD }}>Tiết {event.periodStart}</Box>
        <Box sx={{ color: t.color.textMuted, fontSize: SIZE.chip }}>{event.startTime}–{event.endTime}</Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ alignItems: "center", display: "flex", fontSize: "0.9375rem", fontWeight: SEMIBOLD, gap: "6px" }}>
          {event.className}
          {next && left > 0 && left <= 60 ? <Box component="span" sx={{ color: t.color.primaryHover, fontSize: SIZE.title, fontWeight: MEDIUM }}>· còn {left} phút</Box> : null}
          {assistant ? tag("Trợ giảng") : null}{isNew ? tag("Mới") : null}{cancelled ? tag("Đã huỷ") : null}
        </Box>
        <Box sx={{ color: t.color.textSecondary, fontSize: SIZE.title }}>{place || schoolPlainName(event.schoolName)}</Box>
        {withLine ? <Box sx={{ color: t.color.textMuted, fontSize: SIZE.title }}>{withLine}</Box> : null}
      </Box>
    </ButtonBase>
  );
}

/** Danh sach tiet cua ngay chon, chia «Sáng» / «Chiều»; the «sắp tới» vien primary 2 px, tiet da qua nhat mau. */
export function TeacherDayList({ events, leaveDay, newBatchIds, now, onOpen }: ListProps) {
  const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const nextId = sorted.find((event) => event.status !== "CANCELLED" && new Date(event.startAt) > now)?.id;
  const sections: [string, TeachingCalendarEvent[]][] = [["Sáng", sorted.filter((event) => toMinutes(event.startTime) < 720)], ["Chiều", sorted.filter((event) => toMinutes(event.startTime) >= 720)]];
  return (
    <Box aria-label="Tiết hôm nay" component="section" sx={{ display: "flex", flexDirection: "column", gap: "6px", overflow: "auto", px: 2, pb: 1.5, pt: "4px" }}>
      {leaveDay ? <Box sx={{ bgcolor: LEAVE.bg, borderRadius: `${t.radius.card}px`, color: LEAVE.text, fontSize: SIZE.panel, fontWeight: SEMIBOLD, px: 1.5, py: "10px" }}>Nghỉ phép · đã duyệt</Box> : null}
      {!sorted.length && !leaveDay ? <Typography sx={{ color: t.color.textMuted, py: 2, textAlign: "center", typography: "body2" }}>Không có lịch dạy trong ngày này.</Typography> : null}
      {sections.filter(([, list]) => list.length).map(([title, list], index) => (
        <Box key={title} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Typography component="h2" sx={{ color: t.color.textSecondary, fontSize: SIZE.panel, fontWeight: SEMIBOLD, mt: index ? 1 : "6px" }}>{title}</Typography>
          {list.map((event) => <EventCard event={event} isNew={Boolean(event.batchId && newBatchIds.has(event.batchId))} key={event.id} next={event.id === nextId} now={now} onOpen={onOpen} />)}
        </Box>
      ))}
      {sorted.some((event) => event.myRole === "ASSISTANT") ? (
        <Typography sx={{ color: t.color.textMuted, fontSize: SIZE.title, lineHeight: 1.5, mt: "6px" }}>Tiết trợ giảng có viền trái nét đứt và ghi tên giáo viên dạy chính. Tiết dạy chính có trợ giảng thì ghi “Trợ giảng: &lt;tên&gt;”.</Typography>
      ) : null}
    </Box>
  );
}

type PageProps = {
  counts: { all: number; assistant: number; main: number };
  days: readonly string[];
  events: readonly TeachingCalendarEvent[];
  leave: ReadonlyMap<string, string>;
  newBatchIds: ReadonlySet<string>;
  notice: ReactNode;
  now: Date;
  onOpen: ListProps["onOpen"];
  onRole: (role: TeacherRoleFilter) => void;
  onSelect: (day: string) => void;
  role: TeacherRoleFilter;
  selected: string;
};

/** Man mobile theo board: 6 ngay, banner «N tiết mới», [vai tro], danh sach tiet cua ngay chon. */
export function TeacherMobileDay({ counts, days, events, leave, newBatchIds, notice, now, onOpen, onRole, onSelect, role, selected }: PageProps) {
  return (
    <>
      <TeacherDayTabs days={days} events={events} leave={leave} onSelect={onSelect} selected={selected} />
      {notice}
      <Box sx={{ mx: 2, mt: "2px" }}><TeacherRoleToggle counts={counts} fullWidth onChange={onRole} value={role} /></Box>
      <TeacherDayList events={events.filter((event) => event.date === selected)} leaveDay={leave.has(selected)} newBatchIds={newBatchIds} now={now} onOpen={onOpen} />
    </>
  );
}
