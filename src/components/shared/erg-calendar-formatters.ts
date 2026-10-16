import dayjs, { type Dayjs } from "dayjs";
import type { ErgCalendarEvent, ErgCalendarLaneSummary } from "./erg-calendar-types";

export function formatGoogleDateLabel(date: Dayjs) {
  return `${date.date()} tháng ${date.month() + 1}, ${date.year()}`;
}

export function formatGoogleMonthLabel(date: Dayjs) {
  return `Tháng ${date.month() + 1}, ${date.year()}`;
}

export function formatGoogleWeekRangeLabel(start: Dayjs, end: Dayjs) {
  if (start.isSame(end, "month") && start.isSame(end, "year")) {
    return `${start.date()} - ${end.date()} tháng ${end.month() + 1}, ${end.year()}`;
  }

  if (start.isSame(end, "year")) {
    return `${start.date()} tháng ${start.month() + 1} - ${end.date()} tháng ${end.month() + 1}, ${end.year()}`;
  }

  return `${formatGoogleDateLabel(start)} - ${formatGoogleDateLabel(end)}`;
}

export function groupScheduleEvents(events: ErgCalendarEvent[]) {
  const sortedEvents = [...events].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return formatScheduleTimeRange(left).localeCompare(formatScheduleTimeRange(right));
  });

  const groups: Array<{ date: string; items: ErgCalendarEvent[] }> = [];
  for (const event of sortedEvents) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.date === event.date) {
      currentGroup.items.push(event);
      continue;
    }
    groups.push({ date: event.date, items: [event] });
  }

  return groups;
}

export function formatScheduleDateHeader(date: string) {
  return dayjs(date).format("dddd, DD/MM/YYYY");
}

export function formatScheduleTimeRange(event: ErgCalendarEvent) {
  const startTime = event.startTime || event.time || event.duration.split("-")[0]?.trim() || "";
  const endTime = event.endTime || event.duration.split("-")[1]?.trim() || "";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return event.duration || startTime || "Cả ngày";
}

export function formatScheduleClassLine(event: ErgCalendarEvent) {
  const classLabel = event.className || event.attendees || event.subject || event.school || "Chưa có lớp";
  return classLabel.startsWith("Lớp:") ? classLabel : `Lớp: ${classLabel}`;
}

export function resolveScheduleStatusLabel(event: ErgCalendarEvent) {
  if (event.lane.toLowerCase().includes("nháp") || event.title.toLowerCase().includes("trùng")) return "Cần kiểm tra lịch";
  return "Lịch cần theo dõi";
}

export function getScopeOptionValue(summary: ErgCalendarLaneSummary) {
  return summary.id ?? summary.label;
}

export function getEmptyScopeOptionLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("trường")) return "Chưa có danh sách trường";
  if (normalized.includes("giáo viên")) return "Chưa có danh sách giáo viên";
  if (normalized.includes("môn")) return "Chưa có danh sách môn";
  return "Chưa có danh sách";
}

export function buildHourRows() {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: hour === 0 ? "" : dayjs().hour(hour).minute(0).format("h A"),
    value: hour,
  }));
}

export function getEventHour(event: ErgCalendarEvent) {
  const rawTime = event.startTime || event.time || event.duration.split("-")[0]?.trim() || "";
  const match = rawTime.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return -1;
  let hour = Number(match[1]);
  if (!Number.isFinite(hour)) return -1;
  const normalized = rawTime.toLowerCase();
  if (normalized.includes("pm") && hour < 12) hour += 12;
  if (normalized.includes("am") && hour === 12) hour = 0;
  return Math.min(23, Math.max(0, hour));
}

export function isAllDayLikeEvent(event: ErgCalendarEvent) {
  const timeText = `${event.time ?? ""} ${event.startTime ?? ""} ${event.duration ?? ""}`.trim().toLowerCase();
  return !timeText || timeText.includes("cả ngày") || timeText.includes("all day");
}

export function formatCompactEventLabel(event: ErgCalendarEvent) {
  const time = event.time?.trim();
  return time ? `${time} ${event.title}` : event.title;
}

export function estimatePeriodCount(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = Math.max(45, endHour * 60 + endMinute - (startHour * 60 + startMinute));
  return Math.max(1, Math.round(minutes / 45));
}

