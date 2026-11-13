import { formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import { formatViNumber, scoreOutOf10 } from "@/domain/student-tier/tiers";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

// Student "Bài tập" board (canvas H10/H09/H11): pure grouping, due-chip and score-band rules.

export type BoardGroupKey = "today" | "week" | "later";
export type BoardGroup = { key: BoardGroupKey; label: string; items: StudentDashboardAssignment[]; xp: number };
export type DueTone = "warn" | "muted" | "error";
export type ScoreBand = "ok" | "primary" | "error";

const GROUP_LABEL: Record<BoardGroupKey, string> = { today: "HÔM NAY", week: "TUẦN NÀY", later: "SAU NÀY" };
const WEEKDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const HOUR = 3_600_000;
const DAY_MS = 24 * HOUR;

const dueMs = (a: StudentDashboardAssignment) => (a.dueAt ? Date.parse(a.dueAt) : Number.NaN);
const dueOrLast = (a: StudentDashboardAssignment) => (Number.isNaN(dueMs(a)) ? Infinity : dueMs(a));
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
/** Whole local calendar days from `now` to `ms` (0 = same day, negative = past). */
export function calendarDaysBetween(now: number, ms: number): number {
  return Math.round((startOfDay(ms) - startOfDay(now)) / DAY_MS);
}
const dayMonth = (ms: number) => formatDateVi(ms).slice(0, 5);
const weekdayShort = (ms: number) => `${WEEKDAY[new Date(ms).getDay()]} ${dayMonth(ms)}`;

/** Buckets by calendar day: today, the next 7 days ("tuần này"), anything later or undated. Sorted by deadline. */
export function groupTodo(items: StudentDashboardAssignment[], now: number): BoardGroup[] {
  const sorted = [...items].sort((a, b) => dueOrLast(a) - dueOrLast(b));
  const keyOf = (a: StudentDashboardAssignment): BoardGroupKey => {
    const ms = dueMs(a);
    if (Number.isNaN(ms)) return "later";
    const days = calendarDaysBetween(now, ms);
    return days <= 0 ? "today" : days <= 7 ? "week" : "later";
  };
  return (["today", "week", "later"] as const)
    .map((key) => {
      const group = sorted.filter((a) => keyOf(a) === key);
      return { key, label: GROUP_LABEL[key], items: group, xp: todoXpTotal(group) };
    })
    .filter((group) => group.items.length > 0);
}

/** "2 bài · +90 XP"; a single item shows the XP alone (mobile H02c "HÔM NAY +40 XP"). */
export function groupSummary(group: Pick<BoardGroup, "items" | "xp">): string {
  const xp = `+${formatViNumber(group.xp)} XP`;
  return group.items.length > 1 ? `${group.items.length} bài · ${xp}` : xp;
}

export function todoXpTotal(items: StudentDashboardAssignment[]): number {
  return items.reduce((sum, a) => sum + (a.xpReward ?? 0), 0);
}

/** "Thứ Năm, 12/11 · 4 bài cần làm · làm xong nhận tới +145 XP". */
export function todoHeadline(todo: StudentDashboardAssignment[], now: number): string {
  const head = `${WEEKDAY[new Date(now).getDay()]}, ${dayMonth(now)}`;
  if (!todo.length) return head;
  const xp = todoXpTotal(todo);
  return `${head} · ${todo.length} bài cần làm${xp > 0 ? ` · làm xong nhận tới +${formatViNumber(xp)} XP` : ""}`;
}

/** The "Đang làm dở" card: a started, not handed-in assignment, nearest deadline first. */
export function pickResume(todo: StudentDashboardAssignment[]): StudentDashboardAssignment | undefined {
  return todo.filter((a) => a.status === "in_progress" && (a.answeredCount ?? 0) > 0).sort((a, b) => dueOrLast(a) - dueOrLast(b))[0];
}

/** "Còn 4 giờ" (amber, under 24h) / "Còn 4 ngày" (grey). */
export function dueChip(a: StudentDashboardAssignment, now: number): { text: string; tone: DueTone } | null {
  const ms = dueMs(a);
  if (Number.isNaN(ms)) return null;
  const left = ms - now;
  if (left < 0) return { text: "Quá hạn", tone: "error" };
  if (left < HOUR) return { text: `Còn ${Math.max(1, Math.ceil(left / 60_000))} phút`, tone: "warn" };
  if (left < DAY_MS) return { text: `Còn ${Math.ceil(left / HOUR)} giờ`, tone: "warn" };
  return { text: `Còn ${Math.max(1, calendarDaysBetween(now, ms))} ngày`, tone: "muted" };
}

/** Second line under the chip: "20:00 hôm nay", "21:00 ngày mai", "Thứ Hai 16/11". */
export function dueClock(a: StudentDashboardAssignment, now: number): string {
  const ms = dueMs(a);
  if (Number.isNaN(ms)) return "";
  const days = calendarDaysBetween(now, ms);
  if (days === 0) return `${formatTimeVi(ms)} hôm nay`;
  return days === 1 ? `${formatTimeVi(ms)} ngày mai` : weekdayShort(ms);
}

/** Mobile chip text beyond today: "Ngày mai 21:00", "Thứ Hai 16/11". */
export function dueShort(a: StudentDashboardAssignment, now: number): string {
  const ms = dueMs(a);
  if (Number.isNaN(ms)) return "";
  return calendarDaysBetween(now, ms) === 1 ? `Ngày mai ${formatTimeVi(ms)}` : weekdayShort(ms);
}

/** Share of the question count answered, 0-100. */
export function progressPercent(a: StudentDashboardAssignment): number {
  return a.answeredCount !== null && a.totalQuestions ? Math.min(100, Math.round((a.answeredCount / a.totalQuestions) * 100)) : 0;
}

/** Score on the 0-10 scale; >= 8 green, 5 to under 8 primary, under 5 red. */
export function scoreBand(score: number, maxScore: number): ScoreBand {
  const ten = (score / maxScore) * 10;
  return ten >= 8 ? "ok" : ten >= 5 ? "primary" : "error";
}

/** Correct-answer bar: >= 80% green, under 50% amber, else primary. */
export function percentBand(percent: number): "ok" | "primary" | "warning" {
  return percent >= 80 ? "ok" : percent < 50 ? "warning" : "primary";
}

export const scorePercent = (a: StudentDashboardAssignment) => (a.score !== null && a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null);

/** "Trước hạn 4 ngày" / "Trễ 20 phút"; null when the server did not say. */
export function beforeDueLabel(a: Pick<StudentDashboardAssignment, "onTime" | "minutesBeforeDue">): { text: string; late: boolean } | null {
  if (a.minutesBeforeDue === null || a.minutesBeforeDue === undefined) return null;
  const late = a.onTime === false || a.minutesBeforeDue < 0;
  const minutes = Math.abs(a.minutesBeforeDue);
  const span = minutes >= 1440 ? `${Math.floor(minutes / 1440)} ngày` : minutes >= 60 ? `${Math.floor(minutes / 60)} giờ` : `${Math.max(1, minutes)} phút`;
  return { late, text: `${late ? "Trễ" : "Trước hạn"} ${span}` };
}

/** "Quá 2 ngày" / "Quá 5 giờ". */
export function overdueAgo(a: StudentDashboardAssignment, now: number): string {
  const ms = dueMs(a);
  if (Number.isNaN(ms)) return "Quá hạn";
  const past = now - ms;
  if (past >= DAY_MS) return `Quá ${Math.floor(past / DAY_MS)} ngày`;
  return past >= HOUR ? `Quá ${Math.floor(past / HOUR)} giờ` : `Quá ${Math.max(1, Math.floor(past / 60_000))} phút`;
}

/** "11/11 20:14" (no year, as in the table). */
export function shortDateTime(value: string | undefined): string {
  const ms = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(ms) ? "" : `${dayMonth(ms)} ${formatTimeVi(ms)}`;
}

/** "10/11 21:00" for a deadline, same shape as shortDateTime. */
export const shortDue = (a: StudentDashboardAssignment) => shortDateTime(a.dueAt);

export const score10 = (a: StudentDashboardAssignment) => (a.score !== null && a.maxScore ? scoreOutOf10(a.score, a.maxScore) : "");
export const rawScoreLabel = (a: StudentDashboardAssignment) => (a.score !== null && a.maxScore ? `${formatViNumber(a.score)}/${formatViNumber(a.maxScore)} điểm` : "");

export type SubmittedStats = {
  averageTen: string;
  count: number;
  correct: { right: number; total: number } | null;
  best: StudentDashboardAssignment | null;
  onTime: { done: number; total: number } | null;
};

export function submittedStats(items: StudentDashboardAssignment[]): SubmittedStats {
  const scored = items.filter((a) => a.score !== null && a.maxScore);
  const tens = scored.map((a) => (a.score! / a.maxScore!) * 10);
  const withCorrect = items.filter((a) => a.correctCount != null && a.totalQuestions);
  const stamped = items.filter((a) => a.onTime !== null && a.onTime !== undefined);
  const best = scored.reduce<StudentDashboardAssignment | null>((top, a) => (top && top.score! / top.maxScore! >= a.score! / a.maxScore! ? top : a), null);
  return {
    averageTen: tens.length ? formatViNumber(Math.round((tens.reduce((s, v) => s + v, 0) / tens.length) * 10) / 10) : "",
    best,
    correct: items.length > 0 && withCorrect.length === items.length
      ? { right: withCorrect.reduce((s, a) => s + a.correctCount!, 0), total: withCorrect.reduce((s, a) => s + a.totalQuestions!, 0) }
      : null,
    count: scored.length,
    onTime: stamped.length ? { done: stamped.filter((a) => a.onTime).length, total: stamped.length } : null,
  };
}
