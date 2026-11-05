import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { QuizImageRejectedError } from "@/lib/media/quiz-image";
import { ChoiceAuthoring } from "./choice-authoring";

const prepare = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const base = (correct: string[] = [], n = 3): Question =>
  ({
    id: "q", kind: "single_choice", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
    choices: Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, label: `L${i + 1}`, correct: correct.includes(`c${i + 1}`) })),
  }) as Question;

function setup(question: Question, mode: "single" | "multiple" = "single") {
  const onChange = vi.fn();
  const onUpdate = vi.fn((change: (latest: Question) => Question) => onChange(change(question)));
  render(<ChoiceAuthoring question={question} mode={mode} onChange={onChange} onUpdate={onUpdate} />);
  return { onChange, last: () => onChange.mock.calls.at(-1)![0] as Question };
}

/** Keeps the question in state so reordering and deleting really re-render the rows. */
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  return <ChoiceAuthoring mode="single" onChange={setQ} onUpdate={(change) => setQ((latest) => change(latest))} question={q} />;
}

const handle = (n: number) => screen.getByRole("button", { name: new RegExp(`^Kéo để sắp xếp phương án ${n}`) });

beforeEach(() => vi.clearAllMocks());

describe("ChoiceAuthoring", () => {
  it("single mode moves the correct mark", () => {
    const { last } = setup(base(["c1"]));
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu A là đáp án đúng" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu B là đáp án đúng" }));
    expect(last().choices!.map((c) => c.correct)).toEqual([false, true, false]);
  });

  it("single mode clears the mark on a second click", () => {
    const { last } = setup(base(["c2"]));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ đánh dấu B là đáp án đúng" }));
    expect(last().choices!.every((c) => !c.correct)).toBe(true);
  });

  it("multiple mode toggles independently", () => {
    const { last } = setup(base(["c1"]), "multiple");
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu C là đáp án đúng" }));
    expect(last().choices!.map((c) => c.correct)).toEqual([true, false, true]);
  });

  it("types a label and appends an option on Enter in the last one", () => {
    const q = base([], 3);
    q.choices!.slice(0, 2).forEach((c) => (c.label = ""));
    const { last } = setup(q);
    fireEvent.change(screen.getByPlaceholderText("Phương án 2"), { target: { value: "Hai" } });
    expect(last().choices![1].label).toBe("Hai");
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter" });
    expect(last().choices).toHaveLength(4);
    expect(last().choices![3]).toMatchObject({ label: "", correct: false });
  });

  it("does not append a blank option on Enter in an empty last option", () => {
    const q = base([], 3);
    q.choices![2].label = "  ";
    const { onChange } = setup(q);
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves focus to the next option after a delete, or the previous one for the last", () => {
    render(<Harness start={base([], 4)} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá phương án 2" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Nội dung phương án 2"));
    expect(document.activeElement).toHaveValue("L3");
    fireEvent.click(screen.getByRole("button", { name: "Xoá phương án 3" }));
    expect(document.activeElement).toHaveValue("L3");
  });

  it("moves an option with Alt+Arrow on its handle and keeps focus on that handle", () => {
    render(<Harness start={base(["c1"], 3)} />);
    fireEvent.keyDown(handle(1), { key: "ArrowDown", altKey: true });
    expect(screen.getAllByRole("textbox", { name: /^Nội dung phương án/ }).map((el) => (el as HTMLInputElement).value)).toEqual(["L2", "L1", "L3"]);
    expect(document.activeElement).toBe(handle(2));
    fireEvent.keyDown(handle(1), { key: "ArrowUp", altKey: true });
    expect(screen.getAllByRole("textbox", { name: /^Nội dung phương án/ }).map((el) => (el as HTMLInputElement).value)).toEqual(["L2", "L1", "L3"]);
  });

  it("writes every edit through onUpdate", () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(<ChoiceAuthoring mode="multiple" onChange={onChange} onUpdate={onUpdate} question={base([], 3)} />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu A là đáp án đúng" }));
    fireEvent.change(screen.getByPlaceholderText("Phương án 1"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá phương án 1" }));
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledTimes(4);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not append while an IME composition is active", () => {
    const { onChange } = setup(base([], 3));
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter", isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds one option for a held Enter, not one per key repeat", () => {
    const q = base([], 3);
    const { onChange } = setup(q);
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter" });
    fireEvent.keyDown(screen.getByPlaceholderText("Phương án 3"), { key: "Enter", repeat: true });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toasts an unreadable image instead of failing silently", async () => {
    prepare.mockRejectedValueOnce(new Error("decode"));
    setup(base([], 3));
    fireEvent.change(screen.getByLabelText("Ảnh phương án 1"), { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Không đọc được ảnh."));
  });

  it("disables delete at two options", () => {
    setup(base([], 2));
    expect(screen.getByRole("button", { name: "Xoá phương án 1" })).toBeDisabled();
  });

  it("stores a prepared image on the choice and toasts a rejection", async () => {
    prepare.mockResolvedValueOnce({ dataUrl: "data:image/png;base64,AAAA", width: 1, height: 1 });
    const { last } = setup(base([], 3));
    const file = new File(["x"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Ảnh phương án 1"), { target: { files: [file] } });
    await waitFor(() => expect(last().choices![0].image).toEqual({ url: "data:image/png;base64,AAAA", alt: "" }));

    prepare.mockRejectedValueOnce(new QuizImageRejectedError("size"));
    fireEvent.change(screen.getByLabelText("Ảnh phương án 2"), { target: { files: [file] } });
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Ảnh lớn hơn 5 MB."));
  });

  it("edits alt text and removes an existing image", () => {
    const q = base([], 3);
    q.choices![0].image = { url: "https://x/a.png", alt: "" };
    const { last } = setup(q);
    fireEvent.change(screen.getByRole("textbox", { name: "Mô tả ảnh" }), { target: { value: "mèo" } });
    expect(last().choices![0].image).toEqual({ url: "https://x/a.png", alt: "mèo" });
    fireEvent.click(screen.getByRole("button", { name: "Xoá ảnh" }));
    expect(last().choices![0].image).toBeUndefined();
  });
});
