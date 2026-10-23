import type { ChipProps } from "@mui/material/Chip";

export type ExerciseStatus = "published" | "draft" | "archived";
export type ExerciseDifficulty = "easy" | "medium" | "hard";
export type ExerciseType = "quiz" | "practice" | "project" | "exam";

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
};

export type ExerciseFilters = {
  searchTerm: string;
  subject: string;
  level: string;
  difficulty: string;
  type: string;
  status: ExerciseStatus | typeof allExerciseFilter;
};

export const allExerciseFilter = "all";

export const exercises: Exercise[] = [
  {
    id: "ex-001",
    title: "IC3 GS6 - Ôn tập máy tính căn bản",
    subject: "IC3 GS6",
    level: "Level 1",
    classTargets: ["IC3 GS6 Level 1 - Tối 2/4", "MOS Excel 2021 - Cuối tuần"],
    type: "quiz",
    difficulty: "easy",
    status: "published",
    questionCount: 25,
    durationMinutes: 35,
    updatedAt: "2026-06-02",
    assignedCount: 4,
    tags: ["IC3", "Computer basics", "Trắc nghiệm"],
  },
  {
    id: "ex-002",
    title: "MOS Excel - Hàm IF, SUMIF, COUNTIF",
    subject: "MOS",
    level: "Intermediate",
    classTargets: ["MOS Excel 2021 - Cuối tuần"],
    type: "practice",
    difficulty: "medium",
    status: "published",
    questionCount: 18,
    durationMinutes: 45,
    updatedAt: "2026-06-01",
    assignedCount: 2,
    tags: ["Excel", "Hàm điều kiện"],
  },
  {
    id: "ex-003",
    title: "Scratch - Dự án mê cung",
    subject: "Scratch",
    level: "Thiếu nhi",
    classTargets: ["Scratch thiếu nhi - Sáng T7"],
    type: "project",
    difficulty: "medium",
    status: "draft",
    questionCount: 6,
    durationMinutes: 60,
    updatedAt: "2026-05-29",
    assignedCount: 0,
    tags: ["Scratch", "Game", "Dự án"],
  },
  {
    id: "ex-004",
    title: "Python Junior - Vòng lặp và danh sách",
    subject: "Python",
    level: "Junior",
    classTargets: ["Python Junior - Chiều CN"],
    type: "practice",
    difficulty: "easy",
    status: "published",
    questionCount: 20,
    durationMinutes: 40,
    updatedAt: "2026-05-28",
    assignedCount: 3,
    tags: ["Python", "Loop", "List"],
  },
  {
    id: "ex-005",
    title: "Tin học trẻ - Mini contest thuật toán",
    subject: "Tin học trẻ",
    level: "Đội tuyển",
    classTargets: ["Python Junior - Chiều CN", "Scratch thiếu nhi - Sáng T7"],
    type: "exam",
    difficulty: "hard",
    status: "published",
    questionCount: 5,
    durationMinutes: 90,
    updatedAt: "2026-05-25",
    assignedCount: 1,
    tags: ["Contest", "Algorithm"],
  },
  {
    id: "ex-006",
    title: "AI cơ bản - Prompt tốt và prompt chưa tốt",
    subject: "AI",
    level: "Foundation",
    classTargets: ["IC3 GS6 Level 1 - Tối 2/4"],
    type: "quiz",
    difficulty: "easy",
    status: "draft",
    questionCount: 12,
    durationMinutes: 25,
    updatedAt: "2026-05-22",
    assignedCount: 0,
    tags: ["AI", "Prompt"],
  },
  {
    id: "ex-007",
    title: "MOS PowerPoint - Thiết kế slide báo cáo",
    subject: "MOS",
    level: "Foundation",
    classTargets: ["MOS Excel 2021 - Cuối tuần"],
    type: "project",
    difficulty: "medium",
    status: "archived",
    questionCount: 8,
    durationMinutes: 50,
    updatedAt: "2026-05-12",
    assignedCount: 5,
    tags: ["PowerPoint", "Presentation"],
  },
];

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

export function uniqueExerciseValues(key: "subject" | "level") {
  return Array.from(new Set(exercises.map((exercise) => exercise[key]))).sort();
}

export function filterExercises(filters: ExerciseFilters) {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase();
  return exercises.filter((exercise) => {
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
      && (filters.status === allExerciseFilter || exercise.status === filters.status);
  });
}

export function summarizeExercises(filtered: Exercise[]) {
  return {
    all: exercises.length,
    published: exercises.filter((exercise) => exercise.status === "published").length,
    draft: exercises.filter((exercise) => exercise.status === "draft").length,
    visible: filtered.length,
  };
}
