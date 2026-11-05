import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

function slide(id: string, extra: Partial<QuizEditorSlide> = {}): QuizEditorSlide {
  return { id, title: id, kind: "multiple-choice", ...extra } as unknown as QuizEditorSlide;
}

function group(id: string, slides: QuizEditorSlide[], extra: Partial<QuizEditorGroup> = {}): QuizEditorGroup {
  return { id, title: id, rule: "all", randomCount: 0, slides, ...extra };
}

function draft(tree: QuizEditorGroup[]) {
  // settings/playerTemplate omitted on purpose: the hook falls back to its defaults.
  return { tree } as unknown as QuizEditorDraftDocument;
}

const sampleTree = () => [
  group("g1", [slide("a"), slide("b"), slide("c")]),
  group("g2", [slide("d", { kind: "intro-slide", title: "Welcome" })]),
];

function setup(tree: QuizEditorGroup[] = sampleTree()) {
  return renderHook(() => useQuizEditorState(draft(tree)));
}

function slidesOf(result: ReturnType<typeof setup>["result"], groupId: string) {
  return result.current.groups.find((g) => g.id === groupId)!.slides;
}

describe("useQuizEditorState - initial selection", () => {
  it("selects the first slide of the first group", () => {
    const { result } = setup();
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: "a" });
    expect(result.current.selectedSlide?.id).toBe("a");
    expect(result.current.selectedGroup?.id).toBe("g1");
  });

  it("selects the first group when it has no slides", () => {
    const { result } = setup([group("g1", []), group("g2", [slide("x")])]);
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: "g1" });
    expect(result.current.selectedSlide).toBeNull();
  });

  it("falls back to the empty default group when no draft is given", () => {
    const { result } = renderHook(() => useQuizEditorState());
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: "group-1" });
  });

  it("computes slide numbers, totals and question counts", () => {
    const { result } = setup();
    expect(result.current.slideNumberMap).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    expect(result.current.totalSlides).toBe(4);
    expect(result.current.questionCounts).toEqual({ g1: 3, g2: 0 });
  });
});

describe("useQuizEditorState - insertion", () => {
  it("addQuestion appends to the selected group and selects the new slide", () => {
    const { result } = setup();
    act(() => result.current.addQuestion("multiple-choice"));

    const slides = slidesOf(result, "g1");
    expect(slides).toHaveLength(4);
    const added = slides[3]!;
    expect(added.id).toMatch(/^slide-\d+$/);
    expect(added.status).toBe("unsaved");
    expect(slidesOf(result, "g2")).toHaveLength(1);
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: added.id });
  });

  it("creates unique, increasing ids across successive inserts", () => {
    const { result } = setup();
    act(() => result.current.addQuestion("multiple-choice"));
    act(() => result.current.addQuestion("true-false"));

    const [first, second] = slidesOf(result, "g1").slice(3);
    const num = (id: string) => Number(id.split("-")[1]);
    expect(num(second!.id)).toBeGreaterThan(num(first!.id));
    expect(first!.id).not.toBe(second!.id);
    expect(second!.kind).toBe("true-false");
    expect(second!.choiceControlType).toBe("radio");
  });

  it("falls back to the first group when the target group is missing", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("missing"));
    act(() => result.current.addQuestion("multiple-choice"));
    expect(slidesOf(result, "g1")).toHaveLength(4);
    // groupId of the selection is not asserted: original code has the same lazy-updater quirk.
    expect(result.current.selectedNode).toMatchObject({ type: "slide", slideId: slidesOf(result, "g1")[3]!.id });
  });

  it("creates group-1 inside the setGroups updater when there are no groups", () => {
    const { result } = setup([]);
    expect(result.current.groups).toEqual([]);
    act(() => result.current.addQuestion("multiple-choice"));

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0]).toMatchObject({ id: "group-1", rule: "all", randomCount: 0 });
    const added = result.current.groups[0]!.slides[0]!;
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "group-1", slideId: added.id });
  });

  it("addQuestionGroup appends an empty group and selects it", () => {
    const { result } = setup();
    act(() => result.current.addQuestionGroup());

    expect(result.current.groups).toHaveLength(3);
    const added = result.current.groups[2]!;
    expect(added.slides).toEqual([]);
    expect(added.id).toMatch(/^group-\d+$/);
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: added.id });
  });
});

