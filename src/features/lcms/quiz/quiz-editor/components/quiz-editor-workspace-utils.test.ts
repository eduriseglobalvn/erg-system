import { describe, expect, it } from "vitest";

import {
  findScopeMatchingDraft,
  isLegacyMockDraft,
  resolveNewQuizScope,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import { buildTopicOptions } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";

const draft = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, title: id, status: "draft", subjectId: "s1", ...extra }) as never;

describe("quiz editor workspace utils", () => {
  it("detects legacy mock drafts by slide id", () => {
    const doc = (slideId: string) => ({ tree: [{ slides: [{ id: slideId }] }] }) as never;
    expect(isLegacyMockDraft(doc("slide-matching"))).toBe(true);
    expect(isLegacyMockDraft(doc("lcms-q1"))).toBe(true);
    expect(isLegacyMockDraft(doc("real-slide"))).toBe(false);
    expect(isLegacyMockDraft(null)).toBe(false);
  });

  it("prefers topic, then level, then subject draft; ignores non-drafts", () => {
    const items = [
      draft("subject-only"),
      draft("level", { levelId: "l1" }),
      draft("topic", { levelId: "l1", categoryId: "c1" }),
      draft("published", { status: "published", levelId: "l2", categoryId: "c2" }),
    ];
    expect(findScopeMatchingDraft(items, "s1", "l1", "c1")?.id).toBe("topic");
    expect(findScopeMatchingDraft(items, "s1", "l1", "all")?.id).toBe("level");
    expect(findScopeMatchingDraft(items, "s1", "l2", "c2")?.id).toBe("subject-only");
    expect(findScopeMatchingDraft(items, "", null, "all")).toBeNull();
    expect(findScopeMatchingDraft(undefined, "s1", null, "all")).toBeNull();
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

  it("builds topic options with per-topic counts", () => {
    const options = buildTopicOptions({
      levelTopics: [{ id: "c1", label: "A" }],
      questions: [{ categoryId: "c1" }, { categoryId: "c2" }],
      fallbackCount: 9,
      courseLabel: "IC3",
      levelLabel: "Level 1",
    });
    expect(options.map((o) => [o.id, o.count])).toEqual([["all", 2], ["c1", 1]]);
    expect(options[0]!.description).toBe("IC3 · Level 1");
    expect(buildTopicOptions({ levelTopics: [], questions: undefined, fallbackCount: 9, courseLabel: "X", levelLabel: null })[0]!.count).toBe(9);
  });
});
