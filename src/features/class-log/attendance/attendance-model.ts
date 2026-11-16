import type { JsonValue } from "@/platform/offline";

/** The four taps of the board: Co mat / Muon / Vang K / Vang P. */
export type AttendanceMark = "present" | "late" | "absentUnexcused" | "absentExcused";

export const ATTENDANCE_MARKS: readonly AttendanceMark[] = ["present", "late", "absentUnexcused", "absentExcused"];

/** Keyboard 1-4 in the same order as the buttons. */
export function markFromKey(key: string): AttendanceMark | null {
  const index = Number(key) - 1;
  return Number.isInteger(index) && index >= 0 && index < ATTENDANCE_MARKS.length ? ATTENDANCE_MARKS[index] : null;
}

const API_STATUS: Record<AttendanceMark, string> = {
  absentExcused: "EXCUSED",
  absentUnexcused: "ABSENT",
  late: "LATE",
  present: "PRESENT",
};

export function toApiStatus(mark: AttendanceMark): string {
  return API_STATUS[mark];
}

export type LessonLogAbsentee = { excused: boolean; shortName: string; studentId: string };

export type LessonLogPeriod = {
  absentees: LessonLogAbsentee[];
  actualPeriod: number;
  classId: string;
  className: string;
  comment: string | null;
  date: string;
  eventId: string;
  happened: boolean;
  late: boolean;
  lessonTitle: string | null;
  periodNo: number;
  ppctPeriod: number;
  status: "PENDING" | "CONFIRMED";
  subjectId?: string | null;
  subjectName: string;
  teacherName?: string | null;
  version: number;
};

export type AttendanceStudent = { id: string; name: string };
export type MarkMap = Record<string, AttendanceMark>;

export const periodKey = (period: Pick<LessonLogPeriod, "date" | "eventId" | "periodNo">) =>
  `${period.eventId}:${period.date}:${period.periodNo}`;

/** The server only stores absences, so everyone not listed starts as present (default "Có mặt"). */
export function initialMarks(students: readonly AttendanceStudent[], absentees: readonly LessonLogAbsentee[]): MarkMap {
  const absent = new Map(absentees.map((item) => [item.studentId, item.excused]));
  return Object.fromEntries(students.map((student) => [
    student.id,
    absent.has(student.id) ? (absent.get(student.id) ? "absentExcused" : "absentUnexcused") : "present",
  ])) as MarkMap;
}

export function countMarks(students: readonly AttendanceStudent[], marks: MarkMap): Record<AttendanceMark, number> {
  const counts: Record<AttendanceMark, number> = { absentExcused: 0, absentUnexcused: 0, late: 0, present: 0 };
  for (const student of students) counts[marks[student.id] ?? "present"] += 1;
  return counts;
}

export type RailGroup = {
  classId: string;
  className: string;
  eventId: string;
  key: string;
  periods: LessonLogPeriod[];
  subjectName: string;
};

/** Consecutive periods of the same event merge into one card ("Tiết 1–2"). */
export function groupPeriods(periods: readonly LessonLogPeriod[]): RailGroup[] {
  const sorted = [...periods].sort((a, b) => a.periodNo - b.periodNo);
  const groups: RailGroup[] = [];
  for (const period of sorted) {
    const last = groups[groups.length - 1];
    const prev = last?.periods[last.periods.length - 1];
    if (last && last.eventId === period.eventId && prev && prev.periodNo + 1 === period.periodNo) {
      last.periods.push(period);
      continue;
    }
    groups.push({
      classId: period.classId,
      className: period.className,
      eventId: period.eventId,
      key: `${period.eventId}:${period.periodNo}`,
      periods: [period],
      subjectName: period.subjectName,
    });
  }
  return groups;
}

export function periodRangeLabel(periods: readonly Pick<LessonLogPeriod, "periodNo">[]): string {
  const first = periods[0]?.periodNo;
  const last = periods[periods.length - 1]?.periodNo;
  if (first === undefined || last === undefined) return "";
  return first === last ? `Tiết ${first}` : `Tiết ${first}–${last}`;
}

export type SaveAttendanceAndLogInput = {
  actualPeriod: number;
  comment?: string;
  date: string;
  eventId: string;
  expectedVersion?: number;
  periodNo: number;
  records: Array<{ status: string; studentId: string }>;
};

export function buildSaveInput(
  period: Pick<LessonLogPeriod, "date" | "eventId" | "periodNo" | "version">,
  students: readonly AttendanceStudent[],
  marks: MarkMap,
  log: { actualPeriod: number; comment: string },
): SaveAttendanceAndLogInput {
  const comment = log.comment.trim();
  return {
    actualPeriod: log.actualPeriod,
    ...(comment ? { comment } : {}),
    date: period.date,
    eventId: period.eventId,
    expectedVersion: period.version,
    periodNo: period.periodNo,
    records: students.map((student) => ({ status: toApiStatus(marks[student.id] ?? "present"), studentId: student.id })),
  };
}

/** Positive = teaching behind the PPCT. */
export function ppctLag(period: Pick<LessonLogPeriod, "actualPeriod" | "ppctPeriod">): number {
  return period.ppctPeriod - period.actualPeriod;
}

/**
 * Outbox key = eventId + date + periodNo, plus a content hash so a corrected re-save of the same
 * period is queued instead of failing as an idempotency conflict.
 */
export function saveIdempotencyKey(input: SaveAttendanceAndLogInput): string {
  const body = JSON.stringify([input.records, input.actualPeriod, input.comment ?? ""]);
  let hash = 5381;
  for (let i = 0; i < body.length; i += 1) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0;
  return `attendance-log:${input.eventId}:${input.date}:${input.periodNo}:${hash.toString(36)}`;
}

export const toJsonPayload = (input: SaveAttendanceAndLogInput) => input as unknown as JsonValue;

const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

/** "Thứ 5 12/11" from yyyy-MM-dd, parsed as a local date so GMT+7 does not shift the day. */
export function shortDateLabel(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return "";
  const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${WEEKDAYS[day.getDay()]} ${m[3]}/${m[2]}`;
}
