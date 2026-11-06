import { describe, expect, it } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type { QuestionType, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { convertSlideType } from "./convert-slide-type";
import { readSlideQuestion } from "./slide-question";

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

describe("convertSlideType with the real factory", () => {
  const project = createNewQuizProjectSettings();
  let n = 0;
  const createId = (prefix: string) => `${prefix}-${++n}`;
  const factory = (type: QuestionType) => buildQuestionSlide(type, project, createId);
  // A bank-imported or legacy slide: answers live only on slide.choices, there is no runtimeQuestion.
  const legacy = () => {
    const slide = factory("multiple-choice");
    return {
      ...slide, id: "legacy-1", title: "Thủ đô?",
      feedbackRows: slide.feedbackRows?.map((row) => (row.kind === "correct" ? { ...row, score: 7 } : row)),
      choices: [{ id: "a", label: "Hà Nội", correct: true }, { id: "b", label: "Huế", correct: false }],
    } as QuizEditorSlide;
  };
  const read = (slide: QuizEditorSlide) => readSlideQuestion(slide, ((key: string) => key) as never);

  it.each(["multiple-response", "true-false"] as const)("a legacy slide changed to %s keeps its answers and points", (type) => {
    const slide = legacy();
    expect(slide.runtimeQuestion).toBeUndefined();
    const out = convertSlideType(slide, type, factory(type));
    expect(out.dropsAnswers).toBe(false);
    const question = read(out.slide);
    expect(question?.choices?.map((c) => [c.label, c.correct])).toEqual([["Hà Nội", true], ["Huế", false]]);
    expect(question?.id).toBe("legacy-1");
    expect(question?.points).toBe(7);
  });

  it.each(["likert-scale", "sequence", "matching"] as const)("a legacy slide changed to %s keeps its id and points", (type) => {
    const out = convertSlideType(legacy(), type, factory(type));
    expect(out.dropsAnswers).toBe(true);
    if (out.slide.runtimeQuestion) {
      expect(out.slide.runtimeQuestion.id).toBe("legacy-1");
      expect(out.slide.runtimeQuestion.points).toBe(7);
    }
    expect(read(out.slide)?.points).toBe(7);
  });

  it("a slide with a runtime question keeps its id and points when the answers are dropped", () => {
    const slide = make("multiple-choice", 3, [1]);
    const out = convertSlideType(slide, "sequence", factory("sequence"));
    expect(out.slide.runtimeQuestion).toMatchObject({ id: "s1", points: 7, kind: "sequence" });
  });
});
