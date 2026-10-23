import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

export type ScoreColumn = {
  id: string;
  label: string;
  maxScore: number;
  kind: "topic" | "quiz" | "offline";
};

export type ScoreAttempt = {
  id: string;
  score: number;
  duration: string;
  takenAt: string;
};

export type Classification = "A" | "B" | "C" | "D" | "E";
export type ClassificationSort = "asc" | "desc" | null;
export type StudentState = "active" | "disabled";

export type StudentScoreDraft = {
  name: string;
  username: string;
  password: string;
  state: StudentState;
  note: string;
};

export const baseScoreColumns: ScoreColumn[] = [
  { id: "topic-tech", label: "Căn bản CN", maxScore: 1000, kind: "topic" },
  { id: "topic-citizen", label: "Công dân số", maxScore: 1000, kind: "topic" },
  { id: "topic-info", label: "QL thông tin", maxScore: 1000, kind: "topic" },
  { id: "topic-content", label: "Sáng tạo ND", maxScore: 1000, kind: "topic" },
  { id: "topic-communication", label: "Giao tiếp", maxScore: 1000, kind: "topic" },
  { id: "topic-collab", label: "Cộng tác", maxScore: 1000, kind: "topic" },
  { id: "topic-security", label: "An toàn", maxScore: 1000, kind: "topic" },
  { id: "review-01", label: "Ôn thi IC3", maxScore: 1000, kind: "quiz" },
];

export const classificationOptions: Classification[] = ["A", "B", "C", "D", "E"];

export function getMockAttempts(
  student: ClassroomStudent,
  column: ScoreColumn,
  studentIndex: number,
  columnIndex: number,
): ScoreAttempt[] {
  if ((studentIndex + columnIndex) % 6 === 0) return [];
  const count = ((studentIndex + columnIndex) % 4) + 1;
  return Array.from({ length: count }, (_, attemptIndex) => {
    const base = student.averageScore / 10 + ((columnIndex % 3) - 1) * 0.55 - attemptIndex * 0.25;
    const rawScore = (base / 10) * column.maxScore;
    const score = Math.max(
      0,
      Math.min(column.maxScore, column.maxScore >= 100 ? Math.round(rawScore) : Math.round(rawScore * 10) / 10),
    );
    return {
      id: `${student.id}-${column.id}-${attemptIndex}`,
      score,
      duration: `${18 + ((studentIndex + attemptIndex * 7) % 32)} phút`,
      takenAt: `${String(18 + attemptIndex).padStart(2, "0")}/05/2026`,
    };
  });
}

export function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function getStudentClassification(
  student: ClassroomStudent,
  manual: Record<string, Classification>,
): Classification {
  if (manual[student.id]) return manual[student.id];
  if (student.averageScore >= 90) return "A";
  if (student.averageScore >= 80) return "B";
  if (student.averageScore >= 70) return "C";
  if (student.averageScore >= 60) return student.status === "support" ? "E" : "D";
  return "E";
}

export function getClassificationBg(classification: Classification) {
  const colors: Record<Classification, string> = {
    A: "#dcfce7",
    B: "#dbeafe",
    C: "#fef3c7",
    D: "#fed7aa",
    E: "#fee2e2",
  };
  return colors[classification];
}

export function getClassificationColor(classification: Classification) {
  const colors: Record<Classification, string> = {
    A: "#16a34a",
    B: "#2563eb",
    C: "#d97706",
    D: "#ea580c",
    E: "#dc2626",
  };
  return colors[classification];
}

export function getClassificationBorder(classification: Classification) {
  const colors: Record<Classification, string> = {
    A: "#bbf7d0",
    B: "#bfdbfe",
    C: "#fde68a",
    D: "#fdba74",
    E: "#fecaca",
  };
  return colors[classification];
}

export function getClassificationChipSx(classification: Classification) {
  return {
    backgroundColor: getClassificationBg(classification),
    color: getClassificationColor(classification),
    fontWeight: 700,
    fontSize: 14,
  };
}

export function getScoreBg(score: number | undefined, maxScore: number) {
  if (score === undefined) return "white";
  const rate = score / maxScore;
  if (rate < 0.5) return "#fee2e2";
  if (rate >= 0.8) return "#dcfce7";
  return "white";
}

export function createScoreStudentDraft(student: ClassroomStudent, state: StudentState): StudentScoreDraft {
  return {
    name: student.name,
    username: student.name.toLowerCase().replace(/[^a-z0-9]+/g, "."),
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    state,
    note: student.mentorNote,
  };
}
