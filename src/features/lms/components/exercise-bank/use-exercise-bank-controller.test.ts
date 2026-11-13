import { describe, expect, it } from "vitest";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";

import { quizToExercise } from "./use-exercise-bank-controller";

const quiz = (updatedAt: string) => ({ id: "q1", title: "Quiz", kind: "quiz", status: "ready", subjectId: "math", subjectLabel: "Toán", levelId: "6", levelLabel: "Lớp 6", topicLabels: [], questionIds: [], questionCount: 5, ownerLabel: "Giáo viên", updatedAt }) as unknown as QuizBankItem;

describe("quizToExercise", () => {
  it("keeps the day of the dd/MM/yyyy label the bank mapper produces", () => {
    const exercise = quizToExercise(quiz("05/11/2026"));
    expect(exercise.updatedAt).toBe("2026-11-05");
    expect(formatDateVi(exercise.updatedAt)).toBe("05/11/2026");
  });

  it("shows no date rather than a made-up one when the quiz has none", () => {
    expect(formatDateVi(quizToExercise(quiz("")).updatedAt)).toBe("");
  });
});