describe("useQuizEditorState - duplicate / delete / move / copy / paste", () => {
  it("duplicateSelected on a slide appends a titled copy and selects it", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));
    act(() => result.current.duplicateSelected());

    const slides = slidesOf(result, "g1");
    expect(slides.map((s) => s.title)).toEqual(["a", "b", "c", "b (Bản sao)"]);
    expect(slides[3]!.id).not.toBe("b");
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: slides[3]!.id });
  });

  it("duplicateSelected gives the copy its own runtime question id", () => {
    const { result } = setup([group("g1", [slide("a", { runtimeQuestion: { id: "a", kind: "essay", title: "a" } as never })])]);
    act(() => result.current.duplicateSelected());
    const copy = slidesOf(result, "g1")[1]!;
    expect(copy.runtimeQuestion?.id).toBe(copy.id);
  });

  it("duplicateSelected on a group appends a copy with fresh slide ids", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g1"));
    act(() => result.current.duplicateSelected());

    expect(result.current.groups).toHaveLength(3);
    const copy = result.current.groups[2]!;
    expect(copy.title).toBe("g1 Copy");
    expect(copy.slides).toHaveLength(3);
    expect(copy.slides.map((s) => s.id)).not.toContain("a");
    expect(new Set(copy.slides.map((s) => s.id)).size).toBe(3);
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: copy.id });
  });

  it("deleteSelected on a slide removes it and selects the next, else previous, else the group", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));
    act(() => result.current.deleteSelected());
    expect(slidesOf(result, "g1").map((s) => s.id)).toEqual(["a", "c"]);
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: "c" });

    act(() => result.current.deleteSelected());
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: "a" });

    act(() => result.current.deleteSelected());
    expect(slidesOf(result, "g1")).toEqual([]);
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: "g1" });
  });

  it("deleteSelected on a group removes it and selects a fallback group", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g1"));
    act(() => result.current.deleteSelected());
    expect(result.current.groups.map((g) => g.id)).toEqual(["g2"]);
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: "g2" });
  });

  it("does not delete or move the intro group", () => {
    const { result } = setup([group("group-intro", [slide("i")]), group("g1", [slide("a")])]);
    act(() => result.current.selectGroup("group-intro"));
    act(() => result.current.deleteSelected());
    act(() => result.current.moveSelected("down"));
    expect(result.current.groups.map((g) => g.id)).toEqual(["group-intro", "g1"]);
  });

  it("moveSelected reorders slides within bounds", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.moveSelected("up")); // out of bounds, no-op
    expect(slidesOf(result, "g1").map((s) => s.id)).toEqual(["a", "b", "c"]);

    act(() => result.current.moveSelected("down"));
    expect(slidesOf(result, "g1").map((s) => s.id)).toEqual(["b", "a", "c"]);
    act(() => result.current.moveSelected("down"));
    act(() => result.current.moveSelected("down")); // out of bounds, no-op
    expect(slidesOf(result, "g1").map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("moveSelected reorders groups", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g2"));
    act(() => result.current.moveSelected("up"));
    expect(result.current.groups.map((g) => g.id)).toEqual(["g2", "g1"]);
    act(() => result.current.moveSelected("up")); // already first
    expect(result.current.groups.map((g) => g.id)).toEqual(["g2", "g1"]);
  });

  it("copy + paste of a slide inserts a copy right after the selected slide", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.copySelected());
    expect(result.current.clipboard?.type).toBe("slide");

    act(() => result.current.selectSlide("g1", "b"));
    act(() => result.current.pasteIntoSelected());

    const slides = slidesOf(result, "g1");
    expect(slides.map((s) => s.title)).toEqual(["a", "b", "a", "c"]);
    expect(slides[2]!.id).not.toBe("a");
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "g1", slideId: slides[2]!.id });
  });

  it("pasting a slide while a group is selected appends it to that group", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.copySelected());
    act(() => result.current.selectGroup("g2"));
    act(() => result.current.pasteIntoSelected());
    expect(slidesOf(result, "g2").map((s) => s.title)).toEqual(["Welcome", "a"]);
  });

  it("copy + paste of a group inserts a renamed copy right after the selected group", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g1"));
    act(() => result.current.copySelected());
    act(() => result.current.pasteIntoSelected());

    expect(result.current.groups.map((g) => g.title)).toEqual(["g1", "g1 Copy", "g2"]);
    const copy = result.current.groups[1]!;
    expect(copy.id).not.toBe("g1");
    expect(copy.slides.map((s) => s.id)).not.toContain("a");
    expect(result.current.selectedNode).toEqual({ type: "group", groupId: copy.id });
  });

  it("paste is a no-op with an empty clipboard", () => {
    const { result } = setup();
    const before = result.current.groups;
    act(() => result.current.pasteIntoSelected());
    expect(result.current.groups).toBe(before);
  });

  it("cutSelected copies to the clipboard then deletes", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));
    act(() => result.current.cutSelected());
    expect(result.current.clipboard).toMatchObject({ type: "slide", payload: { id: "b" } });
    expect(slidesOf(result, "g1").map((s) => s.id)).toEqual(["a", "c"]);
  });
});

