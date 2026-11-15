import { formatDateVi } from "@/domain/formatters/format-date";

import { schoolPlainName, weekdayName } from "./schedule-copy";

/** Thong bao SCHEDULE_PUBLISHED (data do BE B9 ghi): batchId, schoolName, fromDate, newPeriods, weekdays (JSON), periodRange «6-9», classes (JSON), role, assistantPeriods. */
export type ScheduleNotice = {
  assistantPeriods?: number;
  batchId: string;
  classes: string[];
  fromDate: string;
  id: string;
  newPeriods: number;
  periodRange: string;
  role: "MAIN" | "ASSISTANT" | "BOTH";
  schoolName: string;
  weekdays: number[];
};

type Item = { data?: Record<string, unknown>; eventType?: string; id: string };

const json = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return Array.isArray(value) ? (value as T) : fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

export function parseScheduleNotice(item: Item): ScheduleNotice | null {
  const data = item.data;
  if (item.eventType !== "SCHEDULE_PUBLISHED" || !data || typeof data.batchId !== "string" || typeof data.fromDate !== "string") return null;
  const classes = json<Array<{ name?: string }>>(data.classes, []).map((entry) => entry.name ?? "").filter(Boolean);
  const role = data.role === "ASSISTANT" || data.role === "BOTH" ? data.role : "MAIN";
  return {
    assistantPeriods: data.assistantPeriods ? Number(data.assistantPeriods) : undefined,
    batchId: data.batchId, classes, fromDate: data.fromDate, id: item.id,
    newPeriods: Number(data.newPeriods ?? 0), periodRange: String(data.periodRange ?? ""), role,
    schoolName: String(data.schoolName ?? ""), weekdays: json<number[]>(data.weekdays, []),
  };
}

const dd = (value: string) => formatDateVi(value).slice(0, 5);
const count = (notice: ScheduleNotice) => (notice.role === "ASSISTANT" ? notice.assistantPeriods ?? notice.newPeriods : notice.newPeriods);
const noun = (notice: ScheduleNotice) => (notice.role === "ASSISTANT" ? "tiết trợ giảng mới" : "tiết mới");

/** «4 tiết mới ở THCS Trương Công Định từ 09/11 (Thứ 4, tiết 6–9) · bạn đã được cấp quyền lớp 9A2, 9A4». */
export function noticeBannerText(notice: ScheduleNotice): string {
  const days = notice.weekdays.map(weekdayName).join(", ");
  const periods = notice.periodRange ? `tiết ${notice.periodRange.replace("-", "–")}` : "";
  const when = [days, periods].filter(Boolean).join(", ");
  return `${count(notice)} ${noun(notice)} ở ${notice.schoolName} từ ${dd(notice.fromDate)}${when ? ` (${when})` : ""} · bạn đã được cấp quyền lớp ${notice.classes.join(", ")}`;
}

/** Link trang thai mobile: «4 tiết mới từ 09/11 · Trương Công Định ›». */
export function noticeLinkText(notice: ScheduleNotice): string {
  return `${count(notice)} ${noun(notice)} từ ${dd(notice.fromDate)} · ${schoolPlainName(notice.schoolName)} ›`;
}
