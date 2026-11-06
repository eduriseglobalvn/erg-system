import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { blankWord, type BlankSentence } from "./blank-sentence";
import { SentenceBuilder } from "./sentence-builder";

const toastInfo = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { info: toastInfo } }));

const TEXT = "Hàm tính trung bình là AVERAGE.";
const START = TEXT.indexOf("AVERAGE");
const S: BlankSentence = { text: TEXT, blanks: [{ id: "b1", start: START, end: START + 7 }] };

let latest: BlankSentence = S;

function Harness() {
  const [sentence, setSentence] = useState(S);
  return (
    <SentenceBuilder
      blankStyle="chip"
      hint="Gợi ý"
      onChange={(next) => { latest = next; setSentence(next); }}
      renderPopover={(id) => <span>Nội dung {id}</span>}
      sentence={sentence}
    />
  );
}

function setup() {
  const view = render(<Harness />);
  const textarea = screen.getByRole("textbox", { name: "Câu có ô trống" }) as HTMLTextAreaElement;
  return { ...view, textarea };
}

describe("SentenceBuilder", () => {
  beforeEach(() => { latest = S; toastInfo.mockClear(); });

  it("turns the selected words into a blank", () => {
    const { textarea } = setup();
    const at = TEXT.indexOf("trung bình");
    textarea.setSelectionRange(at, at + "trung bình".length);
    fireEvent.click(screen.getByRole("button", { name: "Tạo ô trống" }));
    expect(latest.blanks.map((b) => blankWord(latest, b))).toEqual(["trung bình", "AVERAGE"]);
    expect(textarea.selectionStart).toBe(at + "trung bình".length);
  });

  it("toasts instead of changing anything when nothing is selected", () => {
    const { textarea } = setup();
    textarea.setSelectionRange(3, 3);
    fireEvent.click(screen.getByRole("button", { name: "Tạo ô trống" }));
    expect(latest).toBe(S);
    expect(toastInfo).toHaveBeenCalledWith("Hãy bôi đen một từ chưa là ô trống.");
  });

  it("opens the blank under the caret on Enter and removes it", () => {
    const { textarea } = setup();
    textarea.setSelectionRange(START + 2, START + 2);
    fireEvent.keyDown(textarea, { key: "Enter" });
    const dialog = screen.getByRole("dialog", { name: "Ô trống “AVERAGE”" });
    expect(dialog).toHaveTextContent("Nội dung b1");
    fireEvent.click(screen.getByRole("button", { name: "Bỏ ô trống" }));
    expect(latest.blanks).toHaveLength(0);
    expect(latest.text).toBe(TEXT);
  });

  it("ignores the Enter that commits an IME composition", () => {
    const { textarea } = setup();
    textarea.setSelectionRange(START + 2, START + 2);
    fireEvent.keyDown(textarea, { key: "Enter", keyCode: 229 });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ignores Enter while an IME is composing", () => {
    const { textarea } = setup();
    textarea.setSelectionRange(START + 2, START + 2);
    fireEvent.keyDown(textarea, { key: "Enter", isComposing: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a blank clicked with a collapsed selection", () => {
    const { container, textarea } = setup();
    const span = container.querySelector('[data-blank-id="b1"]') as HTMLElement;
    span.getClientRects = () => [{ left: 0, right: 100, top: 0, bottom: 20 }] as unknown as DOMRectList;
    textarea.setSelectionRange(0, 0);
    fireEvent.click(textarea, { clientX: 10, clientY: 10 });
    expect(screen.getByRole("dialog", { name: "Ô trống “AVERAGE”" })).toBeInTheDocument();
  });

  it("replaces a pasted newline with a space", () => {
    const { textarea } = setup();
    fireEvent.change(textarea, { target: { value: `Hàm tính\r\n  trung bình là AVERAGE.` } });
    expect(textarea).toHaveValue(TEXT);
    expect(blankWord(latest, latest.blanks[0])).toBe("AVERAGE");
  });

  it("normalises a decomposed paste so blanks keep whole letters", () => {
    const { textarea } = setup();
    const pasted = "Tiếng ".normalize("NFD");
    const target = { value: pasted + TEXT, selectionStart: pasted.length, selectionEnd: pasted.length };
    fireEvent.input(textarea, { target, inputType: "insertFromPaste" });
    expect(latest.text).toBe(`Tiếng ${TEXT}`);
    expect(latest.blanks[0]).toMatchObject({ start: START + 6, end: START + 13 });
    expect(textarea.selectionStart).toBe("Tiếng ".length);
    expect(textarea.selectionEnd).toBe("Tiếng ".length);
  });

  it("leaves typed text decomposed, as Unikey's combining mode needs", () => {
    const { textarea } = setup();
    const typed = "ế".normalize("NFD");
    fireEvent.input(textarea, { target: { value: typed + TEXT, selectionStart: typed.length, selectionEnd: typed.length }, inputType: "insertText" });
    expect(latest.text).toBe(typed + TEXT);
  });

  it("keeps a blank whose word is deleted, and refills it as the teacher types", () => {
    const { container, textarea } = setup();
    const emptied = TEXT.replace("AVERAGE", "");
    fireEvent.input(textarea, { target: { value: emptied, selectionStart: START, selectionEnd: START }, inputType: "deleteContentBackward" });
    expect(latest.blanks).toEqual([{ id: "b1", start: START, end: START }]);
    expect(container.querySelector('[data-blank-id="b1"]')).toHaveTextContent("");
    for (const [i, typed] of ["S", "SU", "SUM"].entries()) {
      const value = TEXT.replace("AVERAGE", typed);
      fireEvent.input(textarea, { target: { value, selectionStart: START + i + 1, selectionEnd: START + i + 1 }, inputType: "insertText" });
    }
    expect(blankWord(latest, latest.blanks[0])).toBe("SUM");
    expect(container.querySelector('[data-blank-id="b1"]')).toHaveTextContent("SUM");
  });

  it("never calls onChange just by rendering", () => {
    const onChange = vi.fn();
    render(<SentenceBuilder blankStyle="underline" hint="h" onChange={onChange} sentence={S} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});
