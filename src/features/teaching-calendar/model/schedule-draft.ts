import dayjs from "dayjs";

import type { ErgScheduleCatalog, ErgScheduleDraft } from "@/components/shared/erg-calendar-workspace";

export type ScheduleDraftFormRow = {
  assistantTeacherId?: string;
  classId: string;
  end?: string;
  endTime?: string;
  id: string;
  levelId?: string;
  mainTeacherId: string;
  note?: string;
  periodCount: string;
  periodStart?: string;
  roomId?: string;
  roomName?: string;
  session?: string;
  start?: string;
  startTime?: string;
  subjectId: string;
  weekday: number | string;
};

export type ScheduleDraftForm = {
  applyFrom: string;
  note?: string;
  repeatWeeks: number;
  resolveMode?: ErgScheduleDraft["resolveMode"];
  rows: ScheduleDraftFormRow[];
  schoolId: string;
};

export function buildScheduleDraft(form: ScheduleDraftForm, catalog: ErgScheduleCatalog): ErgScheduleDraft {
  const rows = form.rows
    .filter((row) => row.classId && row.mainTeacherId && row.subjectId)
    .map((row) => ({
      assistantTeacherIds: row.assistantTeacherId ? [row.assistantTeacherId] : [],
      classIds: [row.classId],
      clientRowId: row.id,
      endTime: row.endTime ?? row.end ?? "",
      levelId: row.levelId || undefined,
      mainTeacherIds: [row.mainTeacherId],
      note: row.note || undefined,
      periodCount: Number(row.periodCount) || 1,
      periodStart: Number(row.periodStart) || 1,
      roomId: row.roomId || undefined,
      roomName: row.roomName || undefined,
      session: row.session ? mapSessionValue(row.session) : undefined,
      startTime: row.startTime ?? row.start ?? "",
      subjectId: row.subjectId,
      weekday: typeof row.weekday === "number" ? row.weekday : mapWeekdayValue(row.weekday),
    }));

  if (!catalog.schools.some((school) => school.id === form.schoolId) || rows.length === 0) {
    throw new Error("Dữ liệu lịch chưa đầy đủ.");
  }

  return {
    applyFrom: form.applyFrom,
    note: form.note || undefined,
    repeatWeeks: form.repeatWeeks,
    resolveMode: form.resolveMode,
    rows,
    schoolId: form.schoolId,
  };
}

export function buildScheduleDraftKey(draft: ErgScheduleDraft) {
  return JSON.stringify({ applyFrom: draft.applyFrom, note: draft.note ?? "", repeatWeeks: draft.repeatWeeks, rows: draft.rows, schoolId: draft.schoolId });
}

export function calculateInclusiveRepeatWeeks(applyFrom: string, applyTo: string) {
  const from = dayjs(applyFrom);
  const to = dayjs(applyTo);
  if (!from.isValid() || !to.isValid() || to.isBefore(from, "day")) return 1;
  return Math.max(1, Math.floor(to.diff(from, "day") / 7) + 1);
}

export function mapWeekdayValue(value: string) {
  const normalized = value.trim().toLowerCase();
  for (let day = 2; day <= 7; day += 1) {
    if (normalized.includes(String(day))) return day - 1;
  }
  return 7;
}

export function mapSessionValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("sáng")) return "MORNING";
  if (normalized.includes("tối")) return "EVENING";
  return "AFTERNOON";
}

export function normalizePeriodStart(periodCountValue: string, periodStartValue: string) {
  const periodCount = Math.max(1, Math.min(4, Number(periodCountValue) || 1));
  const periodStart = Math.max(1, Number(periodStartValue) || 1);
  return String(Math.min(periodStart, 10 - periodCount + 1));
}

export function addPeriodsToTime(startTime: string, periodCountValue: string) {
  const [hour, minute] = startTime.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return startTime;
  const periodCount = Math.max(1, Math.min(4, Number(periodCountValue) || 1));
  const totalMinutes = hour * 60 + minute + periodCount * 45 + Math.max(0, periodCount - 1) * 5;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}
