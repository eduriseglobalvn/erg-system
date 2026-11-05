import { describe, expect, it } from "vitest";

import {
  appendSlideToGroups,
  buildSlideNumberMap,
  changeSlideQuestionType,
  countQuestionsByGroup,
  copySlideAs,
  getFirstNode,
  insertGroupAfter,
  insertSlideAfter,
  markSlidesPublished,
  markUnsavedSlidesAsDraft,
  moveGroupTo,
  moveSlideTo,
  removeSlideFromGroup,
  replaceGroupSlides,
  updateSlideInGroups,
  withEditedStatus,
} from "./quiz-editor-groups";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

function slide(id: string, title = id, kind: string = "multiple-choice", status?: string): QuizEditorSlide {
  return { id, title, kind, status } as unknown as QuizEditorSlide;
}

function group(id: string, slides: QuizEditorSlide[], title = id): QuizEditorGroup {
  return { id, title, rule: "all", randomCount: 0, slides };
}

const sample = () => [group("g1", [slide("a"), slide("b", "Beta")]), group("g2", [slide("c", "Gamma", "intro-slide")])];

describe("getFirstNode", () => {
  it("falls back to group-1 for empty/missing tree", () => {
    expect(getFirstNode(undefined)).toEqual({ type: "group", groupId: "group-1" });
    expect(getFirstNode([])).toEqual({ type: "group", groupId: "group-1" });
  });
  it("prefers first slide, else first group", () => {
    expect(getFirstNode(sample())).toEqual({ type: "slide", groupId: "g1", slideId: "a" });
    expect(getFirstNode([group("x", [])])).toEqual({ type: "group", groupId: "x" });
  });
});

describe("derived maps", () => {
  it("numbers slides across groups and counts only questions", () => {
    expect(buildSlideNumberMap(sample())).toEqual({ a: 1, b: 2, c: 3 });
    expect(countQuestionsByGroup(sample())).toEqual({ g1: 2, g2: 0 });
  });
});

describe("insertion", () => {
  it("appends to target, falls back to first group, creates group-1 when empty", () => {
    const r1 = appendSlideToGroups(sample(), "g2", slide("n"));
    expect(r1.groupId).toBe("g2");
    expect(r1.groups[1]!.slides.map((s) => s.id)).toEqual(["c", "n"]);
    expect(appendSlideToGroups(sample(), "missing", slide("n")).groupId).toBe("g1");
    const r3 = appendSlideToGroups([], "x", slide("n"));
    expect(r3.groupId).toBe("group-1");
    expect(r3.groups[0]!.slides).toHaveLength(1);
  });
  it("replaceGroupSlides updates existing or appends missing group", () => {
    const upd = replaceGroupSlides(sample(), "g1", "T", [slide("z")]);
    expect(upd[0]).toMatchObject({ title: "T" });
    expect(upd[0]!.slides.map((s) => s.id)).toEqual(["z"]);
    const added = replaceGroupSlides(sample(), "g9", "T", [slide("z")]);
    expect(added).toHaveLength(3);
    expect(added[2]!.id).toBe("g9");
  });
  it("insertGroupAfter / insertSlideAfter", () => {
    expect(insertGroupAfter(sample(), "g1", group("n", [])).map((g) => g.id)).toEqual(["g1", "n", "g2"]);
    expect(insertGroupAfter(sample(), "nope", group("n", [])).map((g) => g.id)).toEqual(["g1", "g2", "n"]);
    expect(insertSlideAfter(sample(), "g1", "a", slide("n"))[0]!.slides.map((s) => s.id)).toEqual(["a", "n", "b"]);
    expect(insertSlideAfter(sample(), "g1", null, slide("n"))[0]!.slides.map((s) => s.id)).toEqual(["a", "b", "n"]);
  });
});

describe("mutations", () => {
  it("removes slides", () => {
    expect(removeSlideFromGroup(sample(), "g1", "b")[0]!.slides.map((s) => s.id)).toEqual(["a"]);
  });
  it("gives a copy its own runtime question id, leaving the source alone", () => {
    const source = { ...slide("b", "Beta"), questionId: "q-9", runtimeQuestion: { id: "b", kind: "essay", title: "Beta" } } as unknown as QuizEditorSlide;
    const copy = copySlideAs(source, "slide-7");
    expect(copy).toMatchObject({ id: "slide-7", questionId: "q-9", runtimeQuestion: { id: "slide-7" } });
    expect(source.runtimeQuestion!.id).toBe("b");
  });
  it("marks drafts and published", () => {
    const g = [group("g", [slide("a", "a", "multiple-choice", "unsaved"), slide("b"), slide("c", "c", "x", "published")])];
    expect(markUnsavedSlidesAsDraft(g)[0]!.slides.map((s) => s.status)).toEqual(["draft", "draft", "published"]);
    expect(markSlidesPublished(g, ["b"])[0]!.slides.map((s) => s.status)).toEqual(["unsaved", "published", "published"]);
  });
  it("moves groups and slides", () => {
    expect(moveGroupTo(sample(), 0, 1).map((g) => g.id)).toEqual(["g2", "g1"]);
    expect(moveSlideTo(sample(), "g1", 0, 1)[0]!.slides.map((s) => s.id)).toEqual(["b", "a"]);
  });
  it("updateSlideInGroups touches only the target slide", () => {
    const base = sample();
    const out = updateSlideInGroups(base, "g1", "b", (s) => ({ ...s, title: "X" }));
    expect(out[0]!.slides[1]!.title).toBe("X");
    expect(out[0]!.slides[0]).toBe(base[0]!.slides[0]);
    expect(out[1]).toBe(base[1]);
  });
  it("changeSlideQuestionType sets control type", () => {
    expect(changeSlideQuestionType(slide("a"), "true-false").choiceControlType).toBe("radio");
    expect(changeSlideQuestionType(slide("a"), "multiple-response").choiceControlType).toBe("checkbox");
  });
  it("withEditedStatus keeps only published", () => {
    expect(withEditedStatus(slide("a", "a", "x", "published")).status).toBe("published");
    expect(withEditedStatus(slide("a", "a", "x", "draft")).status).toBe("unsaved");
  });
});
