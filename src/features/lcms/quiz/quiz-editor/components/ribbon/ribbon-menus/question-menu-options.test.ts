import { describe, expect, it } from "vitest";

import {
  QUESTION_MENU_OPTIONS,
  filterQuestionMenuOptions,
  normalizeText,
} from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus/question-menu-options";

describe("normalizeText", () => {
  it("lowercases, strips Vietnamese diacritics and maps đ", () => {
    expect(normalizeText("  Trắc Nghiệm Đúng ")).toBe("trac nghiem dung");
  });
});

describe("filterQuestionMenuOptions", () => {
  it("returns everything for all + empty query", () => {
    expect(filterQuestionMenuOptions("all", "")).toEqual(QUESTION_MENU_OPTIONS);
  });
  it("filters by category", () => {
    const result = filterQuestionMenuOptions("media", "");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((option) => option.category === "media")).toBe(true);
  });
  it("matches diacritic-insensitively on label and keywords", () => {
    expect(filterQuestionMenuOptions("all", "TRAC NGHIEM").some((o) => o.id === "multiple-choice")).toBe(true);
    expect(filterQuestionMenuOptions("all", "hotspot").some((o) => o.type === "hotspot")).toBe(true);
  });
  it("returns nothing for an unmatched query", () => {
    expect(filterQuestionMenuOptions("all", "zzzz-no-match")).toEqual([]);
  });
});
