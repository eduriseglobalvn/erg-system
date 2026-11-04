import { describe, expect, it } from "vitest";

import { normalizeQuizPackage, stripQuizAnswerKey } from "./quiz-runtime-package-normalizer";
import type { BackendQuizPackage } from "./quiz-runtime-package-api";
import type { Quiz } from "@/domain/quiz/types";

const feedback = { correct: "", incorrect: "", partial: "" };
const quiz = (mode: "testing" | "training"): Quiz => ({
  id: "q", title: "Q", subtitle: "", version: "1", description: "", themeId: "t", theme: {} as never,
  settings: { mode, passPercent: 50, shuffleQuestions: false, shuffleChoices: false, revealFeedbackPerStep: false },
  sections: [{
    id: "s", title: "S",
    questions: [
      { id: "1", kind: "single_choice", title: "", points: 1, feedback, choices: [{ id: "a", label: "A", correct: true }, { id: "b", label: "B", correct: false }] },
      { id: "2", kind: "fill_blank", title: "", points: 1, feedback, textBlanks: [{ id: "t", label: "", correctAnswers: ["secret"] }] },
      { id: "3", kind: "numeric", title: "", points: 1, feedback, numericAnswer: { correctValue: 42, tolerance: 1, unit: "kg" } },
      { id: "4", kind: "inline_choice", title: "", points: 1, feedback, inlineBlanks: [{ id: "i", statement: "s", options: ["x", "y"], correctOptionId: "x" }] },
      { id: "5", kind: "drag_words", title: "", points: 1, feedback, wordBank: [{ id: "w", label: "w" }], wordSlots: [{ id: "sl", label: "", correctWordId: "w" }] },
      { id: "6", kind: "drag_drop", title: "", points: 1, feedback, dropTargets: [{ id: "t1", label: "" }], dragDropItems: [{ id: "d", label: "", correctTargetId: "t1" }] },
      { id: "7", kind: "hotspot", title: "", points: 1, feedback, hotspotAreas: [{ id: "h", shape: "rect", x: 1, y: 1, width: 2, height: 2, correct: true }] },
    ],
  }],
});

const backend = (mode: "testing" | "training", gradingMode: "server-authoritative" | "client-first"): BackendQuizPackage =>
  ({ id: "p", quizId: "q", quizVersion: "1", contentHash: "h", gradingMode, source: "server", quiz: quiz(mode) }) as never;

const keyLeaks = (value: unknown) => JSON.stringify(value);

describe("answer key stripping (4.4 #18)", () => {
  it("strips every answer-key field from a server-authoritative testing package", () => {
    const { quiz: stripped } = normalizeQuizPackage(backend("testing", "server-authoritative"));
    const [single, text, numeric, inline, words, dnd, hotspot] = stripped.sections[0].questions;
    expect(single.choices?.map((c) => c.correct)).toEqual([false, false]);
    expect(text.textBlanks?.[0].correctAnswers).toEqual([]);
    expect(numeric.numericAnswer).toEqual({ correctValue: 0, tolerance: 0, unit: "kg" });
    expect(inline.inlineBlanks?.[0].correctOptionId).toBe("");
    expect(words.wordSlots?.[0].correctWordId).toBe("");
    expect(dnd.dragDropItems?.[0].correctTargetId).toBe("");
    expect(hotspot.hotspotAreas).toEqual([]);
    expect(keyLeaks(stripped)).not.toContain("secret");
    expect(keyLeaks(stripped)).not.toContain("42");
  });

  it("keeps question content (labels, options, targets) so the player still renders", () => {
    const { quiz: stripped } = normalizeQuizPackage(backend("testing", "server-authoritative"));
    expect(stripped.sections[0].questions[0].choices?.map((c) => c.label)).toEqual(["A", "B"]);
    expect(stripped.sections[0].questions[3].inlineBlanks?.[0].options).toEqual(["x", "y"]);
  });

  it("leaves client-first packages untouched (offline grading needs the key)", () => {
    const { quiz: kept } = normalizeQuizPackage(backend("testing", "client-first"));
    expect(kept.sections[0].questions[0].choices?.[0].correct).toBe(true);
  });

  it("leaves server-authoritative training quizzes untouched (per-question client feedback)", () => {
    const { quiz: kept } = normalizeQuizPackage(backend("training", "server-authoritative"));
    expect(kept.sections[0].questions[0].choices?.[0].correct).toBe(true);
  });

  it("does not mutate its input", () => {
    const original = quiz("testing");
    stripQuizAnswerKey(original);
    expect(original.sections[0].questions[0].choices?.[0].correct).toBe(true);
  });
});
