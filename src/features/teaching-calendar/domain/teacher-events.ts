import type { ErgCalendarEvent } from "@/components/shared/erg-calendar-types";

import type { TeachingCalendarEvent } from "../api/teaching-calendar-workspace-types";
import { schoolPlainName } from "./schedule-copy";

export type TeacherRoleFilter = "all" | "main" | "assistant";

export const isAssistantEvent = (event: Pick<TeachingCalendarEvent, "myRole">) => event.myRole === "ASSISTANT";

/**
 * Gan chu cho chip / the tiet cua lich giao vien (6.10, 6.17, 6.18):
 * chip day chinh «9A6 · T7 · Mới» / «PM 03 · Trương Công Định»; tro giang «TG 9A3 · T4» / «Dạy chính: T.Tuấn».
 */
export function decorateTeacherEvents(source: readonly TeachingCalendarEvent[], mapped: readonly ErgCalendarEvent[], newBatchIds: ReadonlySet<string>, now: Date = new Date()): ErgCalendarEvent[] {
  const byId = new Map(source.map((event) => [event.id, event]));
  return mapped.map((event) => {
    const raw = byId.get(event.id);
    if (!raw) return event;
    const assistant = isAssistantEvent(raw);
    const isNew = Boolean(raw.batchId && newBatchIds.has(raw.batchId));
    const place = [raw.roomName, schoolPlainName(raw.schoolName)].filter(Boolean).join(" · ");
    const line1 = assistant ? `TG ${raw.className} · T${raw.periodStart}` : `${raw.className} · T${raw.periodStart}${isNew ? " · Mới" : ""}`;
    const tags = [...(assistant ? ["Trợ giảng"] : []), ...(isNew ? ["Mới"] : [])];
    const minutesLeft = Math.ceil((new Date(raw.startAt).getTime() - now.getTime()) / 60_000);
    return {
      ...event,
      assistant,
      periodNo: raw.periodStart,
      soonLabel: minutesLeft > 0 && minutesLeft <= 60 ? `còn ${minutesLeft} phút` : undefined,
      chipLines: [line1, assistant ? `Dạy chính: ${raw.mainTeacherName ?? ""}`.trim() : place],
      subline: assistant ? `Dạy chính: ${raw.mainTeacherName ?? "—"}` : raw.assistantName ? `Trợ giảng: ${raw.assistantName}` : undefined,
      tags: tags.length ? tags : undefined,
    };
  });
}

/** Loc theo vai tro (`?role=`) o client. */
export function filterByRole<T extends Pick<TeachingCalendarEvent, "myRole">>(events: readonly T[], role: TeacherRoleFilter): T[] {
  if (role === "all") return [...events];
  return events.filter((event) => (role === "assistant") === isAssistantEvent(event));
}

export function roleCounts(events: readonly Pick<TeachingCalendarEvent, "myRole">[]) {
  const assistant = events.filter(isAssistantEvent).length;
  return { all: events.length, assistant, main: events.length - assistant };
}

export function parseRoleFilter(value: string | null): TeacherRoleFilter {
  return value === "main" || value === "assistant" ? value : "all";
}
