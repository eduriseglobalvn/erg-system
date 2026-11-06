import { describe, expect, it, vi } from "vitest";

import { normalizeQuizEditorGroups, normalizeQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-normalizers";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  fingerprintedSlides,
  lifecycleLabel,
  quizLifecycle,
  recordPublished,
  slideFingerprint,
  slidePublishState,
} from "./quiz-publish-state";

const slide = (id: string, title: string): QuizEditorSlide => ({
  id,
  title,
  kind: "multiple-choice",
  choices: [{ id: "a", label: "4", correct: true }, { id: "b", label: "5", correct: false }],
});
const s1 = slide("s1", "2 + 2 = ?");
const s2 = slide("s2", "3 + 3 = ?");
const intro: QuizEditorSlide = { id: "i1", title: "Giới thiệu", kind: "intro-slide", instructions: ["Làm bài trong 10 phút"] };
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

describe("slideFingerprint cost and strength", () => {
  it("hashes a slide object once and reuses the result", () => {
    const fresh = slide("s9", "9 + 9 = ?");
    const stringify = vi.spyOn(JSON, "stringify");
    try {
      slideFingerprint(fresh);
      slideFingerprint(fresh);
      expect(stringify).toHaveBeenCalledTimes(1);
    } finally {
      stringify.mockRestore();
    }
  });

  it("is a 53-bit hash, wider than 32 bits", () => {
    expect(Number.parseInt(slideFingerprint(s1), 16)).toBeGreaterThan(2 ** 32);
  });
});

describe("question slides only", () => {
  it("keeps question kinds and leaves intro, instruction and result slides out", () => {
    const instruction: QuizEditorSlide = { ...intro, id: "i2", kind: "instruction-slide" };
    const result: QuizEditorSlide = { id: "r1", title: "Kết quả", kind: "result-slide" };
    expect(fingerprintedSlides([intro, s1, instruction, s2, result])).toEqual([s1, s2]);
  });

  it("records no intro slide, and adding or removing one does not flip the status", () => {
    const withIntro = recordPublished(createNewQuizProjectSettings(), [intro, s1, s2]);
    expect(Object.keys(withIntro.publishedFingerprints ?? {})).toEqual(["s1", "s2"]);
    const base = { quizId: "q1", serverStatus: "draft" };
    expect(quizLifecycle({ ...base, settings: withIntro, slides: [s1, s2] })).toBe("published");
    expect(quizLifecycle({ ...base, settings: published, slides: [intro, s1, s2] })).toBe("published");
  });
});

describe("save and reload", () => {
  it("still reads published after the draft goes through the server and the normalizers", () => {
    const blankTitle: QuizEditorSlide = { ...slide("s3", ""), status: "published" };
    const groups: QuizEditorGroup[] = [{ id: "g1", title: "Phân số", rule: "all", randomCount: 0, slides: [intro, s1, blankTitle, s2] }];
    const slides = groups.flatMap((group) => group.slides);
    const settings = recordPublished(createNewQuizProjectSettings(), slides);

    const reloadedSettings = normalizeQuizProjectSettings(JSON.parse(JSON.stringify(settings)));
    const reloadedSlides = normalizeQuizEditorGroups(JSON.parse(JSON.stringify(groups))).flatMap((group) => group.slides);

    expect(quizLifecycle({ quizId: "q1", serverStatus: "published", settings: reloadedSettings, slides: reloadedSlides })).toBe("published");
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
