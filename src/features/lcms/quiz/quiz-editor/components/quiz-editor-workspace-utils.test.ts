import { describe, expect, it } from "vitest";

import {
  isLegacyMockDraft,
  resolveNewQuizScope,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";

describe("quiz editor workspace utils", () => {
  it("detects legacy mock drafts by slide id", () => {
    const doc = (slideId: string) => ({ tree: [{ slides: [{ id: slideId }] }] }) as never;
    expect(isLegacyMockDraft(doc("slide-matching"))).toBe(true);
    expect(isLegacyMockDraft(doc("lcms-q1"))).toBe(true);
    expect(isLegacyMockDraft(doc("real-slide"))).toBe(false);
    expect(isLegacyMockDraft(null)).toBe(false);
  });

  it("drops level and topic that do not belong to the subject", () => {
    const subjects = [
      { id: "s1", levels: [{ id: "l1" }], categories: [{ id: "c1", label: "Chủ đề 1" }] },
    ] as never;
    expect(resolveNewQuizScope(subjects, "s1", "l1", "c1")).toEqual({
      subjectId: "s1",
      levelId: "l1",
      categoryId: "c1",
      subtitle: "Chủ đề 1",
    });
    expect(resolveNewQuizScope(subjects, "s1", "bad", "bad")).toEqual({
      subjectId: "s1",
      levelId: undefined,
      categoryId: undefined,
      subtitle: undefined,
    });
  });

});
