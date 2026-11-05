import { describe, expect, it } from "vitest";

import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { useI18n } from "@/platform/i18n";
import { buildDuplicateQuestionInput, buildQuestionQuickViewPreview } from "./question-quick-view-model";

const t = ((key: string) => key) as ReturnType<typeof useI18n>["t"];

const question: QuestionBankQuestion = {
  id: "q-1",
  scope: { type: "center", centerId: "c-1", centerName: "Center 1" },
  subjectId: "ic3",
  subjectLabel: "IC3",
  levelId: "l1",
  levelLabel: "Level 1",
  categoryId: "topic-1",
  categoryLabel: "Hàm",
  gradeLabel: "Level 1",
  type: "multiple-choice",
  difficulty: "core",
  status: "ready",
  stem: "Hàm nào tính tổng?",
  objective: "Nhận biết SUM",
  tags: ["excel"],
  masteryRate: 0,
  usageCount: 0,
  schoolsUsing: 0,
  lastUsedAt: "",
  recommendedCluster: "",
  choices: [
    { id: "a", label: "SUM", correct: true },
    { id: "b", label: "COUNT", correct: false },
  ],
};

describe("buildQuestionQuickViewPreview", () => {
  it("renders choice questions with the correct choice pre-selected", () => {
    const preview = buildQuestionQuickViewPreview(question, t);
    expect(preview?.question.kind).toBe("single_choice");
    const correct = preview?.question.choices?.find((choice) => choice.correct);
    expect(correct?.label).toBe("SUM");
    expect(preview?.answer).toEqual({ choiceId: correct?.id });
  });

  it("falls back when the type or its choices cannot render faithfully", () => {
    expect(buildQuestionQuickViewPreview({ ...question, type: "fill-in-the-blanks" }, t)).toBeNull();
    expect(buildQuestionQuickViewPreview({ ...question, choices: [] }, t)).toBeNull();
  });
});

describe("buildDuplicateQuestionInput", () => {
  it("posts the same content without an id, keeping the center scope", () => {
    const input = buildDuplicateQuestionInput(question);
    expect(input.questionId).toBeUndefined();
    expect(input).toMatchObject({ scopeType: "center", scopeId: "c-1", topicId: "topic-1", stem: question.stem, choices: question.choices });
  });
});
