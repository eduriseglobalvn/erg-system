import { describe, expect, it } from "vitest";

import type { LearningResourceCategory, LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import {
  getCategoryChildrenFrom,
  getCategoryPathFrom,
  getDefaultSelectionForGrade,
  getExplorerType,
  getLearningCardMeta,
  getStableDate,
  getTopLevelCategoriesFrom,
  matchesResource,
} from "@/features/lms/learning-resources/components/library-page/library-model";

const categories = [
  { id: "a", label: "A" },
  { id: "b", label: "B", parentId: "a" },
  { id: "c", label: "C", parentId: "b" },
] as LearningResourceCategory[];

function resource(overrides: Record<string, unknown>) {
  return {
    id: "r1",
    title: "Unit 1",
    subtitle: "",
    formatBadge: "PDF",
    categoryId: "cat",
    sectionId: "sec",
    subjectId: "tieng-anh",
    gradeId: "3",
    fileType: "PDF",
    resourceType: "document",
    viewer: { title: "Viewer" },
    ...overrides,
  } as unknown as LearningResourceResource;
}

describe("category helpers", () => {
  it("resolves top level, children and path", () => {
    expect(getTopLevelCategoriesFrom(categories).map((c) => c.id)).toEqual(["a"]);
    expect(getCategoryChildrenFrom(categories, "a").map((c) => c.id)).toEqual(["b"]);
    expect(getCategoryPathFrom(categories, "c").map((c) => c.id)).toEqual(["a", "b", "c"]);
    expect(getCategoryPathFrom(categories, "missing")).toEqual([]);
  });
});

describe("matchesResource", () => {
  const selected = { gradeId: "3", subjectId: "tieng-anh", categoryId: "cat", keyword: "" };

  it("matches by category, subject, grade and keyword", () => {
    expect(matchesResource(resource({}), selected)).toBe(true);
    expect(matchesResource(resource({ categoryId: "other", sectionId: "other" }), selected)).toBe(false);
    expect(matchesResource(resource({ subjectId: "toan" }), selected)).toBe(false);
    expect(matchesResource(resource({ gradeId: "5" }), selected)).toBe(false);
    expect(matchesResource(resource({}), { ...selected, keyword: " UNIT " })).toBe(true);
    expect(matchesResource(resource({}), { ...selected, keyword: "zzz" })).toBe(false);
  });

  it("lets certificate categories ignore the subject filter", () => {
    expect(matchesResource(resource({ categoryId: "mos", subjectId: "toan" }), { ...selected, categoryId: "mos" })).toBe(true);
  });
});

describe("explorer presentation helpers", () => {
  it("is deterministic", () => {
    expect(getStableDate("x")).toBe(getStableDate("x"));
    expect(getLearningCardMeta(resource({}))).toEqual(getLearningCardMeta(resource({})));
  });

  it("maps file types to labels and card actions", () => {
    expect(getExplorerType(resource({ fileType: "PPTX" }))).toBe("Bài giảng");
    expect(getExplorerType(resource({ fileType: "PDF" }))).toBe("PDF");
    expect(getLearningCardMeta(resource({ fileType: "QUIZ" })).action).toBe("Làm bài");
    expect(getLearningCardMeta(resource({ resourceType: "slide" })).action).toBe("Mở bài");
  });

  it("defaults the selection per grade", () => {
    expect(getDefaultSelectionForGrade("4")).toEqual({ gradeId: "4", subjectId: "tieng-anh", categoryId: "sgk-tieng-anh" });
  });
});
