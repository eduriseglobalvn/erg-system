import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { AnswerArea } from "./answer-area";
import { ClassifyAuthoring } from "./classify-authoring";
import { assessQuestionReadiness } from "./question-readiness";
import { readSlideQuestion } from "./slide-question";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
// Pointer drags need real layout, so tests call the captured onDragEnd the way dnd-kit does on a drop.
const dnd = vi.hoisted(() => ({ onDragEnd: (() => {}) as (event: unknown) => void }));
vi.mock("@dnd-kit/core", async (orig) => {
  const real = await orig<typeof import("@dnd-kit/core")>();
  return { ...real, DndContext: (props: Parameters<typeof real.DndContext>[0]) => { dnd.onDragEnd = props.onDragEnd as never; return <real.DndContext {...props} />; } };
});

let n = 0;
const slide = () => buildQuestionSlide("drag-and-drop", createNewQuizProjectSettings(), (p) => `${p}-${++n}`);
const fresh = () => readSlideQuestion(slide(), ((key: string) => key) as never)!;

let latest: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  return <ClassifyAuthoring onUpdate={(change) => setQ((current) => change(current))} question={q} />;
}

/** Applies updates only when flush() runs, like a parent that defers them. */
const deferred: ((latest: Question) => Question)[] = [];
let setDeferred: (change: (current: Question) => Question) => void;
function DeferredHarness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  useEffect(() => { setDeferred = setQ; }, []);
  return <ClassifyAuthoring onUpdate={(change) => { deferred.push(change); }} question={q} />;
}
const flush = () => { const changes = deferred.splice(0); setDeferred((current) => changes.reduce((acc, change) => change(acc), current)); };

const groupIds = () => latest.dropTargets!.map((g) => g.id);
const codes = () => assessQuestionReadiness(latest, { hasQuestionImage: false }).issues.map((issue) => issue.code);
const grip = (m: number) => screen.getByRole("button", { name: `Kéo mục ${m} sang nhóm khác, Alt+mũi tên trái/phải để chuyển` });
const addItem = (column: number) => fireEvent.click(screen.getAllByRole("button", { name: "Thêm mục" })[column - 1]);
const drop = (active: string, over: string | null) => act(() => dnd.onDragEnd({ active: { id: active }, over: over && { id: over } }));
const withItem = (group: number, extra: Partial<Question> = {}): Question => {
  const q = fresh();
  return { ...q, dragDropItems: [{ id: "i1", label: "A", correctTargetId: q.dropTargets![group - 1].id }], ...extra };
};

beforeEach(() => vi.clearAllMocks());

