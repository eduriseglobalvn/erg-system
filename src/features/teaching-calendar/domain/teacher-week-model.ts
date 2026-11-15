import type { TeachingCalendarEvent } from "../api/teaching-calendar-workspace-types";
import { addDaysToDate, weekStartOf } from "./schedule-copy";

/** Luoi gio cua lich giao vien theo board: 1,1 px / phut, de 20 px phia tren, mac dinh 07:00 - 17:00 va gian ra theo tiet that. */
export const GRID = { defaultEnd: 1020, defaultStart: 420, head: 20, pxPerMin: 1.1 } as const;

export type TeacherView = "day" | "week" | "month";

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const hourLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`;

/** Cac ngay hien thi: Ngay = 1 cot, Tuan = Thu 2 - Thu 7. */
export function visibleDays(view: TeacherView, anchor: string): string[] {
  if (view === "day") return [anchor];
  const start = weekStartOf(anchor);
  return Array.from({ length: 6 }, (_, index) => addDaysToDate(start, index));
}

/** Thang: moi hang la mot tuan Thu 2 - Thu 7 phu het cac ngay trong thang. */
export function monthWeeks(anchor: string): string[][] {
  const first = `${anchor.slice(0, 8)}01`;
  const next = new Date(Date.UTC(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)), 1));
  const last = addDaysToDate(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`, -1);
  const rows: string[][] = [];
  for (let start = weekStartOf(first); start <= last; start = addDaysToDate(start, 7)) rows.push(visibleDays("week", start));
  return rows;
}

export function queryRange(view: TeacherView, anchor: string): { from: string; to: string } {
  if (view === "month") {
    const rows = monthWeeks(anchor);
    return { from: rows[0][0], to: rows[rows.length - 1][5] };
  }
  const days = visibleDays(view, anchor);
  return { from: days[0], to: days[days.length - 1] };
}

export function shiftAnchor(view: TeacherView, anchor: string, direction: 1 | -1): string {
  if (view === "day") return addDaysToDate(anchor, direction);
  if (view === "week") return addDaysToDate(anchor, 7 * direction);
  const month = Number(anchor.slice(5, 7)) - 1 + direction;
  const date = new Date(Date.UTC(Number(anchor.slice(0, 4)), month, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** Phut bat dau / ket thuc cua luoi: toi thieu 07:00 - 17:00, mo rong theo gio tron khi co tiet nam ngoai. */
export function hourRange(events: readonly Pick<TeachingCalendarEvent, "endTime" | "startTime">[]) {
  let start: number = GRID.defaultStart;
  let end: number = GRID.defaultEnd;
  for (const event of events) {
    start = Math.min(start, Math.floor(toMinutes(event.startTime) / 60) * 60);
    end = Math.max(end, Math.ceil(toMinutes(event.endTime) / 60) * 60);
  }
  return { end, start };
}

export function eventBox(event: Pick<TeachingCalendarEvent, "endTime" | "startTime">, startMin: number) {
  const from = toMinutes(event.startTime);
  return { height: (toMinutes(event.endTime) - from) * GRID.pxPerMin - 2, top: GRID.head + (from - startMin) * GRID.pxPerMin };
}

type LeaveLike = { fromDate?: string; part?: "FULL" | "AM" | "PM"; status?: string; toDate?: string; type?: string };

/** Ngay nghi phep da duyet (don LEAVE, APPROVED) nam trong [from, to]; ngay -> buoi nghi. */
export function leaveDays(requests: readonly LeaveLike[], from: string, to: string): Map<string, "FULL" | "AM" | "PM"> {
  const days = new Map<string, "FULL" | "AM" | "PM">();
  for (const request of requests) {
    if (request.type !== "LEAVE" || request.status !== "APPROVED" || !request.fromDate) continue;
    const end = request.toDate ?? request.fromDate;
    for (let day = request.fromDate; day <= end && day <= to; day = addDaysToDate(day, 1)) if (day >= from) days.set(day, request.part ?? "FULL");
  }
  return days;
}

export type EventTone = "assistant" | "primary" | "neutral";

/** Tiet tro giang net dut; khi co tro giang moi tiet day chinh la xam; con lai truong dau tien xanh, truong khac xam. */
export function eventTone(event: Pick<TeachingCalendarEvent, "myRole" | "schoolId">, schoolOrder: readonly string[], hasAssistant: boolean): EventTone {
  if (event.myRole === "ASSISTANT") return "assistant";
  return !hasAssistant && schoolOrder.indexOf(event.schoolId) === 0 ? "primary" : "neutral";
}

/** Truong theo thu tu xuat hien som nhat trong tuan (on dinh giua cac lan render). */
export function schoolOrderOf(events: readonly Pick<TeachingCalendarEvent, "schoolId" | "startAt">[]): string[] {
  const seen: string[] = [];
  for (const event of [...events].sort((a, b) => a.startAt.localeCompare(b.startAt))) if (!seen.includes(event.schoolId)) seen.push(event.schoolId);
  return seen;
}

export function createTeacherCalendarInput(tenantId: string, view: TeacherView, anchor: string) {
  // CANCELLED de ve the huy gach ngang (nghi phep / nghi le) thay vi de mat tiet.
  return { ...queryRange(view, anchor), statuses: ["PUBLISHED", "CANCELLED"] as ("PUBLISHED" | "CANCELLED")[], tenantId, viewMode: "ALL" as const };
}
