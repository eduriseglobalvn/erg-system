import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { writeBlankSentence } from "./blank-sentence-codec";
import { SelectListsAuthoring } from "./select-lists-authoring";

const TEXT = "Hàm tính trung bình là AVERAGE.";
const START = TEXT.indexOf("AVERAGE");
const base = { id: "q", kind: "select_from_lists", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } } as unknown as Question;
const START_Q = writeBlankSentence(base, { text: TEXT, blanks: [{ id: "b1", start: START, end: START + 7 }] });

let last: Question = START_Q;
let calls = 0;
function Harness() {
  const [q, setQ] = useState(START_Q);
  return <SelectListsAuthoring onChange={(next) => { calls++; last = next; setQ(next); }} question={q} />;
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

const chip = (label: string) => screen.getByRole("button", { name: label });
// The correct chip has no action, so it is not a button.
const plainChip = (label: string) => screen.getAllByText(label).find((el) => el.closest(".MuiChip-root"))!.closest(".MuiChip-root")!;

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
    expect(screen.queryByRole("button", { name: "MIN" })).toBeNull();
    expect(plainChip("MIN")).toBeInTheDocument();
    expect(chip("AVERAGE")).toHaveAttribute("aria-pressed", "false");
  });

  it("does nothing when the correct chip is clicked", () => {
    openBlank();
    add("MIN");
    const before = calls;
    fireEvent.click(plainChip("AVERAGE"));
    expect(calls).toBe(before);
  });

  it("renders old select data without writing it", () => {
    const old = {
      ...base,
      inlineBlanks: [{ id: "i1", statement: "Bản sao bị đăng lên mạng.", selectPosition: "before", options: ["yes", "no"], correctOptionId: "yes" }],
    } as Question;
    const onChange = vi.fn();
    render(<SelectListsAuthoring onChange={onChange} question={old} />);
    expect((screen.getByRole("textbox", { name: "Câu có ô trống" }) as HTMLTextAreaElement).value).toBe("yes Bản sao bị đăng lên mạng.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("lets only wrong options be removed", () => {
    openBlank();
    add("MIN");
    expect(screen.queryByRole("img", { name: "Xoá “AVERAGE”" })).toBeNull();
    fireEvent.click(screen.getByRole("img", { name: "Xoá “MIN”" }));
    expect(last.inlineBlanks![0].options).toEqual(["AVERAGE"]);
  });
});
