import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { todayInput } from "@/domain/formatters/format-date";
import { weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { overlapClusters, teacherTone } from "../shared/teacher-tone";

const color = ergEnterpriseTokens.color;
/** Board 6.1: 1,2 px moi phut (72 px/gio), dau luoi 24 px, duoi 24 px. */
const PX = 1.2;
const HEAD = 24;
const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Mac dinh 07:00-17:00; mo rong khi co tiet som/muon hon de khong an su kien. */
export function hoursFor(events: readonly TeachingCalendarEvent[]) {
  const hours = events.map((event) => Number(event.startTime.slice(0, 2))).filter(Number.isFinite);
  const from = Math.min(7, ...hours);
  const to = Math.max(17, ...hours);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

type Props = {
  days: readonly string[];
  /** Su kien co xung dot loi (co ⚠). */
  errorEventIds: ReadonlySet<string>;
  events: readonly TeachingCalendarEvent[];
  onEventClick: (event: TeachingCalendarEvent, anchor: HTMLElement) => void;
  shortNames: ReadonlyMap<string, string>;
  /** Hien ten truong o dong 2 khi dang xem nhieu truong. */
  showSchool: boolean;
};

/** `hh:mm` -> phut trong ngay. */
export const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export function eventLines(event: TeachingCalendarEvent, shortNames: ReadonlyMap<string, string>, showSchool: boolean, error: boolean) {
  const main = event.teachers.find((teacher) => teacher.role === "MAIN")?.displayName;
  const line1 = `${error ? "⚠ " : ""}${event.className} · T${event.periodStart} · ${event.startTime}`;
  const line2 = [main, event.roomName, showSchool ? shortNames.get(event.schoolId) ?? event.schoolName : null].filter(Boolean).join(" · ");
  return { line1, line2 };
}

/** Phut trong ngay (gio may), cap nhat moi 60 s cho duong «giờ hiện tại». */
function useNowMinutes() {
  const read = () => { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); };
  const [minutes, setMinutes] = useState(read);
  useEffect(() => { const timer = setInterval(() => setMinutes(read()), 60_000); return () => clearInterval(timer); }, []);
  return minutes;
}

/** Board: xuat ban = nen nhat + vien trai 3px mau GV; nhap = nen trang + vien 1px net dut mau GV; trung = them vong do 2px. */
function eventSx(event: TeachingCalendarEvent, error: boolean) {
  const tone = teacherTone(event.teachers.find((teacher) => teacher.role === "MAIN")?.userId);
  const base = event.status === "DRAFT"
    ? { backgroundColor: scheduleTokens.surface, border: `1px dashed ${tone.border}`, color: tone.text }
    : { backgroundColor: tone.background, borderLeft: `3px solid ${tone.border}`, color: tone.text };
  return error ? { ...base, boxShadow: `0 0 0 2px ${scheduleTokens.clash.edge}` } : base;
}

/** Luoi tuan/ngay (6.1): cot theo ngay, 72 px/gio; tiet dat theo gio thuc (startTime/endTime); tiet giao nhau chia doi cot. */
export function MainWeekGrid({ days, errorEventIds, events, onEventClick, shortNames, showSchool }: Props) {
  const hours = hoursFor(events);
  const origin = hours[0] * 60;
  const topOf = (minutes: number) => HEAD + (minutes - origin) * PX;
  const today = todayInput();
  const nowMinutes = useNowMinutes();
  const columns = `56px repeat(${days.length}, minmax(0, 1fr))`;
  return (
    <Box aria-label="Lịch giảng dạy" role="grid" sx={{ bgcolor: "background.paper", border: `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <Box role="row" sx={{ borderBottom: `1px solid ${color.border}`, display: "grid", gridTemplateColumns: columns }}>
        <Box />
        {days.map((day) => {
          const isToday = day === today;
          return (
            <Box key={day} role="columnheader" sx={{ borderLeft: `1px solid ${color.divider}`, pb: "6px", pt: 1, textAlign: "center" }}>
              <Box sx={{ color: isToday ? "primary.main" : color.textMuted, typography: "subtitle2", fontSize: "0.6875rem" }}>{DOW[weekdayIndex(day)]}</Box>
              <Box sx={{ bgcolor: isToday ? "primary.main" : undefined, borderRadius: "999px", color: isToday ? "primary.contrastText" : undefined, fontSize: "1.25rem", height: 36, lineHeight: "36px", mt: "2px", mx: "auto", width: 36 }}>{Number(day.slice(8))}</Box>
            </Box>
          );
        })}
      </Box>
      <Box role="row" sx={{ backgroundImage: `repeating-linear-gradient(to bottom, ${color.divider} 0 1px, transparent 1px 72px)`, backgroundPosition: `0 ${HEAD}px`, display: "grid", gridTemplateColumns: columns, height: HEAD + (hours.length - 1) * 72 + HEAD }}>
        <Box sx={{ position: "relative" }}>
          {hours.map((hour) => (
            <Box component="span" key={hour} sx={{ color: color.textMuted, fontSize: "0.6875rem", position: "absolute", right: 8, top: topOf(hour * 60) - 7 }}>{String(hour).padStart(2, "0")}:00</Box>
          ))}
        </Box>
        {days.map((day) => {
          const isToday = day === today;
          const showNow = isToday && nowMinutes >= origin && nowMinutes <= (hours.at(-1) as number) * 60 + 60;
          return (
            <Box key={day} role="gridcell" sx={{ bgcolor: isToday ? (theme) => alpha(theme.palette.primary.main, 0.03) : undefined, borderLeft: `1px solid ${color.divider}`, position: "relative" }}>
              {overlapClusters(events.filter((event) => event.date === day)).flatMap((cluster) => cluster.map((event, index) => {
                const error = errorEventIds.has(event.id);
                const { line1, line2 } = eventLines(event, shortNames, showSchool, error);
                const count = cluster.length;
                const start = minutesOf(event.startTime);
                return (
                  <ButtonBase
                    aria-label={`${event.date}, ${event.startTime} – ${event.endTime}, ${event.className}`}
                    key={event.id}
                    onClick={(click) => onEventClick(event, click.currentTarget)}
                    sx={[{ alignItems: "flex-start", borderRadius: "6px", boxSizing: "border-box", display: "flex", flexDirection: "column", height: (minutesOf(event.endTime) - start) * PX - 2, justifyContent: "flex-start", left: index === 0 ? 3 : `${index / count * 100}%`, overflow: "hidden", position: "absolute", px: "6px", py: "3px", textAlign: "left", top: topOf(start), width: `calc(${100 / count}% - ${count === 1 ? 7 : 5}px)` }, eventSx(event, error)] as never}
                  >
                    <Box sx={{ typography: "subtitle2", fontSize: "0.75rem", lineHeight: 1.45, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line1}</Box>
                    {line2 ? <Box sx={{ fontSize: "0.6875rem", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line2}</Box> : null}
                  </ButtonBase>
                );
              }))}
              {showNow ? (
                <Box aria-hidden data-testid="now-line" sx={{ bgcolor: scheduleTokens.clash.edge, height: 2, left: -5, pointerEvents: "none", position: "absolute", right: 0, top: topOf(nowMinutes), zIndex: 1 }}>
                  <Box component="span" sx={{ bgcolor: scheduleTokens.clash.edge, borderRadius: "999px", height: 10, left: 0, position: "absolute", top: -4, width: 10 }} />
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
