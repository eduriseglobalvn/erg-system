import type { TeachingScheduleDraftInput, TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";

import { addDaysToDate, weekStartOf, weekdayIndex } from "./schedule-copy";

/** Mo hinh luoi xep lich (Thu x Tiet): moi o la mot dong nhap. weekday 1..6 = Thu 2..Thu 7. */
export type GridRow = {
  assistantId?: string;
  assistantName?: string;
  classId: string;
  className: string;
  clientRowId: string;
  eventId?: string;
  newRoomName?: string;
  note?: string;
  periodNo: number;
  roomId?: string;
  roomName?: string;
  teacherId?: string;
  teacherName?: string;
  weekday: number;
};

export type ScheduleConflict = TeachingScheduleDraftResult["conflicts"][number];
export type CellState = "clash" | "travel" | "warn";

export const WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;

export const cellKey = (weekday: number, periodNo: number) => `${weekday}:${periodNo}`;

export function parseCellKey(key: string): { periodNo: number; weekday: number } {
  const [weekday, periodNo] = key.split(":").map(Number);
  return { periodNo, weekday };
}

export function rowsByCell(rows: readonly GridRow[]): Map<string, GridRow> {
  return new Map(rows.map((row) => [cellKey(row.weekday, row.periodNo), row]));
}

export function newClientRowId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toDraftRowInputs(rows: readonly GridRow[]): TeachingScheduleDraftInput["rows"] {
  return rows.map((row) => ({
    assistantId: row.assistantId || null,
    classId: row.classId,
    clientRowId: row.clientRowId,
    eventId: row.eventId || null,
    newRoomName: row.roomId ? null : row.newRoomName || null,
    note: row.note || null,
    periodNo: row.periodNo,
    roomId: row.roomId || null,
    teacherId: row.teacherId || null,
    weekday: row.weekday,
  }));
}

export function applyRowIdMap(rows: readonly GridRow[], rowIdMap: ReadonlyArray<{ clientRowId: string; eventId: string }>): GridRow[] {
  const byClient = new Map(rowIdMap.map((pair) => [pair.clientRowId, pair.eventId]));
  return rows.map((row) => (byClient.has(row.clientRowId) ? { ...row, eventId: byClient.get(row.clientRowId) } : row));
}

export function errorConflicts(conflicts: readonly ScheduleConflict[]): ScheduleConflict[] {
  return conflicts.filter((conflict) => conflict.severity === "ERROR");
}

/** Trang thai mau cua o: loi trung > khong kip di chuyen > canh bao nghi. */
export function cellStates(conflicts: readonly ScheduleConflict[]): Map<string, CellState> {
  const rank: Record<CellState, number> = { clash: 3, travel: 2, warn: 1 };
  const result = new Map<string, CellState>();
  for (const conflict of conflicts) {
    const state: CellState = conflict.severity !== "ERROR" ? "warn" : conflict.kind === "TRAVEL_TIME" ? "travel" : "clash";
    const key = cellKey(conflict.weekday, conflict.periodNo);
    const current = result.get(key);
    if (!current || rank[state] > rank[current]) result.set(key, state);
  }
  return result;
}

/** Keo o: tha vao o co tiet thi hoan doi, vao o trong thi doi cho. */
export function moveOrSwap(rows: readonly GridRow[], from: string, to: string): GridRow[] {
  if (from === to) return [...rows];
  const source = parseCellKey(from);
  const target = parseCellKey(to);
  return rows.map((row) => {
    if (row.weekday === source.weekday && row.periodNo === source.periodNo) return { ...row, ...target };
    if (row.weekday === target.weekday && row.periodNo === target.periodNo) return { ...row, ...source };
    return row;
  });
}

/** Doi giao vien chinh thanh dung nguoi dang la tro giang -> bo tro giang (6.16). */
export function withTeacher(row: GridRow, teacher: { id?: string; name?: string }): { removedAssistant: boolean; row: GridRow } {
  const removedAssistant = Boolean(teacher.id && row.assistantId && row.assistantId === teacher.id);
  return {
    removedAssistant,
    row: {
      ...row,
      assistantId: removedAssistant ? undefined : row.assistantId,
      assistantName: removedAssistant ? undefined : row.assistantName,
      teacherId: teacher.id,
      teacherName: teacher.name,
    },
  };
}

/** Dong nhap cua mot dot, doc tu cac su kien tuan dau tien cua dot. */
export function eventsToRows(events: readonly TeachingCalendarEvent[], batchId: string): GridRow[] {
  const own = events.filter((event) => event.batchId === batchId);
  if (!own.length) return [];
  const firstWeek = weekStartOf([...own].sort((a, b) => a.date.localeCompare(b.date))[0].date);
  const lastDay = addDaysToDate(firstWeek, 6);
  return own
    .filter((event) => event.date >= firstWeek && event.date < lastDay && weekdayIndex(event.date) !== 0)
    .flatMap((event) => Array.from({ length: Math.max(1, event.periodCount) }, (_, offset) => {
      const main = event.teachers.find((teacher) => teacher.role === "MAIN");
      const assistant = event.teachers.find((teacher) => teacher.role === "ASSISTANT");
      return {
        assistantId: assistant?.userId,
        assistantName: assistant?.displayName,
        classId: event.classId,
        className: event.className,
        clientRowId: offset === 0 ? event.id : `${event.id}#${offset}`,
        eventId: offset === 0 ? event.id : undefined,
        note: event.note ?? undefined,
        periodNo: event.periodStart + offset,
        roomId: event.roomId ?? undefined,
        roomName: event.roomName ?? undefined,
        teacherId: main?.userId,
        teacherName: main?.displayName,
        weekday: weekdayIndex(event.date),
      } satisfies GridRow;
    }));
}

/** Ngay cu the cua o trong tuan chua `applyFrom`. */
export function dateOfCell(applyFrom: string, weekday: number): string {
  return addDaysToDate(weekStartOf(applyFrom), weekday - 1);
}

function rowOfConflict(rows: readonly GridRow[], clientRowId?: string | null, eventId?: string | null) {
  return rows.find((row) => (clientRowId && row.clientRowId === clientRowId) || (eventId && row.eventId === eventId));
}

/** Dong cua o dang xep (mine) trong mot xung dot. */
export function conflictRow(rows: readonly GridRow[], conflict: ScheduleConflict): GridRow | undefined {
  return rowOfConflict(rows, conflict.clientRowId, conflict.mine.eventId);
}

/** Ap goi y sua mot cham: doi GV / doi phong o o dang xep, hoac doi GV cua tiet lien truoc. */
export function applyConflictFix(rows: readonly GridRow[], conflict: ScheduleConflict): GridRow[] {
  const fix = conflict.fix;
  if (!fix) return [...rows];
  const target = fix.kind === "CHANGE_PREVIOUS_TEACHER"
    ? rowOfConflict(rows, fix.targetClientRowId, fix.targetEventId ?? conflict.other?.eventId)
    : conflictRow(rows, conflict);
  if (!target) return [...rows];
  return rows.map((row) => {
    if (row !== target) return row;
    if (fix.kind === "CHANGE_ROOM") return { ...row, newRoomName: undefined, roomId: fix.roomId ?? undefined, roomName: fix.roomName ?? undefined };
    return withTeacher(row, { id: fix.teacherId ?? undefined, name: fix.teacherName ?? undefined }).row;
  });
}
