import { describe, expect, it } from "vitest";

import { appendMovedSlides } from "@/features/lcms/quiz/quiz-editor/model/move-slides";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const slide = (id: string, status: QuizEditorSlide["status"] = "published") => ({ id, status, title: id }) as unknown as QuizEditorSlide;
const group = (id: string, slides: QuizEditorSlide[]) => ({ id, title: id, rule: "all", randomCount: 0, slides }) as QuizEditorGroup;

describe("appendMovedSlides", () => {
  it("appends to the first group as drafts and re-ids only the colliding slide", () => {
    const tree = appendMovedSlides([group("g1", [slide("slide-1001")]), group("g2", [])], [slide("slide-1001"), slide("slide-1005")]);
    expect(tree[0].slides.map((s) => [s.id, s.status])).toEqual([
      ["slide-1001", "published"],
      ["slide-1006", "draft"],
      ["slide-1005", "draft"],
    ]);
    expect(tree[1].slides).toEqual([]);
  });

  it("starts a default group when the target quiz has none", () => {
    const tree = appendMovedSlides([], [slide("slide-7")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].slides.map((s) => s.id)).toEqual(["slide-7"]);
  });
});
