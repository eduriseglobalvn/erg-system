import { describe, expect, test } from "vitest";

import {
  createPreviewAnswer,
  getFeedbackText,
  isInstructionLikeSlide,
  updateFeedbackText,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import {
  buildDragDropItems,
  buildPreviewQuestion,
  buildDragDropTargets,
  buildNumericAnswer,
  createDragDropTargetId,
  normalizeChoices,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import { clampUnit } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/draggable-slide-media";
import { syncQuizEditorSlideFromRuntimeQuestion } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
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
  test("normalizeChoices invents no options", () => {
    expect(normalizeChoices(undefined)).toEqual([]);
  });

  test("buildNumericAnswer parses first correct label", () => {
    const slide = slideOf({ choices: [{ id: "a", label: "x 12.5 kg", correct: true }] });
    expect(buildNumericAnswer(slide)?.correctValue).toBe(12.5);
    expect(buildNumericAnswer(slideOf({ choices: [{ id: "a", label: "abc", correct: true }] }))).toBeUndefined();
  });

  test("createDragDropTargetId strips Vietnamese diacritics", () => {
    expect(createDragDropTargetId("Vùng thả 1", 0)).toBe("drop-target-vung-tha-1");
    expect(createDragDropTargetId("!!!", 4)).toBe("drop-target-5");
  });

  test("drag-drop items map to deduped targets; an item without a group gets none invented", () => {
    const slide = slideOf({
      dragDropItems: [
        { id: "i1", label: "A", target: "Z1" },
        { id: "i2", label: "B", target: " Z1 " },
        { id: "i3", label: "C", target: "" },
      ],
    });
    expect(buildDragDropTargets(slide).map((x) => x.label)).toEqual(["Z1"]);
    const items = buildDragDropItems(slide);
    expect(items[0].correctTargetId).toBe(items[1].correctTargetId);
    expect(items[2].correctTargetId).toBe("");
  });
});

describe("clampUnit", () => {
  test("clamps to 0.08..0.92", () => {
    expect(clampUnit(-1)).toBe(0.08);
    expect(clampUnit(2)).toBe(0.92);
    expect(clampUnit(0.5)).toBe(0.5);
  });
});

describe("buildPreviewQuestion images", () => {
  const img = { type: "image", src: "https://x/a.png", alt: "A" };

  test("choice media becomes choice image", () => {
    const slide = slideOf({ kind: "multiple-choice", choices: [{ id: "c1", label: "A", correct: true, media: img }, { id: "c2", label: "B", correct: false }] });
    expect(buildPreviewQuestion(slide, t)?.choices?.[0].image).toEqual({ url: "https://x/a.png", alt: "A" });
  });

  test("empty label stays empty", () => {
    const slide = slideOf({ kind: "multiple-choice", choices: [{ id: "c1", label: "", correct: false }, { id: "c2", label: "B", correct: true }] });
    expect(buildPreviewQuestion(slide, t)?.choices?.map((c) => c.label)).toEqual(["", "B"]);
  });

  test("slide media becomes contentImage with and without runtimeQuestion; hotspot has none", () => {
    const media = { type: "image", src: "https://x/q.png", alt: "Q" };
    const base = { kind: "multiple-choice", media, choices: [{ id: "c1", label: "A", correct: true }] };
    expect(buildPreviewQuestion(slideOf(base), t)?.contentImage?.url).toBe("https://x/q.png");
    const rq = { id: "s1", kind: "single_choice", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };
    expect(buildPreviewQuestion(slideOf({ ...base, runtimeQuestion: rq }), t)?.contentImage?.url).toBe("https://x/q.png");
    expect(buildPreviewQuestion(slideOf({ kind: "hotspot", media }), t)?.contentImage).toBeUndefined();
  });

  test("drag item media becomes image", () => {
    const slide = slideOf({ kind: "drag-and-drop", dragDropItems: [{ id: "d1", label: "D", emoji: "", target: "Z", media: img }] });
    expect(buildDragDropItems(slide)[0].image).toEqual({ url: "https://x/a.png", alt: "A" });
  });

  test("round trip keeps choice media", () => {
    const slide = slideOf({ kind: "multiple-choice", choices: [{ id: "c1", label: "A", correct: true, media: img }, { id: "c2", label: "B", correct: false }] });
    const back = syncQuizEditorSlideFromRuntimeQuestion(slide, buildPreviewQuestion(slide, t)!);
    expect(back.choices?.[0].media?.src).toBe("https://x/a.png");
  });
});

describe("round trip fidelity", () => {
  const rq = { id: "s1", kind: "single_choice", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };

  test("an empty matching label stays empty", () => {
    const slide = slideOf({ kind: "matching", choices: [{ id: "c1", label: "", correct: true }, { id: "c2", label: "B", correct: false }] });
    expect(buildPreviewQuestion(slide, t)?.matching?.map((m) => m.prompt)).toEqual(["", "B"]);
  });

  test("slide.media position survives the sync", () => {
    const slide = slideOf({ kind: "multiple-choice", media: { type: "image", src: "https://x/q.png", alt: "Q", x: 0.1, y: 0.2, width: 0.3 }, runtimeQuestion: rq });
    const back = syncQuizEditorSlideFromRuntimeQuestion(slide, buildPreviewQuestion(slide, t) as Question);
    expect(back.media).toMatchObject({ x: 0.1, y: 0.2, width: 0.3 });
  });

  test("choice and drag item media keep name and position; only alt follows an edit", () => {
    const media = { type: "image", src: "https://x/a.png", alt: "A", name: "a.png", x: 1, y: 2, width: 3 };
    const slide = slideOf({ kind: "multiple-choice", choices: [{ id: "c1", label: "A", correct: true, media }] });
    const question = buildPreviewQuestion(slide, t)!;
    expect(syncQuizEditorSlideFromRuntimeQuestion(slide, question).choices?.[0].media).toEqual(media);
    const edited = { ...question, choices: [{ ...question.choices![0], image: { url: "https://x/a.png", alt: "mới" } }] };
    expect(syncQuizEditorSlideFromRuntimeQuestion(slide, edited).choices?.[0].media).toEqual({ ...media, alt: "mới" });

    const dd = slideOf({ kind: "drag-and-drop", dragDropItems: [{ id: "d1", label: "D", emoji: "", target: "Z", media }] });
    expect(syncQuizEditorSlideFromRuntimeQuestion(dd, buildPreviewQuestion(dd, t)!).dragDropItems?.[0].media).toEqual(media);
  });
});
