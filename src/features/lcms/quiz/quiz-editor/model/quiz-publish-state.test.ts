import { describe, expect, it } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { lifecycleLabel, quizLifecycle, recordPublished, slideFingerprint, slidePublishState } from "./quiz-publish-state";

const slide = (id: string, title: string): QuizEditorSlide => ({
  id,
  title,
  kind: "multiple-choice",
  choices: [{ id: "a", label: "4", correct: true }, { id: "b", label: "5", correct: false }],
});
const s1 = slide("s1", "2 + 2 = ?");
const s2 = slide("s2", "3 + 3 = ?");
const published = recordPublished(createNewQuizProjectSettings(), [s1, s2]);

describe("slideFingerprint", () => {
  it("ignores status and sync fields, but not the title", () => {
    expect(slideFingerprint({ ...s1, status: "published" })).toBe(slideFingerprint({ ...s1, status: "unsaved" }));
    expect(slideFingerprint({ ...s1, activeResultTab: "failed" })).toBe(slideFingerprint(s1));
    expect(slideFingerprint({ ...s1, title: "2 + 3 = ?" })).not.toBe(slideFingerprint(s1));
  });

  it("is equal for the same content written in another key order", () => {
    const reordered = {
      choices: [{ correct: true, label: "4", id: "a" }, { correct: false, label: "5", id: "b" }],
      kind: "multiple-choice",
      title: "2 + 2 = ?",
      id: "s1",
    } as QuizEditorSlide;
    expect(slideFingerprint(reordered)).toBe(slideFingerprint(s1));
  });
});

describe("recordPublished", () => {
  it("stores one fingerprint per slide and keeps the other settings", () => {
    expect(published.publishedFingerprints).toEqual({ s1: slideFingerprint(s1), s2: slideFingerprint(s2) });
    expect(published.info).toEqual(createNewQuizProjectSettings().info);
  });
});

describe("quizLifecycle", () => {
  const base = { quizId: "q1", serverStatus: "draft", settings: published, slides: [s1, s2] };

  it.each([
    ["none without a quiz", { ...base, quizId: null }, "none"],
    ["draft before the first publish", { ...base, settings: createNewQuizProjectSettings() }, "draft"],
    ["published when every slide matches", base, "published"],
    ["changed when a slide was edited", { ...base, slides: [s1, { ...s2, title: "3 + 4 = ?" }] }, "changed"],
    ["changed when a slide was added", { ...base, slides: [s1, s2, slide("s3", "1 + 1 = ?")] }, "changed"],
    ["changed when a slide was deleted", { ...base, slides: [s1] }, "changed"],
    ["published for a legacy quiz the server marks published", { ...base, serverStatus: "published", settings: createNewQuizProjectSettings() }, "published"],
  ] as const)("%s", (_name, input, expected) => {
    expect(quizLifecycle(input)).toBe(expected);
  });

  it("labels every lifecycle", () => {
    expect(lifecycleLabel).toEqual({ none: "Chưa có bài", draft: "Nháp", published: "Đã xuất bản", changed: "Có sửa chưa xuất bản" });
  });
});

describe("slidePublishState", () => {
  it("is never before the first publish, then published or changed", () => {
    expect(slidePublishState(s1, createNewQuizProjectSettings())).toBe("never");
    expect(slidePublishState({ ...s1, status: "draft" }, published)).toBe("published");
    expect(slidePublishState({ ...s1, title: "2 + 3 = ?" }, published)).toBe("changed");
  });

  it("calls a slide added after the publish changed", () => {
    expect(slidePublishState(slide("s3", "1 + 1 = ?"), published)).toBe("changed");
  });
});
