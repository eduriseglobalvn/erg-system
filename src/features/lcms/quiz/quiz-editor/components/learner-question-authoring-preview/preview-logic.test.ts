import { describe, expect, test } from "vitest";

import {
  createPreviewAnswer,
  getFeedbackText,
  isInstructionLikeSlide,
  updateFeedbackText,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import {
  buildDragDropItems,
  buildDragDropTargets,
  buildNumericAnswer,
  createDragDropTargetId,
  normalizeChoices,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import { clampUnit } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/draggable-slide-media";
import type { Question } from "@/domain/quiz/types";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const t = ((key: string) => key) as never;
const slideOf = (patch: Record<string, unknown>) => ({ id: "s1", title: "T", ...patch }) as unknown as QuizEditorSlide;

describe("createPreviewAnswer", () => {
  const question = {
    id: "q",
    kind: "single_choice",
    choices: [
      { id: "a", label: "A", correct: true },
      { id: "b", label: "B", correct: false },
    ],
  } as unknown as Question;

  test("correct and incorrect single choice", () => {
    expect(createPreviewAnswer(question, "correct")).toEqual({ choiceId: "a" });
    expect(createPreviewAnswer(question, "incorrect")).toEqual({ choiceId: "b" });
  });

  test("matching incorrect reverses order", () => {
    const matching = { id: "q", kind: "matching", matching: [{ id: "1" }, { id: "2" }] } as unknown as Question;
    expect(createPreviewAnswer(matching, "incorrect")).toEqual({
      matchingOrder: ["2", "1"],
      matchingConnectedRows: ["1", "2"],
    });
  });
});

describe("feedback helpers", () => {
  test("getFeedbackText is empty in question mode", () => {
    expect(getFeedbackText(slideOf({}), "question")).toBe("");
  });

  test("updateFeedbackText creates default rows and updates target kind", () => {
    const rows = updateFeedbackText(undefined, "correct", "ok");
    expect(rows.map((r) => [r.kind, r.feedback])).toEqual([
      ["correct", "ok"],
      ["incorrect", ""],
    ]);
  });

  test("updateFeedbackText appends missing kind", () => {
    const rows = updateFeedbackText(
      [{ id: "x", kind: "answered", feedback: "", score: 1, branching: "By Result" }] as never,
      "incorrect",
      "no",
    );
    expect(rows[1]).toMatchObject({ id: "feedback-incorrect", kind: "incorrect", feedback: "no", score: 0 });
  });

  test("isInstructionLikeSlide", () => {
    expect(isInstructionLikeSlide("intro-slide")).toBe(true);
    expect(isInstructionLikeSlide("matching")).toBe(false);
  });
});

describe("question builders", () => {
  test("normalizeChoices falls back to two default options", () => {
    expect(normalizeChoices(undefined, t)).toHaveLength(2);
  });

  test("buildNumericAnswer parses first correct label", () => {
    const slide = slideOf({ choices: [{ id: "a", label: "x 12.5 kg", correct: true }] });
    expect(buildNumericAnswer(slide).correctValue).toBe(12.5);
    expect(buildNumericAnswer(slideOf({ choices: [{ id: "a", label: "abc", correct: true }] })).correctValue).toBe(0);
  });

  test("createDragDropTargetId strips Vietnamese diacritics", () => {
    expect(createDragDropTargetId("Vùng thả 1", 0)).toBe("drop-target-vung-tha-1");
    expect(createDragDropTargetId("!!!", 4)).toBe("drop-target-5");
  });

  test("drag-drop items map to deduped targets", () => {
    const slide = slideOf({
      dragDropItems: [
        { id: "i1", label: "A", target: "Z1" },
        { id: "i2", label: "B", target: " Z1 " },
        { id: "i3", label: "C", target: "" },
      ],
    });
    expect(buildDragDropTargets(slide).map((x) => x.label)).toEqual(["Z1", "Vùng thả 1"]);
    const items = buildDragDropItems(slide, t);
    expect(items[0].correctTargetId).toBe(items[1].correctTargetId);
    expect(items[2].correctTargetId).not.toBe(items[0].correctTargetId);
  });
});

describe("clampUnit", () => {
  test("clamps to 0.08..0.92", () => {
    expect(clampUnit(-1)).toBe(0.08);
    expect(clampUnit(2)).toBe(0.92);
    expect(clampUnit(0.5)).toBe(0.5);
  });
});
