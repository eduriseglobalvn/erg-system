import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { todayInput } from "@/domain/formatters/format-date";
import { dayLabel, weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { scheduleCellSx, scheduleTokens } from "../shared/schedule-cell-sx";
import { overlapClusters, teacherTone } from "../shared/teacher-tone";

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

export function eventLines(event: TeachingCalendarEvent, shortNames: ReadonlyMap<string, string>, showSchool: boolean, error: boolean) {
  const main = event.teachers.find((teacher) => teacher.role === "MAIN")?.displayName;
  const line1 = `${error ? "⚠ " : ""}${event.className} · T${event.periodStart}`;
  const line2 = [event.startTime, main, event.roomName, showSchool ? shortNames.get(event.schoolId) ?? event.schoolName : null].filter(Boolean).join(" · ");
  return { line1, line2 };
}

/** Phut trong ngay (gio may), cap nhat moi 60 s cho duong «giờ hiện tại». */
function useNowMinutes() {
  const read = () => { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); };
  const [minutes, setMinutes] = useState(read);
  useEffect(() => { const timer = setInterval(() => setMinutes(read()), 60_000); return () => clearInterval(timer); }, []);
  return minutes;
}

/** Mau o theo giao vien chinh; nhap = nen trang + vien net dut mau GV; trung = hong; dung chung 1 nguon voi chip loc. */
function eventSx(event: TeachingCalendarEvent, error: boolean) {
  if (error) return scheduleCellSx("clash");
  const tone = teacherTone(event.teachers.find((teacher) => teacher.role === "MAIN")?.userId);
  if (event.status === "DRAFT") return { ...scheduleCellSx("draft"), borderLeft: `3px dashed ${tone.border}`, boxShadow: `inset 0 0 0 1px ${tone.border}` };
  return { backgroundColor: tone.background, borderLeft: `3px solid ${tone.border}`, color: tone.text };
}

/** Luoi tuan/ngay (6.1): cot theo ngay, hang theo gio; nhan «Tiết N» canh nhan gio; chip 2 dong mau theo GV; tiet giao nhau chia doi cot. */
export function MainWeekGrid({ days, errorEventIds, events, onEventClick, shortNames, showSchool }: Props) {
  const hours = hoursFor(events);
  const today = todayInput();
  const nowMinutes = useNowMinutes();
  return (
    <Box aria-label="Lịch giảng dạy" role="grid" sx={{ border: 1, borderColor: "divider", borderRadius: "14px", display: "grid", gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`, overflow: "auto" }}>
      <Box role="row" sx={{ display: "contents" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
        {days.map((day) => (
          <Box key={day} role="columnheader" sx={{ borderBottom: 1, borderColor: "divider", color: day === today ? "primary.main" : "text.secondary", fontWeight: day === today ? "fontWeightMedium" : undefined, p: 0.75, textAlign: "center", typography: "caption" }}>{dayLabel(day)}</Box>
        ))}
      </Box>
      {hours.map((hour) => {
        const period = Math.min(...events.filter((event) => Number(event.startTime.slice(0, 2)) === hour).map((event) => event.periodStart));
        return (
          <Box key={hour} role="row" sx={{ display: "contents" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", color: "text.secondary", p: 0.5, typography: "caption" }}>
              {String(hour).padStart(2, "0")}:00
              {Number.isFinite(period) ? <Box component="span" sx={{ color: "text.disabled", display: "block" }}>Tiết {period}</Box> : null}
            </Box>
            {days.map((day) => {
              const here = events.filter((event) => event.date === day && Number(event.startTime.slice(0, 2)) === hour);
              const showNow = day === today && Math.floor(nowMinutes / 60) === hour;
              return (
                <Box key={day} role="gridcell" sx={{ bgcolor: weekdayIndex(day) === 6 ? scheduleTokens.neutral.bg : undefined, borderBottom: 1, borderColor: "divider", borderLeft: 1, display: "flex", flexDirection: "column", gap: 0.5, minHeight: 56, p: 0.5, position: "relative" }}>
                  {showNow ? <Box aria-hidden data-testid="now-line" sx={{ borderTop: `2px solid ${scheduleTokens.clash.edge}`, left: 0, pointerEvents: "none", position: "absolute", right: 0, top: `${nowMinutes % 60 / 60 * 100}%`, zIndex: 1 }} /> : null}
                  {overlapClusters(here).map((cluster) => (
                    <Box key={cluster[0].id} sx={{ display: "flex", gap: 0.5 }}>
                      {cluster.map((event) => {
                        const error = errorEventIds.has(event.id);
                        const { line1, line2 } = eventLines(event, shortNames, showSchool, error);
                        return (
                          <ButtonBase
                            aria-label={`${dayLabel(event.date)}, ${event.startTime} – ${event.endTime}, ${event.className}`}
                            key={event.id}
                            onClick={(click) => onEventClick(event, click.currentTarget)}
                            sx={[{ alignItems: "flex-start", borderRadius: "6px", display: "flex", flex: "1 1 0", flexDirection: "column", minWidth: 0, p: 0.75, textAlign: "left" }, eventSx(event, error)] as never}
                          >
                            <Typography noWrap sx={{ fontWeight: "fontWeightMedium", maxWidth: "100%", typography: "caption" }}>{line1}</Typography>
                            {line2 ? <Typography noWrap sx={{ maxWidth: "100%", typography: "caption" }}>{line2}</Typography> : null}
                          </ButtonBase>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
