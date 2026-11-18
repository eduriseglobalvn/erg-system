import type { MouseEvent } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { schoolPlainName } from "../../domain/schedule-copy";
import { eventBox, eventTone, GRID, hourLabel, hourRange, type EventTone } from "../../domain/teacher-week-model";
import { CARD, LEAVE, SEMIBOLD, SIZE, t } from "./teacher-board-styles";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const stripe = `repeating-linear-gradient(135deg, ${t.color.surfaceMuted} 0 6px, ${t.schedule.neutral.bg} 6px 12px)`;
const COLUMNS = (days: number) => `56px repeat(${days}, minmax(0, 1fr))`;

const TONES: Record<EventTone, object> = {
  assistant: { bgcolor: t.color.surface, border: `1px dashed ${t.color.primary}`, borderLeft: `3px dashed ${t.color.primary}`, color: t.schedule.published.text },
  neutral: { bgcolor: t.schedule.neutral.bg, borderLeft: `3px solid ${t.color.textSoft}`, color: t.color.textSecondary },
  primary: { bgcolor: t.schedule.published.bg, borderLeft: `3px solid ${t.color.primary}`, color: t.schedule.published.text },
};

export type TeacherGridProps = {
  days: readonly string[];
  events: readonly TeachingCalendarEvent[];
  hasAssistant: boolean;
  leave: ReadonlyMap<string, "FULL" | "AM" | "PM">;
  newBatchIds: ReadonlySet<string>;
  now: Date;
  onPick: (event: TeachingCalendarEvent, anchor: HTMLElement) => void;
  schoolOrder: readonly string[];
  today: string;
};

export function leaveChipLabel(part: "FULL" | "AM" | "PM") {
  return `Nghỉ phép${part === "AM" ? " sáng" : part === "PM" ? " chiều" : ""} · đã duyệt`;
}

/** Khung tuan / ngay cua lich giao vien: kich thuoc theo board (cot gio 56, 1,1 px/phut, hang «Cả ngày»). */
export function TeacherWeekGrid({ days, events, hasAssistant, leave, newBatchIds, now, onPick, schoolOrder, today }: TeacherGridProps) {
  const { end, start } = hourRange(events);
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, index) => start + index * 60);
  const bodyHeight = GRID.head + (end - start) * GRID.pxPerMin;
  const columns = COLUMNS(days.length);
  return (
    <Box aria-label="Lịch dạy" component="section" sx={{ ...CARD, display: "flex", flex: 1, flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ borderBottom: `1px solid ${t.color.border}`, display: "grid", gridTemplateColumns: columns }}>
        <Box />
        {days.map((day) => {
          const current = day === today;
          return (
            <Box key={day} sx={{ borderLeft: `1px solid ${t.color.divider}`, pb: "4px", pt: "6px", textAlign: "center" }}>
              <Typography sx={{ color: current ? t.color.primary : t.color.textMuted, fontSize: SIZE.chip, fontWeight: SEMIBOLD, lineHeight: 1.45 }}>{DOW[new Date(`${day}T00:00:00Z`).getUTCDay()]}</Typography>
              <Box sx={{ bgcolor: current ? t.color.primary : "transparent", borderRadius: `${t.radius.chip}px`, color: current ? t.color.surface : "inherit", fontSize: SIZE.day, height: 32, lineHeight: "32px", mt: "2px", mx: "auto", width: 32 }}>{Number(day.slice(8))}</Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ borderBottom: `1px solid ${t.color.border}`, display: "grid", gridTemplateColumns: columns, minHeight: 30 }}>
        <Typography sx={{ color: t.color.textMuted, fontSize: SIZE.micro, pr: 1, pt: 1, textAlign: "right" }}>Cả ngày</Typography>
        {days.map((day) => (
          <Box key={day} sx={{ borderLeft: `1px solid ${t.color.divider}`, p: "3px" }}>
            {leave.has(day) ? (
              <Box component="span" sx={{ bgcolor: LEAVE.bg, borderRadius: "6px", color: LEAVE.text, display: "block", fontSize: SIZE.chip, fontWeight: SEMIBOLD, overflow: "hidden", px: "6px", py: "3px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{leaveChipLabel(leave.get(day) ?? "FULL")}</Box>
            ) : null}
          </Box>
        ))}
      </Box>
      <Box sx={{ backgroundImage: `repeating-linear-gradient(to bottom, ${t.color.divider} 0 1px, transparent 1px ${60 * GRID.pxPerMin}px)`, backgroundPosition: `0 ${GRID.head}px`, display: "grid", gridTemplateColumns: columns, height: bodyHeight }}>
        <Box sx={{ position: "relative" }}>
          {hours.map((minutes) => (
            <Typography component="span" key={minutes} sx={{ color: t.color.textMuted, fontSize: SIZE.chip, position: "absolute", right: 8, top: GRID.head + (minutes - start) * GRID.pxPerMin - 7 }}>{hourLabel(minutes)}</Typography>
          ))}
        </Box>
        {days.map((day) => (
          <Box key={day} sx={{ bgcolor: day === today ? alpha(t.color.primary, 0.03) : undefined, borderLeft: `1px solid ${t.color.divider}`, position: "relative" }}>
            {events.filter((event) => event.date === day).map((event) => {
              const cancelled = event.status === "CANCELLED";
              const assistant = event.myRole === "ASSISTANT";
              const isNew = Boolean(event.batchId && newBatchIds.has(event.batchId));
              const box = eventBox(event, start);
              const sub = cancelled ? `Huỷ${leave.has(day) ? " · nghỉ phép" : ""}` : assistant ? `Dạy chính: ${event.mainTeacherName ?? "—"}` : [event.subjectName, event.roomName, schoolPlainName(event.schoolName)].filter(Boolean).join(" · ");
              return (
                <ButtonBase
                  aria-label={`${assistant ? "TG " : ""}${event.className}, tiết ${event.periodStart}`} key={event.id}
                  onClick={(click: MouseEvent<HTMLElement>) => onPick(event, click.currentTarget)}
                  sx={{
                    alignItems: "flex-start", borderRadius: "6px", boxSizing: "border-box", display: "block", height: box.height, left: 3, overflow: "hidden", position: "absolute", px: "6px", py: "3px", right: 4, textAlign: "left", top: box.top,
                    ...TONES[eventTone(event, schoolOrder, hasAssistant)],
                    ...(isNew ? { boxShadow: `inset 0 0 0 1px ${t.color.primary}` } : {}),
                    ...(new Date(event.endAt) < now ? { opacity: 0.6 } : {}),
                    ...(cancelled ? { backgroundImage: stripe, borderLeft: `3px solid ${LEAVE.bar}`, color: t.color.textMuted, opacity: 1, textDecoration: "line-through" } : {}),
                  }}
                >
                  <Box sx={{ fontSize: SIZE.title, fontWeight: SEMIBOLD, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assistant ? "TG " : ""}{event.className} · T{event.periodStart}{isNew && !cancelled ? " · Mới" : ""}</Box>
                  <Box sx={{ fontSize: SIZE.chip, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</Box>
                </ButtonBase>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
