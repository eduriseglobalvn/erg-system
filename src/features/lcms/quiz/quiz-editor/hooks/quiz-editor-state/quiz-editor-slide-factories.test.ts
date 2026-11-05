import { describe, expect, it } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";

let n = 0;
const createId = (prefix: string) => `${prefix}-${++n}`;
const build = (type: Parameters<typeof buildQuestionSlide>[0]) =>
  buildQuestionSlide(type, createNewQuizProjectSettings(), createId);

describe("buildQuestionSlide", () => {
  it("starts a multiple-choice question empty", () => {
    const slide = build("multiple-choice");
    expect(slide.title).toBe("");
    expect(slide.choices).toHaveLength(3);
    expect(slide.choices!.every((choice) => choice.label === "" && !choice.correct)).toBe(true);
  });

  it("starts multiple-response empty too", () => {
    const slide = build("multiple-response");
    expect(slide.choices!.every((choice) => choice.label === "" && !choice.correct)).toBe(true);
  });

  it("gives true-false fixed labels and no correct answer", () => {
    const slide = build("true-false");
    expect(slide.choices!.map((choice) => choice.label)).toEqual(["Đúng", "Sai"]);
    expect(slide.choices!.some((choice) => choice.correct)).toBe(false);
  });

  it.each([
    ["fill-in-the-blanks", { kind: "fill_blank", textBlanks: [] }],
    ["select-from-lists", { kind: "select_from_lists", inlineBlanks: [] }],
    ["drag-the-words", { kind: "drag_words", wordSlots: [], wordBank: [] }],
    ["short-answer", { kind: "short_answer", textBlanks: [] }],
    ["numeric", { kind: "numeric" }],
  ] as const)("starts %s with an empty runtime question", (type, shape) => {
    const slide = build(type);
    const { positivePoints } = createNewQuizProjectSettings().questionDefaults;
    expect(slide.runtimeQuestion).toEqual({
      id: slide.id,
      title: "",
      points: positivePoints,
      feedback: { correct: "", incorrect: "", partial: "" },
      ...shape,
    });
  });

  it("starts matching with two empty pairs mirrored in the slide's items", () => {
    const slide = build("matching");
    const pairs = slide.runtimeQuestion!.matching!;
    expect(slide.runtimeQuestion!.kind).toBe("matching");
    expect(slide.runtimeQuestion!.id).toBe(slide.id);
    expect(pairs).toHaveLength(2);
    expect(pairs.every((p) => p.prompt === "" && p.response === "")).toBe(true);
    expect(slide.dragDropItems).toEqual(
      pairs.map((p) => ({ id: p.id, label: "", emoji: "", target: "", media: null, targetMedia: null })),
    );
  });

  it("starts classification with two unnamed groups and no items", () => {
    const slide = build("drag-and-drop");
    const q = slide.runtimeQuestion!;
    expect(q.kind).toBe("drag_drop");
    expect(q.id).toBe(slide.id);
    expect(q.dropTargets).toHaveLength(2);
    expect(q.dropTargets!.every((t) => t.label === "")).toBe(true);
    expect(q.dragDropItems).toEqual([]);
    expect(slide.dragDropItems).toEqual([]);
  });

  it.each([
    ["hotspot", { kind: "hotspot", hotspotAreas: [] }],
    ["essay", { kind: "essay", essayRubric: [] }],
  ] as const)("starts %s with an empty runtime question", (type, shape) => {
    const slide = build(type);
    expect(slide.runtimeQuestion).toEqual({
      id: slide.id,
      title: "",
      points: createNewQuizProjectSettings().questionDefaults.positivePoints,
      feedback: { correct: "", incorrect: "", partial: "" },
      ...shape,
    });
  });
});
