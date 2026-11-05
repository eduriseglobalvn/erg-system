import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
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
