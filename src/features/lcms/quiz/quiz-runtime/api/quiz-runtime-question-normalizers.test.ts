import { describe, expect, it } from "vitest";

import { normalizeBackendQuestion } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-question-normalizers";

const normalize = (raw: Record<string, unknown>) =>
  normalizeBackendQuestion({ id: "q", kind: "single_choice", title: "T", ...raw }, 0, {}, "client-first");

describe("normalizeBackendQuestion images", () => {
  it("keeps choice image", () => {
    const q = normalize({ choices: [{ id: "a", label: "A", image: { url: "u", alt: "x" } }] });
    expect(q?.choices?.[0].image).toEqual({ url: "u", alt: "x" });
  });
  it("accepts backend media.src on choices", () => {
    const q = normalize({ choices: [{ id: "a", label: "A", media: { src: "u" } }] });
    expect(q?.choices?.[0].image).toEqual({ url: "u" });
  });
  it("keeps drag item image", () => {
    const q = normalize({ kind: "drag_drop", dragDropItems: [{ id: "d", label: "D", media: { src: "u" } }] });
    expect(q?.dragDropItems?.[0].image).toEqual({ url: "u" });
  });
});
