import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { HOTSPOT_PLACEHOLDER_IMAGE } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { questionTypeLabelKeys, type QuestionType, type QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { readSlideQuestion, readSlideReadiness, writeSlideQuestion } from "./slide-question";

const t = ((key: string) => key) as never;
const img = { type: "image", src: "data:image/png;base64,AAAA", alt: "A" };
const runtimeQuestion = {
  id: "s1", kind: "single_choice", title: "Old", points: 7,
  feedback: { correct: "ok", incorrect: "no", partial: "no" },
  choices: [{ id: "c1", label: "A", correct: true, image: { url: img.src, alt: "A" } }, { id: "c2", label: "B", correct: false }],
} as unknown as Question;
const slide = {
  id: "s1", title: "Old", kind: "multiple-choice", options: { score: 7 }, settingsOverride: { x: 1 }, overrideSettings: { y: 2 }, settings: { z: 3 }, questionSettings: { w: 4 },
  feedbackRows: [{ kind: "correct", score: 7, feedback: "ok" }], runtimeQuestion,
  choices: [{ id: "c1", label: "A", correct: true, media: img }, { id: "c2", label: "B", correct: false }],
} as unknown as QuizEditorSlide;

describe("slide question adapter", () => {
  it("leaves scores and settings bags untouched when the title changes", () => {
    const next = writeSlideQuestion(slide, { ...readSlideQuestion(slide, t)!, title: "new" });
    expect(next.title).toBe("new");
    expect(next.options).toEqual(slide.options);
    expect(next.settingsOverride).toEqual(slide.settingsOverride);
    expect(next.overrideSettings).toEqual(slide.overrideSettings);
    expect(next.settings).toEqual(slide.settings);
    expect(next.questionSettings).toEqual(slide.questionSettings);
    expect(next.feedbackRows).toEqual(slide.feedbackRows);
    expect(next.runtimeQuestion?.points).toBe(7);
  });

  it("keeps a choice image across the round trip", () => {
    const next = writeSlideQuestion(slide, readSlideQuestion(slide, t)!);
    expect(next.choices?.[0].media?.src).toBe(img.src);
  });

  it("writes a newly added choice image to choices[].media as a data URL", () => {
    const q = readSlideQuestion(slide, t)!;
    const edited = { ...q, choices: [{ ...q.choices![1], image: { url: "data:image/png;base64,AA", alt: "x" } }, q.choices![0]] };
    expect(writeSlideQuestion(slide, edited).choices?.[0].media?.src).toBe("data:image/png;base64,AA");
  });

  it("does not save the hotspot placeholder as the question image", () => {
    const hotspot = { id: "h1", title: "", kind: "hotspot" } as unknown as QuizEditorSlide;
    const next = writeSlideQuestion(hotspot, { ...readSlideQuestion(hotspot, t)!, title: "Tìm Hà Nội" });
    expect(next.media).toBeUndefined();
    expect(readSlideReadiness(next, t).issues.map((issue) => issue.message)).toContain("Chưa có ảnh");
  });

  it("keeps the hotspot image description and file name across title edits", () => {
    const media = { type: "image", src: img.src, alt: "Bản đồ", name: "ban-do.png" } as const;
    const hotspot = { id: "h1", title: "", kind: "hotspot", media } as unknown as QuizEditorSlide;
    const once = writeSlideQuestion(hotspot, { ...readSlideQuestion(hotspot, t)!, title: "A" });
    const twice = writeSlideQuestion(once, { ...readSlideQuestion(once, t)!, title: "AB" });
    expect(twice.media).toEqual(media);
  });

  it("keeps the content image file name across title edits", () => {
    const media = { type: "image", src: img.src, alt: "Hình", name: "hinh.png", x: 0.5 } as const;
    const next = writeSlideQuestion({ ...slide, media }, { ...readSlideQuestion({ ...slide, media }, t)!, title: "new" });
    expect(next.media).toEqual(media);
  });
});

// Guard: a title-only edit must change nothing but the title (plus the attached runtimeQuestion), for every type.
const KINDS = Object.keys(questionTypeLabelKeys) as QuestionType[];
let nextId = 0;
const createId = (prefix: string) => `${prefix}-${++nextId}`;
const pic = (name: string) => ({ type: "image", src: `https://cdn.test/${name}.png`, alt: name, name: `${name}.png` }) as const;

function oldSlide(kind: QuestionType): QuizEditorSlide {
  const pairs = kind === "matching" || kind === "drag-and-drop";
  const choices =
    kind === "numeric"
      ? [{ id: "c1", label: "12", correct: true, media: pic("c1") }]
      : kind === "true-false"
        ? [{ id: "c1", label: "Đúng", correct: true, media: pic("c1") }, { id: "c2", label: "Sai", correct: false }]
        : [
            { id: "c1", label: "Alpha", correct: true, media: pic("c1") },
            { id: "c2", label: "Beta", correct: false },
            { id: "c3", label: "Gamma", correct: false, media: pic("c3") },
          ];
  return {
    id: `old-${kind}`, title: "Câu cũ", kind, description: "Mô tả", status: "published", questionId: "q-1", bankQuestionId: "b-1",
    media: kind === "hotspot" ? pic("map") : { ...pic("q"), x: 0.1, y: 0.2, width: 0.5 },
    choiceControlType: kind === "multiple-response" ? "checkbox" : "radio",
    choices: pairs ? [] : choices,
    dragDropItems: pairs
      ? [
          { id: "i1", label: "L1", target: "T1", emoji: "🍎", media: pic("i1"), targetMedia: pic("t1") },
          { id: "i2", label: "L2", target: "T2", emoji: "", media: null, targetMedia: null },
        ]
      : undefined,
    hotspotAreas: kind === "hotspot" ? [{ id: "a1", shape: "ellipse", x: 0.1, y: 0.2, width: 0.3, height: 0.3, correct: true }] : undefined,
    feedbackRows: [
      { id: "f1", kind: "correct", feedback: "Giỏi", score: 7, branching: "By Result" },
      { id: "f2", kind: "incorrect", feedback: "", score: 0, branching: "By Result" },
    ],
    options: { shuffleAnswers: true }, settings: { a: 1 }, questionSettings: { b: 2 }, questionSetSettings: { points: 7, shuffleChoices: true },
    settingsOverride: { c: 3 }, overrideSettings: { d: 4 },
  };
}

const newSlide = (kind: QuestionType) => buildQuestionSlide(kind, createNewQuizProjectSettings("x"), createId);
const editTitle = (slide: QuizEditorSlide) => writeSlideQuestion(slide, { ...readSlideQuestion(slide, t)!, title: "x" });

describe.each([
  ["a new slide", newSlide],
  ["an old slide without runtimeQuestion", oldSlide],
])("a title edit on %s", (_, make) => {
  it("covers all 14 question types", () => expect(KINDS).toHaveLength(14));

  it.each(KINDS)("%s changes only the title", (kind) => {
    const slide = make(kind);
    const out = editTitle(slide);
    expect(out.title).toBe("x");
    expect(out.runtimeQuestion).toBeDefined();
    expect({ ...out, title: slide.title, runtimeQuestion: slide.runtimeQuestion }).toEqual(slide);
    expect(JSON.stringify(out)).not.toContain("data:");
    expect(readSlideQuestion(out, t)).toEqual({ ...readSlideQuestion(slide, t), title: "x" });
  });
});

describe("a new slide with only a title", () => {
  it.each(KINDS.filter((kind) => kind !== "essay"))("%s is not ready", (kind) => {
    expect(readSlideReadiness(editTitle(newSlide(kind)), t).ready).toBe(false);
  });

  it("essay is ready on its title alone (spec §7) and invents no rubric", () => {
    const out = editTitle(newSlide("essay"));
    expect(readSlideReadiness(out, t).ready).toBe(true);
    expect(out.runtimeQuestion?.essayRubric ?? []).toEqual([]);
  });

  it("keeps true-false as true-false", () => {
    const out = editTitle(newSlide("true-false"));
    expect(out.kind).toBe("true-false");
    expect(out.runtimeQuestion?.kind).toBe("true_false");
  });

  it("stays without an image for a hotspot", () => {
    const out = editTitle(newSlide("hotspot"));
    expect(out.runtimeQuestion?.hotspotImage).toBeUndefined();
    expect(readSlideReadiness(out, t).issues.map((issue) => issue.message)).toContain("Chưa có ảnh");
  });
});

describe("old images held only on the slide", () => {
  const base = oldSlide("multiple-choice");
  const stale = {
    ...base,
    runtimeQuestion: { ...readSlideQuestion(base, t)!, choices: base.choices!.map(({ id, label, correct }) => ({ id, label, correct })) },
  } as QuizEditorSlide;

  it("shows them on the card when runtimeQuestion lacks them", () => {
    expect(readSlideQuestion(stale, t)?.choices?.[0].image?.url).toBe("https://cdn.test/c1.png");
  });

  it("keeps them through a title edit", () => {
    expect(editTitle(stale).choices).toEqual(base.choices);
  });

  it("keeps matching pair images through a title edit", () => {
    const pairs = oldSlide("matching");
    const runtime = readSlideQuestion(pairs, t)!;
    const strip = { ...pairs, runtimeQuestion: { ...runtime, matching: runtime.matching!.map(({ id, prompt, response }) => ({ id, prompt, response })) } };
    expect(editTitle(strip).dragDropItems).toEqual(pairs.dragDropItems);
  });

  it("removes an image only when the question drops it", () => {
    const q = readSlideQuestion(stale, t)!;
    const out = writeSlideQuestion(stale, { ...q, choices: q.choices!.map((c) => ({ ...c, image: undefined })) });
    expect(out.choices?.map((c) => c.media ?? null)).toEqual([null, null, null]);
    expect(readSlideQuestion(out, t)?.choices?.some((c) => c.image)).toBe(false);
  });

  it("never stores the legacy hotspot placeholder", () => {
    const hotspot = { ...newSlide("hotspot"), runtimeQuestion: { ...readSlideQuestion(newSlide("hotspot"), t)!, hotspotImage: { url: HOTSPOT_PLACEHOLDER_IMAGE, width: 1, height: 1 } } };
    expect(readSlideQuestion(hotspot, t)?.hotspotImage).toBeUndefined();
    expect(JSON.stringify(editTitle(hotspot))).not.toContain("data:");
  });

  it("treats a legacy placeholder held in slide.media as no image", () => {
    const hotspot = { ...newSlide("hotspot"), media: { type: "image", src: HOTSPOT_PLACEHOLDER_IMAGE, alt: "" } } as QuizEditorSlide;
    expect(readSlideQuestion(hotspot, t)?.hotspotImage).toBeUndefined();
    expect(readSlideReadiness(hotspot, t).issues.map((issue) => issue.message)).toContain("Chưa có ảnh");
    expect(JSON.stringify(editTitle(hotspot))).not.toContain("data:");
  });
});

describe("short answer slides", () => {
  it("reads an old slide as one blank holding every correct spelling", () => {
    const old = oldSlide("short-answer");
    const marked = { ...old, choices: old.choices!.map((c) => ({ ...c, correct: c.label !== "Beta" })) };
    const blanks = readSlideQuestion(marked, t)!.textBlanks!;
    expect(blanks).toHaveLength(1);
    expect(blanks[0].correctAnswers).toEqual(["Alpha", "Gamma"]);
  });
});

describe("legacy fill-blank slide built from empty data", () => {
  it("is not ready", () => {
    const empty = { id: "s1", title: "Q", kind: "fill-in-the-blanks" } as unknown as QuizEditorSlide;
    expect(readSlideReadiness(empty, t).ready).toBe(false);
  });
});
