import { describe, expect, it } from "vitest";

import {
  applyInlineMedia,
  cloneSlide,
  updateSlideTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/components/question-editor/slide-edit-helpers";
import type { QuizEditorSlide, QuizEditorSlideMedia } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const media = { type: "image", src: "data:x", alt: "a", name: "a.png" } as QuizEditorSlideMedia;
const slide = {
  id: "s1",
  choices: [{ id: "c1" }, { id: "c2" }],
  dragDropItems: [{ id: "d1" }, { id: "d2" }],
} as unknown as QuizEditorSlide;

describe("applyInlineMedia", () => {
  it("sets media on the matching choice only", () => {
    const next = applyInlineMedia(slide, { kind: "choice", id: "c2" }, media);
    expect(next.choices?.map((c) => c.media)).toEqual([undefined, media]);
  });

  it("sets label or target media on a drag item", () => {
    const label = applyInlineMedia(slide, { kind: "drag-item", id: "d1", field: "label" }, media);
    const target = applyInlineMedia(slide, { kind: "drag-item", id: "d1", field: "target" }, media);
    expect(label.dragDropItems?.[0].media).toBe(media);
    expect(target.dragDropItems?.[0].targetMedia).toBe(media);
    expect(target.dragDropItems?.[1].targetMedia).toBeUndefined();
  });

  it("falls back to slide media", () => {
    expect(applyInlineMedia(slide, { kind: "slide" }, media).media).toBe(media);
  });
});

describe("updateSlideTextStyleTarget / cloneSlide", () => {
  it("patches only the given target and mirrors question into textStyle", () => {
    const next = updateSlideTextStyleTarget(slide, "question", { bold: true });
    expect(next.textStyle?.bold).toBe(true);
    expect(next.textStyles?.question?.bold).toBe(true);
  });

  it("clone is a deep copy", () => {
    const copy = cloneSlide(slide);
    expect(copy).toEqual(slide);
    expect(copy.choices).not.toBe(slide.choices);
  });
});
