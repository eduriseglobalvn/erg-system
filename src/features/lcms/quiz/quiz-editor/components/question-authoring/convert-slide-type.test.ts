import { describe, expect, it } from "vitest";

import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { convertSlideType } from "./convert-slide-type";

const choices = (n: number, correct: number[]) =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, label: `L${i}`, correct: correct.includes(i) }));
const make = (kind: string, n: number, correct: number[]) =>
  ({
    id: "s1", title: "T", kind, options: { score: 7 }, status: "draft",
    feedbackRows: [{ kind: "correct", score: 7, feedback: "ok" }],
    choices: [{ ...choices(n, correct)[0], media: { type: "image", src: "u", alt: "a" } }, ...choices(n, correct).slice(1)],
    runtimeQuestion: {
      id: "s1", kind: "multiple_response", title: "T", points: 7, instructions: "ins",
      feedback: { correct: "ok", incorrect: "no", partial: "no" },
      choices: [{ ...choices(n, correct)[0], image: { url: "u", alt: "a" } }, ...choices(n, correct).slice(1)],
    },
  }) as unknown as QuizEditorSlide;
const fresh = (kind: string) => ({ id: "new", title: "", kind, choices: [], options: { score: 1 } }) as unknown as QuizEditorSlide;

describe("convertSlideType", () => {
  it("carries choices and runtime points between choice types", () => {
    const slide = make("multiple-choice", 3, [1]);
    const out = convertSlideType(slide, "multiple-response", fresh("multiple-response"));
    expect(out.dropsAnswers).toBe(false);
    expect(out.slide.kind).toBe("multiple-response");
    expect(out.slide.runtimeQuestion).toMatchObject({ kind: "multiple_response", points: 7, instructions: "ins" });
    expect(out.slide.feedbackRows).toEqual(slide.feedbackRows);
  });

  it("multiple with two correct to single keeps the first correct on slide and runtime and drops answers", () => {
    const out = convertSlideType(make("multiple-response", 3, [0, 2]), "multiple-choice", fresh("multiple-choice"));
    expect(out.dropsAnswers).toBe(true);
    expect(out.slide.choices?.map((c) => c.correct)).toEqual([true, false, false]);
    expect(out.slide.runtimeQuestion?.choices?.map((c) => c.correct)).toEqual([true, false, false]);
    expect(out.slide.runtimeQuestion?.kind).toBe("single_choice");
    expect(out.slide.runtimeQuestion?.choices?.[0].image).toEqual({ url: "u", alt: "a" });
  });

  it("two-choice source to true-false carries; a three-choice source is a drop", () => {
    expect(convertSlideType(make("multiple-response", 2, [1]), "true-false", fresh("true-false")).dropsAnswers).toBe(false);
    const drop = convertSlideType(make("multiple-response", 3, [1]), "true-false", fresh("true-false"));
    expect(drop.dropsAnswers).toBe(true);
    expect(drop.slide.choices).toEqual([]);
  });

  it("drops answers for other changes but keeps identity, scores and settings", () => {
    const slide = make("multiple-response", 2, [0]);
    const out = convertSlideType(slide, "matching", fresh("matching"));
    expect(out.dropsAnswers).toBe(true);
    expect(out.slide.kind).toBe("matching");
    expect(out.slide.runtimeQuestion).toBeUndefined();
    expect(out.slide.id).toBe("s1");
    expect(out.slide.options).toEqual(slide.options);
    expect(out.slide.feedbackRows).toEqual(slide.feedbackRows);
    expect(out.slide.status).toBe("draft");
  });

  it.each(["multiple-response", "matching"] as const)("keeps the question-set points and shuffle setting when changing to %s", (next) => {
    const slide = { ...make("multiple-choice", 2, [0]), questionSetSettings: { points: 7, shuffleChoices: false } } as QuizEditorSlide;
    expect(convertSlideType(slide, next, fresh(next)).slide.questionSetSettings).toEqual({ points: 7, shuffleChoices: false });
  });
});
