import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import type { TeachingCalendarEvent, TeachingCalendarWorkspaceInput } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";

/** BE `CalendarWorkspaceQueryUseCase.MAX_WORKSPACE_DAYS`: one workspace request covers at most 42 days, ends included. */
export const WORKSPACE_MAX_DAYS = 42;
/** BE `deleteTeacherSchedule` refuses a range longer than one year. */
export const RANGE_DELETE_MAX_DAYS = 366;

export function daysInRange(from: string, to: string) {
  if (!from || !to) return 0;
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

/** Splits [from, to] (yyyy-MM-dd, both included) into consecutive pieces of at most `size` days. */
export function rangeChunks(from: string, to: string, size = WORKSPACE_MAX_DAYS) {
  const chunks: Array<{ from: string; to: string }> = [];
  for (let start = from; start <= to; start = addDaysToDate(start, size)) {
    const end = addDaysToDate(start, size - 1);
    chunks.push({ from: start, to: end < to ? end : to });
  }
  return chunks;
}

/** Every DRAFT/PUBLISHED event in the range, read 42 days at a time (one after another, to spare the server). */
export async function loadEventsInRange(input: Omit<TeachingCalendarWorkspaceInput, "statuses">, signal?: AbortSignal) {
  const byId = new Map<string, TeachingCalendarEvent>();
  for (const chunk of rangeChunks(input.from, input.to)) {
    const page = await loadLcmsTeachingCalendarWorkspace({ ...input, ...chunk, statuses: ["DRAFT", "PUBLISHED"] }, signal);
    for (const event of page.events) byId.set(event.id, event);
  }
  return [...byId.values()];
}

export type DeleteImpact = { past: number; teachers: string[]; total: number };

export function deleteImpact(events: readonly TeachingCalendarEvent[], now = Date.now()): DeleteImpact {
  const teachers = new Set<string>();
  for (const event of events) for (const teacher of event.teachers) if (teacher.displayName) teachers.add(teacher.displayName);
  return { past: events.filter((event) => Date.parse(event.startAt) < now).length, teachers: [...teachers].sort((a, b) => a.localeCompare(b, "vi")), total: events.length };
}

/** «Thầy A, Cô B, Cô C và 2 người khác». */
export function teacherList(names: readonly string[], shown = 3) {
  if (names.length <= shown) return names.join(", ");
  return `${names.slice(0, shown).join(", ")} và ${names.length - shown} người khác`;
}
