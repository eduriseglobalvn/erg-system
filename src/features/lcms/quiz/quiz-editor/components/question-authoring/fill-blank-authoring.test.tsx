import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { writeBlankSentence } from "./blank-sentence-codec";
import { FillBlankAuthoring } from "./fill-blank-authoring";

const TEXT = "Hàm tính trung bình là AVERAGE.";
const START = TEXT.indexOf("AVERAGE");
const base = { id: "q", kind: "fill_blank", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } } as unknown as Question;
const START_Q = writeBlankSentence(base, { text: TEXT, blanks: [{ id: "b1", start: START, end: START + 7 }] });

let last: Question = START_Q;
function Harness() {
  const [q, setQ] = useState(START_Q);
  return <FillBlankAuthoring onChange={(next) => { last = next; setQ(next); }} question={q} />;
}

function openBlank() {
  const view = render(<Harness />);
  const textarea = screen.getByRole("textbox", { name: "Câu có ô trống" }) as HTMLTextAreaElement;
  textarea.setSelectionRange(START + 2, START + 2);
  fireEvent.keyDown(textarea, { key: "Enter" });
  return view;
}

function add(text: string) {
  const input = screen.getByRole("textbox", { name: "Thêm cách viết khác" });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("FillBlankAuthoring", () => {
  it("adds an alternate spelling and badges the blank", () => {
    const { container } = openBlank();
    expect(screen.getByText("Chấp nhận cả các cách viết:")).toBeInTheDocument();
    add("average");
    expect(last.textBlanks![0].correctAnswers).toEqual(["AVERAGE", "average"]);
    expect(last.sentenceParts).toEqual(START_Q.sentenceParts);
    expect(container.querySelector('[data-blank-id="b1"]')).toHaveAttribute("data-badge", "+1");
  });

  it("removes an alternate and keeps the word", () => {
    const { container } = openBlank();
    add("average");
    fireEvent.click(screen.getByRole("img", { name: "Xoá “average”" }));
    expect(last.textBlanks![0].correctAnswers).toEqual(["AVERAGE"]);
    expect(container.querySelector('[data-blank-id="b1"]')).not.toHaveAttribute("data-badge");
  });

  it("never offers to remove the word in the sentence", () => {
    openBlank();
    expect(screen.getByText("AVERAGE", { selector: ".MuiChip-label" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Xoá “AVERAGE”" })).toBeNull();
  });

  it("does not emit while rendering", () => {
    const onChange = vi.fn();
    render(<FillBlankAuthoring onChange={onChange} question={START_Q} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});