describe("useQuizEditorState - bulk slide operations", () => {
  it("markAllAsSavedDraft and setSlidesPublished update statuses", () => {
    const { result } = setup([group("g1", [slide("a", { status: "unsaved" }), slide("b"), slide("c", { status: "published" })])]);
    act(() => result.current.markAllAsSavedDraft());
    expect(slidesOf(result, "g1").map((s) => s.status)).toEqual(["draft", "draft", "published"]);

    act(() => result.current.setSlidesPublished(["a"]));
    expect(slidesOf(result, "g1").map((s) => s.status)).toEqual(["published", "draft", "published"]);
  });
});

describe("useQuizEditorState - search, collapse, hydrate", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("toggles, collapses and expands groups", () => {
    const { result } = setup();
    act(() => result.current.toggleGroupCollapsed("g1"));
    expect(result.current.collapsedGroupIds).toEqual(["g1"]);
    act(() => result.current.toggleGroupCollapsed("g1"));
    expect(result.current.collapsedGroupIds).toEqual([]);
    act(() => result.current.collapseAllGroups());
    expect(result.current.collapsedGroupIds).toEqual(["g1", "g2"]);
    act(() => result.current.expandAllGroups());
    expect(result.current.collapsedGroupIds).toEqual([]);
  });

  it("a question added after reloading a quiz never reuses an id already in it, and deleting it keeps the old one", () => {
    const day1 = renderHook(() => useQuizEditorState());
    act(() => day1.result.current.addQuestion("multiple-choice"));
    const savedTree = day1.result.current.groups;
    const oldId = savedTree[0]!.slides[0]!.id;

    const { result } = renderHook(() => useQuizEditorState());
    act(() => result.current.hydrateDraftDocument({ ...draft(savedTree), settings: day1.result.current.quizProject }));
    act(() => result.current.addQuestion("multiple-choice"));
    const [old, added] = slidesOf(result, savedTree[0]!.id);
    expect(added!.id).not.toBe(oldId);
    expect(JSON.stringify(savedTree)).not.toContain(`"${added!.id}"`);

    act(() => result.current.deleteSelected());
    expect(slidesOf(result, savedTree[0]!.id)).toEqual([old]);
  });

  it("ids stay unique against a draft given at mount", () => {
    const day1 = renderHook(() => useQuizEditorState());
    act(() => day1.result.current.addQuestion("multiple-choice"));
    const savedTree = day1.result.current.groups;

    const { result } = renderHook(() => useQuizEditorState(draft(savedTree)));
    act(() => result.current.addQuestion("multiple-choice"));
    const added = slidesOf(result, savedTree[0]!.id)[1]!;
    expect(JSON.stringify(savedTree)).not.toContain(`"${added.id}"`);
  });

  it("hydrateDraftDocument replaces the tree and reselects the first node", () => {
    const { result } = setup();
    act(() => result.current.hydrateDraftDocument(draft([group("z", [slide("zz")])])));
    expect(result.current.groups.map((g) => g.id)).toEqual(["z"]);
    expect(result.current.selectedNode).toEqual({ type: "slide", groupId: "z", slideId: "zz" });
  });
});

