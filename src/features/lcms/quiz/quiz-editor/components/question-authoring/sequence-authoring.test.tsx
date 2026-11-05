import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => vi.clearAllMocks());

describe("SequenceAuthoring", () => {
  it("shows fixed numbers and moves a step with Alt+ArrowDown, keeping the correct order in step", () => {
    const { last } = setup(base());
    expect(screen.getAllByText(/^\d\.$/).map((n) => n.textContent)).toEqual(["1.", "2.", "3."]);
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để sắp xếp bước 1" }), { key: "ArrowDown", altKey: true });
    expect(last().sequenceItems!.map((i) => i.id)).toEqual(["s2", "s1", "s3"]);
    expect(last().sequenceCorrectOrder).toEqual(["s2", "s1", "s3"]);
  });

  it("moves up and ignores a move past the edge", () => {
    const { last, onChange } = setup(base());
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để sắp xếp bước 1" }), { key: "ArrowUp", altKey: true });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để sắp xếp bước 3" }), { key: "ArrowUp", altKey: true });
    expect(last().sequenceItems!.map((i) => i.id)).toEqual(["s1", "s3", "s2"]);
  });

  it("disables delete at two steps and deletes otherwise", () => {
    setup(base(2));
    expect(screen.getByRole("button", { name: "Xoá bước 1" })).toBeDisabled();
  });

  it("deletes a step and keeps the order in sync", () => {
    const { last } = setup(base(3));
    fireEvent.click(screen.getByRole("button", { name: "Xoá bước 2" }));
    expect(last().sequenceCorrectOrder).toEqual(["s1", "s3"]);
  });

  it("appends a step on Enter in the last input only", () => {
    const { last, onChange } = setup(base(3));
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 1"), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText("Bước 3"), { key: "Enter" });
    expect(last().sequenceItems).toHaveLength(4);
    expect(last().sequenceCorrectOrder).toEqual(last().sequenceItems!.map((i) => i.id));
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
});
