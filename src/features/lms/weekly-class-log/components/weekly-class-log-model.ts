import { formatDateVi } from "@/lib/format-date";
import type {
  WeeklyClassLogPeriod,
  WeeklyClassLogSummary,
  WeeklyClassLogWeek,
} from "@/features/lms/weekly-class-log/types/weekly-class-log-types";

export type PeriodCompletionState = "empty" | "complete" | "incomplete";

/**
 * No weekly-class-log read/write contract exists on the server yet, so the page shows an honest
 * empty state instead of an editable grid whose data would be lost on reload. Flip when the API ships.
 */
export const WEEKLY_CLASS_LOG_SERVER_CONTRACT = false;

const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];
const PERIODS_PER_DAY = 10;

/** Monday 00:00 (local) of the ISO week containing `date`. */
export function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export function addWeeks(monday: Date, weeks: number) {
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weeks * 7);
}

/** ISO 8601 week number (week 1 contains the year's first Thursday). */
export function isoWeekNumber(date: Date) {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7));
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function currentWeekStart(now: Date = new Date()) {
  return mondayOf(now);
}

function localInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function blankPeriod(id: string): WeeklyClassLogPeriod {
  return {
    id, className: "", subject: "", ppct: "", absent: "", lesson: "", comment: "",
    learningScore: "", disciplineScore: "", hygieneScore: "", totalScore: "", teacherSignature: "",
  };
}

/** An empty week for the ISO week starting on `monday`; dates are real dd/MM/yyyy values. */
export function buildBlankWeek(monday: Date): WeeklyClassLogWeek {
  const id = `week-${localInputDate(monday)}`;
  return {
    id,
    label: `Tuần ${isoWeekNumber(monday)}`,
    fromDate: formatDateVi(monday),
    toDate: formatDateVi(addWeeks(monday, 1).getTime() - 24 * 60 * 60 * 1000),
    status: "draft",
    days: WEEKDAY_LABELS.map((label, dayIndex) => ({
      id: `${id}-day-${dayIndex + 2}`,
      label,
      date: formatDateVi(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayIndex)),
      periods: Array.from({ length: PERIODS_PER_DAY }, (_, periodIndex) => blankPeriod(`${id}-day-${dayIndex + 2}-period-${periodIndex + 1}`)),
    })),
    summary: {
      absence: "", late: "", otherViolation: "", finalScore: "", learning: "", discipline: "", hygiene: "",
      deduction: "", average: "", goodWeek: "", rank: "", unsignedSubjects: "", subjectNotes: "",
      subjectTeacherProposal: "", homeroomTeacherOpinion: "",
    },
  };
}

export function normalizeWeekSignatures(week: WeeklyClassLogWeek, teacherName: string) {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        teacherSignature: getTeacherSignature(period, teacherName),
      })),
    })),
  };
}

export function getTeacherSignature(period: WeeklyClassLogPeriod, teacherName: string) {
  return isPeriodComplete(period) ? teacherName : "";
}

function isPeriodComplete(period: WeeklyClassLogPeriod) {
  return Boolean(
    period.className.trim()
      && period.ppct.trim()
      && period.lesson.trim()
      && period.comment.trim()
      && period.disciplineScore.trim(),
  );
}

export function getPeriodCompletionState(period: WeeklyClassLogPeriod): PeriodCompletionState {
  const requiredValues = [period.className, period.ppct, period.lesson, period.comment, period.disciplineScore];
  const hasAnyValue = [...requiredValues, period.absent].some((value) => value.trim());
  if (!hasAnyValue) return "empty";
  return requiredValues.every((value) => value.trim()) ? "complete" : "incomplete";
}

export function buildWeeklySummary(week: WeeklyClassLogWeek): WeeklyClassLogSummary {
  const periods = week.days.flatMap((day) => day.periods);
  const filledPeriods = periods.filter((period) => period.className || period.ppct || period.lesson || period.comment || period.absent);
  const signedPeriods = filledPeriods.filter((period) => period.teacherSignature);
  const absentNotes = periods.map((period) => period.absent.trim()).filter(Boolean);
  const notAchievedCount = periods.filter((period) => period.disciplineScore === "Chưa đạt").length;
  const achievedCount = periods.filter((period) => period.disciplineScore === "Đạt").length;

  return {
    ...week.summary,
    absence: absentNotes.length ? absentNotes.join("; ") : "Không ghi nhận",
    late: "Không ghi nhận",
    otherViolation: notAchievedCount ? `${notAchievedCount} tiết chưa đạt` : "Không ghi nhận",
    finalScore: "",
    learning: "",
    discipline: filledPeriods.length ? `${achievedCount}/${filledPeriods.length} tiết đạt` : "",
    hygiene: "",
    deduction: notAchievedCount ? String(notAchievedCount) : "0",
    average: "",
    goodWeek: filledPeriods.length && notAchievedCount === 0 ? "Đạt" : "Chưa đủ dữ liệu",
    rank: "",
    unsignedSubjects: String(Math.max(0, filledPeriods.length - signedPeriods.length)),
    subjectNotes: selectedClassesFromPeriods(periods),
    subjectTeacherProposal: week.summary.subjectTeacherProposal || "",
    homeroomTeacherOpinion: week.summary.homeroomTeacherOpinion || "",
  };
}

function selectedClassesFromPeriods(periods: WeeklyClassLogPeriod[]) {
  return Array.from(new Set(periods.map((period) => period.className.trim()).filter(Boolean))).join(", ");
}

export function compactWeekDateRange(week: WeeklyClassLogWeek) {
  return `${week.fromDate.slice(0, 5)} - ${week.toDate.slice(0, 5)}`;
}
