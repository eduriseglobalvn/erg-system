import { describe, expect, it } from "vitest";

import { normalizeQuizPackage, stripQuizAnswerKey } from "./quiz-runtime-package-normalizer";
import { normalizeBackendQuestion } from "./quiz-runtime-question-normalizers";
import type { BackendQuizPackage } from "./quiz-runtime-package-api";
import { canGradeLocally, getAllQuestions } from "@/domain/quiz/quiz";
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

  it("drops an essay's marking guide, even from a package published before the server stripped it", () => {
    const original = quiz("testing");
    original.sections[0].questions.push({ id: "8", kind: "essay", title: "", points: 1, feedback, essayRubric: [{ id: "c", label: "Nêu đủ ý", points: 2 }] });
    const essay = stripQuizAnswerKey(original).sections[0].questions[7];
    expect(essay.essayRubric).toBeUndefined();
    expect(keyLeaks(essay)).not.toContain("Nêu đủ ý");
  });

  it.each(["client-first", "server-authoritative"] as const)("drops the essay guide from a training package too (%s)", (gradingMode) => {
    const pkg = backend("training", gradingMode) as { quiz: Quiz };
    pkg.quiz.sections[0].questions.push({ id: "8", kind: "essay", title: "", points: 1, feedback, essayRubric: [{ id: "c", label: "Nêu đủ ý", points: 2 }] });
    const { quiz: kept } = normalizeQuizPackage(pkg as never);
    expect(keyLeaks(kept)).not.toContain("Nêu đủ ý");
    expect(kept.sections[0].questions[0].choices?.[0].correct).toBe(true);
  });

  it("does not mutate its input", () => {
    const original = quiz("testing");
    stripQuizAnswerKey(original);
    expect(original.sections[0].questions[0].choices?.[0].correct).toBe(true);
  });

  it("a stripped package is not locally gradable, even when the stripped shape looks like a key", () => {
    const only = (...questions: Quiz["sections"][0]["questions"]): Quiz => ({ ...quiz("testing"), sections: [{ id: "s", title: "S", questions }] });
    const numericOnly = only({ id: "3", kind: "numeric", title: "", points: 1, feedback, numericAnswer: { correctValue: 42, tolerance: 1 } });
    const essayOnly = only({ id: "8", kind: "essay", title: "", points: 1, feedback });
    const oldMatching = only({ id: "9", kind: "matching", title: "", points: 1, feedback, matching: [{ id: "r", prompt: "p", response: "x" }] });
    expect(canGradeLocally(getAllQuestions(numericOnly))).toBe(true);
    for (const original of [numericOnly, essayOnly, oldMatching]) {
      const stripped = normalizeQuizPackage({ ...backend("testing", "server-authoritative"), quiz: original }).quiz;
      expect(canGradeLocally(getAllQuestions(stripped))).toBe(false);
    }
    expect(canGradeLocally(getAllQuestions(normalizeQuizPackage({ ...backend("testing", "client-first"), quiz: numericOnly }).quiz))).toBe(true);
  });
});

describe("secured matching / sequence shapes", () => {
  const matchingBody = {
    id: "m", kind: "matching", points: 2,
    matching: [{ id: "m1", prompt: "Cat" }, { id: "m2", prompt: "Dog" }],
    matchingResponses: [{ id: "r-9f", response: "Woof" }, { id: "r-1c", response: "Meow" }],
  };
  const sequenceBody = { id: "s", kind: "sequence", points: 2, sequenceItems: [{ id: "s2", label: "B" }, { id: "s1", label: "A" }] };
  const key = {
    m: { pairs: [{ promptId: "m1", responseId: "r-1c" }, { promptId: "m2", responseId: "r-9f" }] },
    s: { order: ["s1", "s2"] },
  };

  it("passes matchingResponses through and maps the offline key", () => {
    const m = normalizeBackendQuestion(matchingBody, 0, key, "client-first");
    expect(m?.matchingResponses?.map((r) => r.id)).toEqual(["r-9f", "r-1c"]);
    expect(m?.matchingKey).toEqual({ m1: "r-1c", m2: "r-9f" });
    const s = normalizeBackendQuestion(sequenceBody, 0, key, "client-first");
    expect(s?.sequenceCorrectOrder).toEqual(["s1", "s2"]);
  });

  it("server-authoritative: no key leaks, sequence order is unknown", () => {
    const m = normalizeBackendQuestion(matchingBody, 0, key, "server-authoritative");
    expect(m?.matchingKey).toBeUndefined();
    expect(m?.matchingResponses).toHaveLength(2);
    expect(normalizeBackendQuestion(sequenceBody, 0, key, "server-authoritative")?.sequenceCorrectOrder).toEqual([]);
  });

  it("old shape (responses embedded in rows) is left untouched", () => {
    const old = normalizeBackendQuestion({ id: "o", kind: "matching", points: 1, matching: [{ id: "m1", prompt: "Cat", response: "Meow" }] }, 0, {}, "client-first");
    expect(old?.matchingResponses).toBeUndefined();
    expect(old?.matching?.[0].response).toBe("Meow");
  });
});

describe("player template from the package", () => {
  const detail = (settings: unknown): BackendQuizPackage =>
    ({ id: "p", quizId: "q", quizVersion: "1", contentHash: "h", gradingMode: "server-authoritative", source: "server",
      quiz: { quiz: { id: "q", title: "Q" }, slides: [], settings, result: {}, theme: {} } }) as never;

  it("keeps settings.playerTemplate on the quiz", () => {
    const { quiz: loaded } = normalizeQuizPackage(detail({ playerTemplate: { accentColor: "#0071E3" } }));
    expect(loaded.playerTemplate).toEqual({ accentColor: "#0071E3" });
  });

  it("has no playerTemplate when the package carries none or junk", () => {
    expect(normalizeQuizPackage(detail({})).quiz).not.toHaveProperty("playerTemplate");
    expect(normalizeQuizPackage(detail({ playerTemplate: "red" })).quiz).not.toHaveProperty("playerTemplate");
  });
});
