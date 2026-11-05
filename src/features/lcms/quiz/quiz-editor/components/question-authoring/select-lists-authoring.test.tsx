import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { writeBlankSentence } from "./blank-sentence-codec";
import { SelectListsAuthoring } from "./select-lists-authoring";

const TEXT = "Hàm tính trung bình là AVERAGE.";
const START = TEXT.indexOf("AVERAGE");
const base = { id: "q", kind: "select_from_lists", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } } as unknown as Question;
const START_Q = writeBlankSentence(base, { text: TEXT, blanks: [{ id: "b1", start: START, end: START + 7 }] });

let last: Question = START_Q;
function Harness() {
  const [q, setQ] = useState(START_Q);
  return <SelectListsAuthoring onChange={(next) => { last = next; setQ(next); }} question={q} />;
}

function openBlank() {
  render(<Harness />);
  const textarea = screen.getByRole("textbox", { name: "Câu có ô trống" }) as HTMLTextAreaElement;
  textarea.setSelectionRange(START + 2, START + 2);
  fireEvent.keyDown(textarea, { key: "Enter" });
  return textarea;
}

function add(text: string) {
  const input = screen.getByRole("textbox", { name: "Thêm lựa chọn" });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
}

// A removable chip name also carries its remove icon title (ChipInput), so match the start.
const chip = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}( |$)`) });

describe("SelectListsAuthoring", () => {
  it("appends added options", () => {
    openBlank();
    expect(screen.getByText("Các lựa chọn trong ô (bấm để chọn đáp án đúng):")).toBeInTheDocument();
    add("MIN");
    add("SUM");
    expect(last.inlineBlanks![0].options).toEqual(["AVERAGE", "MIN", "SUM"]);
    expect(last.inlineBlanks![0].correctOptionId).toBe("AVERAGE");
  });

  it("picks another option as correct and shows it in the sentence", () => {
    const textarea = openBlank();
    add("MIN");
    add("SUM");
    fireEvent.click(chip("MIN"));
    expect(last.inlineBlanks![0].correctOptionId).toBe("MIN");
    expect(textarea.value).toContain("MIN");
    expect([...last.inlineBlanks![0].options].sort()).toEqual(["AVERAGE", "MIN", "SUM"]);
    expect(chip("MIN")).toHaveAttribute("aria-pressed", "true");
    expect(chip("AVERAGE")).toHaveAttribute("aria-pressed", "false");
  });

  it("lets only wrong options be removed", () => {
    openBlank();
    add("MIN");
    expect(screen.queryByRole("img", { name: "Xoá “AVERAGE”" })).toBeNull();
    fireEvent.click(screen.getByRole("img", { name: "Xoá “MIN”" }));
    expect(last.inlineBlanks![0].options).toEqual(["AVERAGE"]);
  });
});