describe("ClassifyAuthoring", () => {
  it("shows a column for each of the two new groups", () => {
    render(<Harness start={fresh()} />);
    expect(screen.getByRole("textbox", { name: "Tên nhóm 1" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tên nhóm 2" })).toBeInTheDocument();
  });

  it("adds a focused item to the column and writes what is typed", () => {
    render(<Harness start={fresh()} />);
    addItem(1);
    expect(latest.dragDropItems).toHaveLength(1);
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[0]);
    const input = screen.getByRole("textbox", { name: "Mục 1 nhóm 1" });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "AVERAGE" } });
    expect(latest.dragDropItems![0].label).toBe("AVERAGE");
  });

  it("moves an item to the next group with Alt+ArrowRight and keeps focus on its grip", () => {
    render(<Harness start={fresh()} />);
    addItem(1);
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[1]);
    expect(screen.getByRole("textbox", { name: "Mục 1 nhóm 2" })).toBeInTheDocument();
    expect(document.activeElement).toBe(grip(1));
  });

  it("locks delete on a group that holds an item and deletes it once empty, leaving the items alone", () => {
    render(<Harness start={fresh()} />);
    addItem(1);
    fireEvent.change(screen.getByRole("textbox", { name: "Mục 1 nhóm 1" }), { target: { value: "AVERAGE" } });
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    const remove = screen.getByRole("button", { name: "Xoá nhóm 2" });
    expect(remove).toBeDisabled();
    // A disabled button gets no hover, so the hint sits on a wrapper.
    const hint = screen.getByTitle("Chuyển hoặc xoá các mục trước");
    expect(hint).not.toBe(remove);
    expect(hint).toContainElement(remove);
    fireEvent.keyDown(grip(1), { key: "ArrowLeft", altKey: true });
    const items = latest.dragDropItems;
    fireEvent.click(screen.getByRole("button", { name: "Xoá nhóm 2" }));
    expect(latest.dropTargets).toHaveLength(1);
    expect(latest.dragDropItems).toEqual(items);
  });

  it("adds a third group and focuses its name", () => {
    render(<Harness start={fresh()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm nhóm" }));
    expect(latest.dropTargets).toHaveLength(3);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Tên nhóm 3" }));
  });

  it("adds an item on Enter in the last filled item, but not while composing", () => {
    render(<Harness start={fresh()} />);
    addItem(2);
    const input = screen.getByRole("textbox", { name: "Mục 1 nhóm 2" });
    fireEvent.change(input, { target: { value: "AVERAGE" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(latest.dragDropItems).toHaveLength(1);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(latest.dragDropItems).toHaveLength(2);
    expect(latest.dragDropItems![1].correctTargetId).toBe(groupIds()[1]);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Mục 2 nhóm 2" }));
  });

  it("puts a picked image on the item", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,AA", width: 1, height: 1 });
    render(<Harness start={fresh()} />);
    addItem(1);
    fireEvent.change(screen.getByLabelText("Ảnh mục 1 nhóm 1"), { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    await waitFor(() => expect(latest.dragDropItems![0].image?.url).toBe("data:image/png;base64,AA"));
  });
});

describe("ClassifyAuthoring moves and focus", () => {
  it("moves an item to the group it is dropped on, and ignores a drop outside any group", () => {
    render(<Harness start={withItem(1)} />);
    drop("i1", null);
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[0]);
    drop("i1", groupIds()[1]);
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[1]);
    expect(screen.getByRole("textbox", { name: "Mục 1 nhóm 2" })).toHaveValue("A");
  });

  it("leaves an item in place at the first and last column", () => {
    render(<Harness start={withItem(1)} />);
    fireEvent.keyDown(grip(1), { key: "ArrowLeft", altKey: true });
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[0]);
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[1]);
  });

  it("keeps focus on the grip when the parent applies the move later", () => {
    render(<DeferredHarness start={withItem(1)} />);
    grip(1).focus();
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    act(() => flush());
    expect(screen.getByRole("textbox", { name: "Mục 1 nhóm 2" })).toBeInTheDocument();
    expect(document.activeElement).toBe(grip(1));
  });

  it("moves focus to the next item after a delete, then to the group name", () => {
    render(<Harness start={withItem(1)} />);
    addItem(1);
    fireEvent.change(screen.getByRole("textbox", { name: "Mục 2 nhóm 1" }), { target: { value: "B" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá mục 1 nhóm 1" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Mục 1 nhóm 1" }));
    expect(document.activeElement).toHaveValue("B");
    fireEvent.click(screen.getByRole("button", { name: "Xoá mục 1 nhóm 1" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Tên nhóm 1" }));
  });

  it("moves focus to the next group after a delete, and to Thêm nhóm after the last", () => {
    render(<Harness start={fresh()} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá nhóm 1" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Tên nhóm 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Xoá nhóm 1" }));
    expect(latest.dropTargets).toEqual([]);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Thêm nhóm" }));
  });
});

describe("ClassifyAuthoring unassigned items", () => {
  const legacy = () => withItem(1, { dragDropItems: [{ id: "old", label: "Cũ", correctTargetId: "gone" }] });

  it("shows an item whose group is gone under Chưa thuộc nhóm, with no name, group delete or add", () => {
    render(<Harness start={legacy()} />);
    expect(screen.getByText("Chưa thuộc nhóm")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mục 1 chưa thuộc nhóm" })).toHaveValue("Cũ");
    expect(screen.getAllByRole("textbox", { name: /^Tên nhóm/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /^Xoá nhóm/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Thêm mục" })).toHaveLength(2);
    fireEvent.change(screen.getByRole("textbox", { name: "Mục 1 chưa thuộc nhóm" }), { target: { value: "Mới" } });
    expect(latest.dragDropItems![0]).toEqual({ id: "old", label: "Mới", correctTargetId: "gone" });
    expect(codes()).toContain("item-group");
  });

  it("moves the item into the first group with Alt+ArrowRight, and the column goes away", () => {
    render(<Harness start={legacy()} />);
    fireEvent.keyDown(grip(1), { key: "ArrowRight", altKey: true });
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[0]);
    expect(screen.queryByText("Chưa thuộc nhóm")).toBeNull();
    expect(document.activeElement).toBe(grip(1));
    expect(codes()).not.toContain("item-group");
  });

  it("moves the item into the group it is dropped on", () => {
    render(<Harness start={legacy()} />);
    drop("old", groupIds()[1]);
    expect(latest.dragDropItems![0].correctTargetId).toBe(groupIds()[1]);
    expect(screen.queryByText("Chưa thuộc nhóm")).toBeNull();
  });

  it("deletes the item", () => {
    render(<Harness start={legacy()} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá mục 1 chưa thuộc nhóm" }));
    expect(latest.dragDropItems).toEqual([]);
    expect(screen.queryByText("Chưa thuộc nhóm")).toBeNull();
  });
});

describe("AnswerArea classification", () => {
  it("authors a drag-and-drop slide as columns", () => {
    const s = slide();
    render(<AnswerArea onChange={() => {}} onUpdate={() => {}} question={readSlideQuestion(s, ((key: string) => key) as never)!} slide={s} />);
    expect(screen.getByRole("textbox", { name: "Tên nhóm 1" })).toBeInTheDocument();
  });
});