describe("useQuizEditorState - selected updaters", () => {
  it("group title/rule only touch the selected group", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g2"));
    act(() => result.current.updateSelectedGroupTitle("New"));
    act(() => result.current.updateSelectedGroupRule("random"));
    expect(result.current.groups[0]).toMatchObject({ title: "g1", rule: "all" });
    expect(result.current.groups[1]).toMatchObject({ title: "New", rule: "random" });
  });

  it("slide field updaters touch only the selected slide", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));

    act(() => result.current.updateSelectedSlideTitle("T"));
    act(() => result.current.updateSelectedSlideDescription("D"));
    act(() => result.current.updateSelectedSlideInstructions(["i1"]));
    act(() => result.current.updateSelectedSlideChoices([{ id: "c1", label: "L", correct: true }] as never));
    act(() => result.current.updateSelectedSlideDragDropItems([{ id: "dd" }] as never));
    act(() => result.current.updateSelectedSlideFeedbackRows([{ kind: "correct" }] as never));

    const [a, b, c] = slidesOf(result, "g1");
    expect(b).toMatchObject({
      id: "b",
      title: "T",
      description: "D",
      instructions: ["i1"],
      choices: [{ id: "c1", label: "L", correct: true }],
      dragDropItems: [{ id: "dd" }],
      feedbackRows: [{ kind: "correct" }],
    });
    expect(a).toEqual(slide("a"));
    expect(c).toEqual(slide("c"));
    expect(slidesOf(result, "g2")).toEqual([slide("d", { kind: "intro-slide", title: "Welcome" })]);
  });

  it("replaceSelectedSlide keeps only 'published' status, else marks unsaved", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.replaceSelectedSlide(slide("a", { title: "R", status: "draft" })));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ title: "R", status: "unsaved" });

    act(() => result.current.replaceSelectedSlide(slide("a", { title: "R2", status: "published" })));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ title: "R2", status: "published" });
    expect(slidesOf(result, "g1")[1]).toEqual(slide("b"));
  });

  it("updateSelectedSlideTextStyle patches textStyle and the question text style of the selected slide only", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));
    act(() => result.current.updateSelectedSlideTextStyle({ fontSize: 33 } as never));

    const [a, b] = slidesOf(result, "g1");
    expect(b!.textStyle).toMatchObject({ fontSize: 33 });
    expect(b!.textStyles?.question).toMatchObject({ fontSize: 33 });
    expect(a!.textStyle).toBeUndefined();
  });

  it("applySelectedSlideTextStyles merges text styles and derives the question style", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "b"));
    act(() =>
      result.current.applySelectedSlideTextStyles({
        question: { fontSize: 20 },
        answer: { fontSize: 10 },
      } as never),
    );
    const b = slidesOf(result, "g1")[1]!;
    expect(b.textStyle).toMatchObject({ fontSize: 20 });
    expect(b.textStyles).toMatchObject({ question: { fontSize: 20 }, answer: { fontSize: 10 } });
    expect(slidesOf(result, "g1")[0]!.textStyles).toBeUndefined();
  });

  it("updateSelectedSlideOptions and element offset merge into options", () => {
    const { result } = setup([group("g1", [slide("a", { options: { shuffleAnswers: true } as never }), slide("b")])]);
    act(() => result.current.updateSelectedSlideOptions({ shuffleAnswers: false } as never));
    act(() => result.current.updateSelectedSlideElementOffset("title", { x: 1, y: 2 } as never));
    act(() => result.current.updateSelectedSlideElementOffset("body", { x: 3, y: 4 } as never));

    const [a, b] = slidesOf(result, "g1");
    expect(a!.options).toMatchObject({
      shuffleAnswers: false,
      elementOffsets: { title: { x: 1, y: 2 }, body: { x: 3, y: 4 } },
    });
    expect(b).toEqual(slide("b"));
  });

  it("changeSelectedQuestionType switches kind and control type for question slides only", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.changeSelectedQuestionType("multiple-response"));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ kind: "multiple-response", choiceControlType: "checkbox" });
    act(() => result.current.changeSelectedQuestionType("true-false"));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ kind: "true-false", choiceControlType: "radio" });
    expect(slidesOf(result, "g1")[1]).toEqual(slide("b"));

    // intro slide is not a question: no-op
    act(() => result.current.selectSlide("g2", "d"));
    const before = result.current.groups;
    act(() => result.current.changeSelectedQuestionType("true-false"));
    expect(result.current.groups).toBe(before);
  });

  it("updaters are no-ops when only a group (no slide) is selected", () => {
    const { result } = setup();
    act(() => result.current.selectGroup("g1"));
    const before = result.current.groups;
    act(() => result.current.updateSelectedSlideTitle("X"));
    act(() => result.current.updateSelectedSlideChoices([]));
    act(() => result.current.updateSelectedSlideTextStyle({ fontSize: 1 } as never));
    act(() => result.current.updateSelectedSlideOptions({} as never));
    act(() => result.current.changeSelectedQuestionType("true-false"));
    expect(result.current.groups).toBe(before);
  });

  it("updaters are no-ops when nothing resolves (empty tree)", () => {
    const { result } = setup([]);
    const before = result.current.groups;
    act(() => result.current.updateSelectedGroupTitle("X"));
    act(() => result.current.updateSelectedSlideTitle("X"));
    act(() => result.current.duplicateSelected());
    act(() => result.current.deleteSelected());
    act(() => result.current.moveSelected("down"));
    act(() => result.current.copySelected());
    expect(result.current.groups).toBe(before);
    expect(result.current.clipboard).toBeNull();
  });
});
