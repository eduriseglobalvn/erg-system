import { describe, expect, it } from "vitest";

import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { convertSlideType } from "./convert-slide-type";

const slide = {
  id: "s1", title: "T", kind: "multiple-response", options: { score: 7 }, status: "draft",
  feedbackRows: [{ kind: "correct", score: 7, feedback: "ok" }],
  choices: [{ id: "a", label: "A", correct: true }, { id: "b", label: "B", correct: true }],
  runtimeQuestion: { id: "s1", kind: "multiple_response" },
} as unknown as QuizEditorSlide;
const fresh = (kind: string) => ({ id: "new", title: "", kind, choices: [], options: { score: 1 } }) as unknown as QuizEditorSlide;

describe("convertSlideType", () => {
  it("carries choices between choice types and keeps the first correct one for single choice", () => {
    const single = convertSlideType(slide, "multiple-choice", fresh("multiple-choice"));
    expect(single.dropsAnswers).toBe(false);
    expect(single.slide.choices?.map((c) => c.correct)).toEqual([true, false]);
    const keep = convertSlideType({ ...slide, kind: "multiple-choice" } as QuizEditorSlide, "multiple-response", fresh("multiple-response"));
    expect(keep.slide.choices?.map((c) => c.correct)).toEqual([true, true]);
    expect(keep.slide.kind).toBe("multiple-response");
  });

  it("drops answers for other changes but keeps identity, scores and settings", () => {
    const out = convertSlideType(slide, "matching", fresh("matching"));
    expect(out.dropsAnswers).toBe(true);
    expect(out.slide.kind).toBe("matching");
    expect(out.slide.runtimeQuestion).toBeUndefined();
    expect(out.slide.choices).toEqual([]);
    expect(out.slide.id).toBe("s1");
    expect(out.slide.options).toEqual(slide.options);
    expect(out.slide.feedbackRows).toEqual(slide.feedbackRows);
    expect(out.slide.status).toBe("draft");
  });
});
