import type { CurriculumTeachingPlan } from "@/features/lms/api/curriculum-teaching-plan-api";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export type CurriculumScheduleRow = {
  id: string;
  level: string;
  topic: string;
  lesson: string;
  period: number;
  plannedDate: string;
  state: "past" | "current" | "upcoming";
};

export type EditableCurriculumProgramRow = {
  topic: string;
  period: number;
  title: string;
  sessions: number;
};

export function buildEditableCurriculumProgramRows(stage?: CurriculumRoadmapStage): EditableCurriculumProgramRow[] {
  if (!stage) return [];
  return stage.topics.flatMap((topic) => topic.lessons.map((lesson) => ({
    topic: topic.title,
    period: 0,
    title: lesson.folder.title,
    sessions: 1,
  }))).map((row, index) => ({ ...row, period: index + 1 }));
}

export function buildCurriculumScheduleRows(
  stages: CurriculumRoadmapStage[],
  plan: Pick<CurriculumTeachingPlan, "startDate" | "teachingDays" | "sessionsPerDay">,
  today = new Date(),
): CurriculumScheduleRow[] {
  const lessons = stages.flatMap((stage) => stage.topics.flatMap((topic) =>
    topic.lessons.map((lesson) => ({
      id: lesson.folder.id,
      level: stage.level.title,
      topic: topic.title,
      lesson: lesson.folder.title,
    })),
  ));
  const dates = projectTeachingDates(plan, lessons.length);
  const todayKey = formatDate(today);

  return lessons.map((lesson, index) => ({
    ...lesson,
    period: index + 1,
    plannedDate: dates[index] ?? "",
    state: dates[index] === todayKey ? "current" : (dates[index] ?? "") < todayKey ? "past" : "upcoming",
  }));
}

export function projectTeachingDates(
  plan: Pick<CurriculumTeachingPlan, "startDate" | "teachingDays" | "sessionsPerDay">,
  lessonCount: number,
): string[] {
  if (!lessonCount || !plan.teachingDays.length || plan.sessionsPerDay < 1) return [];
  const current = parseDate(plan.startDate);
  const dates: string[] = [];
  for (let guard = 0; dates.length < lessonCount && guard < 3660; guard += 1) {
    if (plan.teachingDays.includes(current.getDay())) {
      for (let session = 0; session < plan.sessionsPerDay && dates.length < lessonCount; session += 1) {
        dates.push(formatDate(current));
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
