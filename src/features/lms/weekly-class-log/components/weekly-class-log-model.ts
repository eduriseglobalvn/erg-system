import { weeklyClassLogWeeks } from "@/features/lms/weekly-class-log/api/mock-weekly-class-log-data";
import type {
  WeeklyClassLogPeriod,
  WeeklyClassLogSummary,
  WeeklyClassLogWeek,
} from "@/features/lms/weekly-class-log/types/weekly-class-log-types";

export type PeriodCompletionState = "empty" | "complete" | "incomplete";

export function loadStoredWeeks() {
  // The server endpoint is not published yet. Keep fixtures in memory only;
  // the controller may hydrate an encrypted, scope-bound draft when a server
  // capability is explicitly supplied.
  return migrateWeeks(weeklyClassLogWeeks);
}

export function migrateWeeks(weeks: WeeklyClassLogWeek[]) {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        className: period.className || period.subject || "",
        subject: "",
        learningScore: "",
        hygieneScore: "",
        totalScore: "",
        disciplineScore: normalizeDisciplineValue(period.disciplineScore),
        teacherSignature: "",
      })),
    })),
  }));
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

export function normalizeDisciplineValue(value: string) {
  if (value === "Đạt") return "Đạt";
  if (value === "Chưa đạt") return "Chưa đạt";
  return value ? "Đạt" : "";
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
