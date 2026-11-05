import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { AnswerArea } from "./answer-area";
import { ClassifyAuthoring } from "./classify-authoring";
import { readSlideQuestion } from "./slide-question";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

let n = 0;
const slide = () => buildQuestionSlide("drag-and-drop", createNewQuizProjectSettings(), (p) => `${p}-${++n}`);
const fresh = () => readSlideQuestion(slide(), ((key: string) => key) as never)!;

let latest: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  return <ClassifyAuthoring onChange={setQ} onUpdate={(change) => setQ((current) => change(current))} question={q} />;
}

const groupIds = () => latest.dropTargets!.map((g) => g.id);
const grip = (m: number) => screen.getByRole("button", { name: `Kéo mục ${m} sang nhóm khác, Alt+mũi tên trái/phải để chuyển` });
const addItem = (column: number) => fireEvent.click(screen.getAllByRole("button", { name: "Thêm mục" })[column - 1]);

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
    expect(remove).toHaveAttribute("title", "Chuyển hoặc xoá các mục trước");
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

describe("AnswerArea classification", () => {
  it("authors a drag-and-drop slide as columns", () => {
    const s = slide();
    render(<AnswerArea onChange={() => {}} onUpdate={() => {}} question={readSlideQuestion(s, ((key: string) => key) as never)!} slide={s} />);
    expect(screen.getByRole("textbox", { name: "Tên nhóm 1" })).toBeInTheDocument();
  });
});
