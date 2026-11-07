import { describe, expect, it } from "vitest";

import {
  ADMIN_CONTENT_HOME_PATH,
  ADMIN_CONTENT_ROUTE_PATHS,
  adminContentSectionForPath,
  canonicalAdminContentPath,
  isAdminContentPath,
  legacyAdminContentPath,
  validateQuizEditorSearch,
} from "./admin-content-route";

describe("Admin content route contract", () => {
  it("owns the content authoring surface below the Admin workspace", () => {
    expect(ADMIN_CONTENT_HOME_PATH).toBe("/admin/content");
    expect(ADMIN_CONTENT_ROUTE_PATHS).toEqual([
      "/admin/content",
      "/admin/content/structure",
      "/admin/content/resources",
      "/admin/content/quiz-bank",
      "/admin/content/questions",
      "/admin/content/quiz-editor",
    ]);
    expect(isAdminContentPath("/admin/content/resources")).toBe(true);
    expect(isAdminContentPath("/admin/content/structure")).toBe(true);
    expect(isAdminContentPath("/author")).toBe(false);
  });

  it("maps legacy authoring deep links to canonical Admin content paths", () => {
    expect(canonicalAdminContentPath("/resources")).toBe("/admin/content/resources");
    expect(canonicalAdminContentPath("/structure")).toBe("/admin/content/structure");
    expect(canonicalAdminContentPath("/questions/archived")).toBe("/admin/content/questions/archived");
    expect(canonicalAdminContentPath("/quiz-editor?quizId=quiz-a")).toBe("/admin/content/quiz-editor?quizId=quiz-a");
    expect(legacyAdminContentPath("/admin/content/quiz-editor")).toBe("/quiz-editor");
    expect(adminContentSectionForPath("/admin/content/quiz-bank")?.key).toBe("quiz-bank");
    expect(adminContentSectionForPath("/admin/content/structure")?.key).toBe("structure");
  });
});

describe("validateQuizEditorSearch", () => {
  it("keeps panel=theme and drops any other panel", () => {
    expect(validateQuizEditorSearch({ quizId: "q1", panel: "theme" })).toEqual({ quizId: "q1", panel: "theme" });
    expect(validateQuizEditorSearch({ quizId: "q1", panel: "other" })).toEqual({ quizId: "q1" });
  });

  it("keeps a numeric quizId (parsed from digits) as a string", () => {
    expect(validateQuizEditorSearch({ quizId: 123 })).toEqual({ quizId: "123" });
  });

  it("ignores junk without throwing", () => {
    expect(validateQuizEditorSearch({ quizId: { a: 1 }, panel: ["theme"], extra: true })).toEqual({});
    expect(validateQuizEditorSearch({ quizId: "" })).toEqual({});
    expect(validateQuizEditorSearch({})).toEqual({});
  });
});
