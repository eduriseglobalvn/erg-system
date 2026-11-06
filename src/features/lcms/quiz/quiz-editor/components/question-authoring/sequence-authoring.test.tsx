import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { SequenceAuthoring } from "./sequence-authoring";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const base = (n = 3): Question => {
  const sequenceItems = Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, label: `L${i + 1}` }));
  return { id: "q", kind: "sequence", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, sequenceItems, sequenceCorrectOrder: sequenceItems.map((i) => i.id) } as Question;
};

function setup(question: Question) {
  const onChange = vi.fn();
  const onUpdate = vi.fn((change: (latest: Question) => Question) => onChange(change(question)));
  render(<SequenceAuthoring onChange={onChange} onUpdate={onUpdate} question={question} />);
  return { onChange, last: () => onChange.mock.calls.at(-1)![0] as Question };
}

/** Keeps the question in state so reordering really re-renders the rows. */
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  return <SequenceAuthoring onChange={setQ} onUpdate={(change) => setQ((latest) => change(latest))} question={q} />;
}

const handle = (n: number) => screen.getByRole("button", { name: new RegExp(`^Kéo để đổi thứ tự bước ${n},`) });

beforeEach(() => vi.clearAllMocks());

describe("SequenceAuthoring", () => {
  it("shows fixed numbers and moves a step with Alt+ArrowDown, keeping the correct order in step", () => {
    const { last } = setup(base());
    expect(screen.getAllByText(/^\d\.$/).map((n) => n.textContent)).toEqual(["1.", "2.", "3."]);
    fireEvent.keyDown(handle(1), { key: "ArrowDown", altKey: true });
    expect(last().sequenceItems!.map((i) => i.id)).toEqual(["s2", "s1", "s3"]);
    expect(last().sequenceCorrectOrder).toEqual(["s2", "s1", "s3"]);
  });

  it("moves up and leaves the order alone at the edge", () => {
    const { last } = setup(base());
    fireEvent.keyDown(handle(1), { key: "ArrowUp", altKey: true });
    expect(last().sequenceItems!.map((i) => i.id)).toEqual(["s1", "s2", "s3"]);
    fireEvent.keyDown(handle(3), { key: "ArrowUp", altKey: true });
    expect(last().sequenceItems!.map((i) => i.id)).toEqual(["s1", "s3", "s2"]);
  });

  it("keeps focus on the moved step's handle", () => {
    render(<Harness start={base()} />);
    fireEvent.keyDown(handle(1), { key: "ArrowDown", altKey: true });
    const moved = handle(2);
    expect(moved).toHaveAttribute("data-handle-id", "s1");
    expect(document.activeElement).toBe(moved);
  });

  it("disables delete at two steps", () => {
    setup(base(2));
    expect(screen.getByRole("button", { name: "Xoá bước 1" })).toBeDisabled();
  });

  it("deletes a step and keeps the order in sync", () => {
    const { last } = setup(base(3));
    fireEvent.click(screen.getByRole("button", { name: "Xoá bước 2" }));
    expect(last().sequenceCorrectOrder).toEqual(["s1", "s3"]);
  });

  it("moves focus to the next step after a delete, or the previous one for the last", () => {
    render(<Harness start={base(4)} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá bước 2" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Nội dung bước 2"));
    expect(document.activeElement).toHaveValue("L3");
    fireEvent.click(screen.getByRole("button", { name: "Xoá bước 3" }));
    expect(document.activeElement).toHaveValue("L3");
  });

  it("appends a step on Enter in the last input only", () => {
    const { last, onChange } = setup(base(3));
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 1"), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 3"), { key: "Enter" });
    expect(last().sequenceItems).toHaveLength(4);
    expect(last().sequenceCorrectOrder).toEqual(last().sequenceItems!.map((i) => i.id));
  });

  it("does not append on an Enter that ends an IME composition", () => {
    const { onChange } = setup(base(3));
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 3"), { key: "Enter", isComposing: true });
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 3"), { key: "Enter", keyCode: 229 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not append a blank step on Enter in an empty last step", () => {
    const q = base(3);
    q.sequenceItems![2].label = "  ";
    const { onChange } = setup(q);
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 3"), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("edits a label", () => {
    const { last } = setup(base());
    fireEvent.change(screen.getByPlaceholderText("Bước 2"), { target: { value: "Hai" } });
    expect(last().sequenceItems![1].label).toBe("Hai");
  });

  it("stores a prepared image on the step", async () => {
    prepare.mockResolvedValueOnce({ dataUrl: "data:image/png;base64,AAAA", width: 1, height: 1 });
    const { last } = setup(base());
    fireEvent.change(screen.getByLabelText("Ảnh bước 1"), { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    await waitFor(() => expect(last().sequenceItems![0].image).toEqual({ url: "data:image/png;base64,AAAA", alt: "" }));
  });

  it("edits alt text and removes a step image", () => {
    const q = base();
    q.sequenceItems![0].image = { url: "https://x/a.png", alt: "" };
    const { last } = setup(q);
    fireEvent.change(screen.getByRole("textbox", { name: "Mô tả ảnh bước 1" }), { target: { value: "mèo" } });
    expect(last().sequenceItems![0].image).toEqual({ url: "https://x/a.png", alt: "mèo" });
    expect(screen.getByRole("button", { name: "Đổi ảnh bước 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xoá ảnh bước 1" }));
    expect(last().sequenceItems![0].image).toBeUndefined();
  });
});
