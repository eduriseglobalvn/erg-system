import { formatDateVi, todayInput } from "@/domain/formatters/format-date";

const pad = (n: number) => String(n).padStart(2, "0");

/** yyyy-MM-dd as a local date (never via UTC, which shifts the day in GMT+7). */
function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** Monday of the week that holds `iso` (weeks run Monday to Sunday, as the backend cuts them). */
export function mondayOf(iso: string) {
  const day = parseIso(iso).getDay();
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function currentWeekStart() {
  return mondayOf(todayInput());
}

/** "Thứ 2" … "Thứ 7", "Chủ nhật". */
export function weekdayVi(iso: string) {
  const day = parseIso(iso).getDay();
  return day === 0 ? "Chủ nhật" : `Thứ ${day + 1}`;
}

/** dd/MM */
export function shortDateVi(iso: string) {
  return formatDateVi(iso).slice(0, 5);
}

/** "09/11 – 14/11/2026": Monday to `lastDayOffset` days later (5 = Saturday, 4 = Friday, as the boards print it). */
export function weekRangeLabel(weekStart: string, lastDayOffset: number) {
  return `${shortDateVi(weekStart)} – ${formatDateVi(addDays(weekStart, lastDayOffset))}`;
}

/** The seven-day grid the log shows: Monday to Saturday always, Sunday only when the timetable has a period on it. */
export function weekDates(weekStart: string, includeSunday: boolean) {
  return Array.from({ length: includeSunday ? 7 : 6 }, (_, i) => addDays(weekStart, i));
}
