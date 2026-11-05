import { describe, expect, it } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";

let n = 0;
const createId = (prefix: string) => `${prefix}-${++n}`;
const build = (type: Parameters<typeof buildQuestionSlide>[0]) =>
  buildQuestionSlide(type, createNewQuizProjectSettings(), createId);

describe("buildQuestionSlide", () => {
  it("starts a multiple-choice question empty", () => {
    const slide = build("multiple-choice");
    expect(slide.title).toBe("");
    expect(slide.choices).toHaveLength(3);
    expect(slide.choices!.every((choice) => choice.label === "" && !choice.correct)).toBe(true);
  });

  it("starts multiple-response empty too", () => {
    const slide = build("multiple-response");
    expect(slide.choices!.every((choice) => choice.label === "" && !choice.correct)).toBe(true);
  });

  it("gives true-false fixed labels and no correct answer", () => {
    const slide = build("true-false");
    expect(slide.choices!.map((choice) => choice.label)).toEqual(["Đúng", "Sai"]);
    expect(slide.choices!.some((choice) => choice.correct)).toBe(false);
  });

});
