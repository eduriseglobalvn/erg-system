import type { ChipProps } from "@mui/material/Chip";

export type ExerciseStatus = "published" | "draft" | "archived";
export type ExerciseDifficulty = "easy" | "medium" | "hard";
export type ExerciseType = "quiz" | "practice" | "project" | "exam";
export type ExerciseSource = "system" | "teacher";

export type Exercise = {
  id: string;
  title: string;
  subject: string;
  level: string;
  classTargets: string[];
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  status: ExerciseStatus;
  questionCount: number;
  durationMinutes: number;
  updatedAt: string;
  assignedCount: number;
  tags: string[];
  source?: ExerciseSource;
  authorName?: string;
  questionIds?: string[];
};

export type ExerciseFilters = {
  searchTerm: string;
  subject: string;
  level: string;
  difficulty: string;
  type: string;
  status: ExerciseStatus | typeof allExerciseFilter;
  source?: "all" | ExerciseSource;
};

export const allExerciseFilter = "all";

export const statusLabels: Record<ExerciseStatus, string> = {
  published: "Đã xuất bản",
  draft: "Bản nháp",
  archived: "Lưu trữ",
};

export const difficultyLabels: Record<ExerciseDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export const typeLabels: Record<ExerciseType, string> = {
  quiz: "Trắc nghiệm",
  practice: "Tự luyện",
  project: "Dự án",
  exam: "Đề kiểm tra",
};

export const statusTones: Record<ExerciseStatus, "success" | "warning" | "outline"> = {
  published: "success",
  draft: "warning",
  archived: "outline",
};

export const difficultyTones: Record<ExerciseDifficulty, "secondary" | "warning" | "danger"> = {
  easy: "secondary",
  medium: "warning",
  hard: "danger",
};

export type BadgeTone = "success" | "warning" | "danger" | "secondary" | "primary" | "default" | "info" | "outline";

export function chipPropsForTone(tone: BadgeTone): Pick<ChipProps, "color" | "variant"> {
  if (tone === "success") return { color: "success" };
  if (tone === "warning") return { color: "warning" };
  if (tone === "danger") return { color: "error" };
  if (tone === "secondary") return { color: "secondary" };
  if (tone === "info") return { color: "info" };
  if (tone === "outline") return { variant: "outlined" };
  return { color: "primary" };
}

export function uniqueExerciseValues(items: Exercise[], key: "subject" | "level") {
  return Array.from(new Set(items.map((exercise) => exercise[key]))).sort();
}

export function filterExercises(filters: ExerciseFilters, sourceList: Exercise[]) {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase();
  return sourceList.filter((exercise) => {
    const matchesSearch = !normalizedSearch
      || exercise.title.toLowerCase().includes(normalizedSearch)
      || exercise.subject.toLowerCase().includes(normalizedSearch)
      || exercise.level.toLowerCase().includes(normalizedSearch)
      || exercise.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
    return matchesSearch
      && (filters.subject === allExerciseFilter || exercise.subject === filters.subject)
      && (filters.level === allExerciseFilter || exercise.level === filters.level)
      && (filters.difficulty === allExerciseFilter || exercise.difficulty === filters.difficulty)
      && (filters.type === allExerciseFilter || exercise.type === filters.type)
      && (filters.status === allExerciseFilter || exercise.status === filters.status)
      && (!filters.source || filters.source === "all" || (exercise.source ?? "system") === filters.source);
  });
}

export function summarizeExercises(filtered: Exercise[], allItems: Exercise[]) {
  return {
    all: allItems.length,
    published: allItems.filter((exercise) => exercise.status === "published").length,
    draft: allItems.filter((exercise) => exercise.status === "draft").length,
    archived: allItems.filter((exercise) => exercise.status === "archived").length,
    visible: filtered.length,
  };
}
