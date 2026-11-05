import { describe, expect, it } from "vitest";

import { normalizeQuizEditorGroups } from "./quiz-editor-normalizers";

describe("normalizeQuizEditorGroups", () => {
  it("keeps a blank question title blank instead of inventing one", () => {
    const [group] = normalizeQuizEditorGroups([{ id: "g1", slides: [{ id: "s1", title: "" }, { id: "s2" }] }]);
    expect(group.slides.map((slide) => slide.title)).toEqual(["", ""]);
  });
});
