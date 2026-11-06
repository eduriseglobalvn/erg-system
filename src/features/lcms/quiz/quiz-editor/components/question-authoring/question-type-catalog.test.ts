import { describe, expect, it } from "vitest";

import {
  QUESTION_TYPE_CATALOG,
  filterQuestionTypes,
  questionTypeLabel,
} from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const ALL_TYPES: QuestionType[] = [
  "multiple-choice", "multiple-response", "true-false", "likert-scale",
  "fill-in-the-blanks", "select-from-lists", "drag-the-words", "short-answer", "numeric",
  "sequence", "matching", "drag-and-drop", "hotspot", "essay",
];

describe("question type catalog", () => {
  it("has exactly the 14 question types, once each", () => {
    expect(QUESTION_TYPE_CATALOG.map((entry) => entry.type).sort()).toEqual([...ALL_TYPES].sort());
  });

  it("filters ignoring case and diacritics", () => {
    expect(filterQuestionTypes("dap so").map((entry) => entry.type)).toContain("numeric");
    expect(filterQuestionTypes("")).toHaveLength(14);
    expect(filterQuestionTypes("zzzz")).toEqual([]);
  });

  it("labels a type", () => {
    expect(questionTypeLabel("multiple-choice")).toBe("Một đáp án");
  });
});
