import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
    act(() => result.current.selectSlide("missing", "x"));
    act(() => result.current.addQuestion("multiple-choice"));
    expect(slidesOf(result, "g1")).toHaveLength(4);
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
});

describe("useQuizEditorState - duplicate / delete / replace", () => {
  it("duplicateSelected appends a titled copy and selects it", () => {
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

  it("deleteSelected removes the slide and selects the next, else previous, else the group", () => {
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

  it("with a group selected, duplicate and delete leave the groups alone", () => {
    const { result } = setup([group("g1", []), group("g2", [slide("x")])]);
    const before = result.current.groups;
    act(() => result.current.duplicateSelected());
    act(() => result.current.deleteSelected());
    act(() => result.current.replaceSelectedSlide(slide("x", { title: "X" })));
    expect(result.current.groups).toBe(before);
  });

  it("replaceSelectedSlide keeps only 'published' status, else marks unsaved", () => {
    const { result } = setup();
    act(() => result.current.selectSlide("g1", "a"));
    act(() => result.current.replaceSelectedSlide(slide("a", { title: "R", status: "draft" })));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ title: "R", status: "unsaved" });

    act(() => result.current.replaceSelectedSlide((current) => ({ ...current, title: "R2", status: "published" })));
    expect(slidesOf(result, "g1")[0]).toMatchObject({ title: "R2", status: "published" });
    expect(slidesOf(result, "g1")[1]).toEqual(slide("b"));
  });
});

describe("useQuizEditorState - statuses and loading", () => {
  it("markAllAsSavedDraft and setSlidesPublished update statuses", () => {
    const { result } = setup([group("g1", [slide("a", { status: "unsaved" }), slide("b"), slide("c", { status: "published" })])]);
    act(() => result.current.markAllAsSavedDraft());
    expect(slidesOf(result, "g1").map((s) => s.status)).toEqual(["draft", "draft", "published"]);

    act(() => result.current.setSlidesPublished(["a"]));
    expect(slidesOf(result, "g1").map((s) => s.status)).toEqual(["published", "draft", "published"]);
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
