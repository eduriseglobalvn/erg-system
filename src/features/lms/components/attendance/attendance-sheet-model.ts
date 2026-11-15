import type { ClassroomStudent } from "@/domain/school/classroom-types";
import type { CurriculumTreeSubject } from "@/features/lms/api/curriculum-tree-api";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "";

export type AttendanceColumn = {
  id: string;
  day: string;
  date: string;
  fullDate: string;
  isFocusDate: boolean;
  isFutureDate: boolean;
  lessonIndex: number;
  session: string;
};

export type CurriculumItem = { topic: string; period: number; title: string };
export type CurriculumTeachingPlan = { startDate: string; teachingDays: number[]; sessionsPerDay: number };

export type AttendanceStudentDraft = {
  name: string;
  username: string;
  password: string;
  status: string;
  note: string;
};

export const DEFAULT_TEACHING_PLAN: CurriculumTeachingPlan = {
  startDate: "2026-05-29",
  teachingDays: [2, 4, 6],
  sessionsPerDay: 2,
};

export function curriculumProgramFromTree(subject?: CurriculumTreeSubject): CurriculumItem[] {
  if (!subject) return [];
  let period = 0;
  return [...subject.levels]
    .sort((left, right) => (left.level.sortOrder ?? 0) - (right.level.sortOrder ?? 0))
    .flatMap((level) => [...level.topics]
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((topic) => ({ topic: level.level.name, period: ++period, title: topic.name })));
}

export function getCurriculumTopicSpans(items: CurriculumItem[]) {
  const counts = new Map<string, number>();
  const firstRows = new Map<string, number>();
  items.forEach((item, index) => {
    counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
    if (!firstRows.has(item.topic)) firstRows.set(item.topic, index);
  });
  return { counts, firstRows };
}

export function buildAttendanceColumns(focusDateValue: string): AttendanceColumn[] {
  const focusDate = minDate(parseDateInput(focusDateValue), todayStart());
  const startDate = addDays(focusDate, -3);
  const attendedDayCount = daysBetween(startDate, focusDate) + 1;
  const attendedColumns = Array.from({ length: attendedDayCount }).flatMap((_, index) =>
    buildAttendanceColumnsForDate(addDays(startDate, index), focusDate),
  );
  const futureColumns: AttendanceColumn[] = [];
  for (let offset = 1; futureColumns.length < 5; offset += 1) {
    const nextColumns = buildAttendanceColumnsForDate(addDays(focusDate, offset), focusDate);
    futureColumns.push(...nextColumns.slice(0, 5 - futureColumns.length));
  }
  return [...attendedColumns, ...futureColumns];
}

function buildAttendanceColumnsForDate(currentDate: Date, focusDate: Date): AttendanceColumn[] {
  const id = formatInputDate(currentDate);
  return lessonsForDate(currentDate).map((session, lessonIndex) => ({
    id: `${id}-${lessonIndex + 1}`,
    day: weekdayLabel(currentDate),
    date: formatShortDate(currentDate),
    fullDate: formatFullDate(currentDate),
    isFocusDate: isSameDate(currentDate, focusDate),
    isFutureDate: currentDate > todayStart(),
    lessonIndex: lessonIndex + 1,
    session,
  }));
}

function lessonsForDate(date: Date): string[] {
  const day = date.getDay();
  if (day === 0) return ["Tiết 1"];
  if (day === 2 || day === 4 || day === 6) return ["Tiết 1", "Tiết 2"];
  return ["Tiết 1"];
}

export function countLessonsThroughDate(selectedDateValue: string, plan = DEFAULT_TEACHING_PLAN) {
  const startDate = parseDateInput(plan.startDate);
  const endDate = minDate(parseDateInput(selectedDateValue), todayStart());
  if (endDate < startDate) return 0;
  let total = 0;
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
    total += plan.teachingDays.includes(currentDate.getDay()) ? plan.sessionsPerDay : 0;
  }
  return total;
}

export function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

export function nextAttendanceStatus(status: AttendanceStatus): Exclude<AttendanceStatus, ""> {
  if (status === "present") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

export function attendanceLabel(status: AttendanceStatus) {
  if (!status) return "—";
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

export function attendanceText(status: AttendanceStatus) {
  if (!status) return "Chưa điểm danh";
  if (status === "absent") return "Vắng";
  if (status === "late") return "Đi muộn";
  if (status === "excused") return "Có phép";
  return "Có mặt";
}

const attendanceTint = {
  present: ergEnterpriseTokens.statusTint.success,
  late: ergEnterpriseTokens.statusTint.warning,
  absent: ergEnterpriseTokens.statusTint.error,
  excused: ergEnterpriseTokens.statusTint.info,
};

export function getAttendanceBgColor(status: AttendanceStatus, isFocusDate: boolean) {
  if (!status) return isFocusDate ? ergEnterpriseTokens.color.surfaceSubtle : ergEnterpriseTokens.color.surface;
  return attendanceTint[status].bg;
}

export function getAttendanceTextColor(status: AttendanceStatus) {
  return status ? attendanceTint[status].color : ergEnterpriseTokens.color.textSoft;
}

/** Cells that still have no status; "Tất cả có mặt" fills only these so already-marked exceptions survive. */
export function bulkPresentTargets(
  students: ReadonlyArray<{ id: string }>,
  columns: readonly AttendanceColumn[],
  getStatus: (studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) => AttendanceStatus,
) {
  const targets: Array<{ studentId: string; columnId: string }> = [];
  students.forEach((student, studentIndex) => {
    columns.forEach((column, columnIndex) => {
      if (!column.isFutureDate && !getStatus(student.id, studentIndex, column, columnIndex)) {
        targets.push({ studentId: student.id, columnId: column.id });
      }
    });
  });
  return targets;
}

export function attendanceSummary(statuses: AttendanceStatus[]) {
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}

export function createAttendanceStudentDraft(student: ClassroomStudent): AttendanceStudentDraft {
  return {
    name: student.name,
    username: student.name.toLowerCase().replace(/[^a-z0-9]+/g, "."),
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    status: student.status,
    note: student.mentorNote,
  };
}

function parseDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getTodayInputDate() {
  return formatInputDate(todayStart());
}

export function clampInputDateToToday(value: string) {
  return formatInputDate(minDate(parseDateInput(value), todayStart()));
}

function minDate(firstDate: Date, secondDate: Date) {
  return firstDate <= secondDate ? firstDate : secondDate;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return formatInputDate(firstDate) === formatInputDate(secondDate);
}

function daysBetween(startDate: Date, endDate: Date) {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatFullDate(date: Date) {
  return `${formatShortDate(date)}/${date.getFullYear()}`;
}

function weekdayLabel(date: Date) {
  return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()];
}
