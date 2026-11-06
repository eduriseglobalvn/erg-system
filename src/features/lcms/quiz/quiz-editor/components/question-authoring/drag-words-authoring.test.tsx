import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { DragWordsAuthoring } from "./drag-words-authoring";

const TEXT = "Hàng được đánh số bằng số.";
const AT = TEXT.lastIndexOf("số");
const START_Q = { id: "q", kind: "drag_words", prompt: "", title: "T", points: 1, sentenceParts: [TEXT], feedback: { correct: "", incorrect: "", partial: "" } } as unknown as Question;

let last: Question = START_Q;
let calls = 0;
function Harness() {
  const [q, setQ] = useState(START_Q);
  return <DragWordsAuthoring onChange={(next) => { calls++; last = next; setQ(next); }} question={q} />;
}

function makeBlank() {
  render(<Harness />);
  const textarea = screen.getByRole("textbox", { name: "Câu có ô trống" }) as HTMLTextAreaElement;
  textarea.setSelectionRange(AT, AT + "số".length);
  fireEvent.click(screen.getByRole("button", { name: "Tạo ô trống" }));
  return textarea;
}

function add(text: string) {
  const input = screen.getByRole("textbox", { name: "Thêm từ gây nhiễu" });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
}

const trayChip = (label: string) => screen.getByText(label, { selector: ".MuiChip-label" }).closest(".MuiChip-root")!;

describe("DragWordsAuthoring", () => {
  it("puts a blank's word in the tray as a correct, fixed chip", () => {
    makeBlank();
    expect(screen.getByText("Khay từ:")).toBeInTheDocument();
    expect(trayChip("số")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Xoá “số”" })).toBeNull();
    expect(last.wordBank).toEqual([{ id: last.wordSlots![0].correctWordId, label: "số" }]);
  });

  it("adds and removes a distractor", () => {
    makeBlank();
    add("màu");
    expect(last.wordBank!.map((w) => w.label)).toEqual(["số", "màu"]);
    expect(last.wordBank![1].id).toMatch(/^word-/);
    fireEvent.click(screen.getByRole("img", { name: "Xoá “màu”" }));
    expect(last.wordBank!.map((w) => w.label)).toEqual(["số"]);
  });

  it("ignores a word already in the tray", () => {
    makeBlank();
    const before = calls;
    add("số");
    expect(calls).toBe(before);
  });

  it("drops the tray word when its blank is removed", () => {
    const textarea = makeBlank();
    add("màu");
    textarea.setSelectionRange(AT + 1, AT + 1);
    fireEvent.keyDown(textarea, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Bỏ ô trống" }));
    expect(last.wordSlots).toEqual([]);
    expect(last.wordBank!.map((w) => w.label)).toEqual(["màu"]);
    expect(screen.queryByText("số", { selector: ".MuiChip-label" })).toBeNull();
  });

  it("does not emit while rendering", () => {
    const onChange = vi.fn();
    render(<DragWordsAuthoring onChange={onChange} question={START_Q} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});
