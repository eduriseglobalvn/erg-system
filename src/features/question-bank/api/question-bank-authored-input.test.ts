import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { buildAuthoredQuestionInput } from "./question-bank-authored-input";

const base = { id: "q", title: " Đề ", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };

describe("buildAuthoredQuestionInput", () => {
  it("keeps the whole question in content and fills choices and answer for choice kinds", () => {
    const question: Question = {
      ...base,
      kind: "multiple_response",
      choices: [
        { id: "a", label: "A", correct: true },
        { id: "b", label: "", correct: false },
        { id: "c", label: "C", correct: true },
      ],
    };
    const input = buildAuthoredQuestionInput(question);
    expect(input).toMatchObject({ type: "multiple_response", stem: "Đề", answer: ["A", "C"] });
    expect(input.choices).toHaveLength(2);
    expect(input.content).toEqual({ runtimeQuestion: question });
  });

  it("sends other kinds with content only, and maps inline_choice to the bank id", () => {
    const input = buildAuthoredQuestionInput({ ...base, kind: "inline_choice" });
    expect(input.type).toBe("select_from_lists");
    expect(input.choices).toBeUndefined();
  });
});
