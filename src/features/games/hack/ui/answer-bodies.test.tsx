import { ThemeProvider, createTheme } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { DragDropBody, DragWordsBody, SequenceBody } from "@/features/games/hack/ui/drag-inputs";
import { InlineChoiceBody } from "@/features/games/hack/ui/inline-inputs";

const feedback = { correct: "", incorrect: "", partial: "" };
const base = { points: 1, feedback, id: "q" };

function Harness({ initial, children }: { question?: Question; initial: AnswerPayload; children: (value: AnswerPayload, set: (next: AnswerPayload) => void) => ReactNode }) {
  const [value, setValue] = useState(initial);
  return (
    <ThemeProvider theme={createTheme()}>
      {children(value, setValue)}
      <output data-testid="value">{JSON.stringify(value)}</output>
    </ThemeProvider>
  );
}
const read = () => JSON.parse(screen.getByTestId("value").textContent ?? "{}") as AnswerPayload;

describe("hack answer bodies", () => {
  it("inline choice: picking an option jumps to the next empty blank", () => {
    const question = { ...base, kind: "inline_choice", title: "t", inlineBlanks: [{ id: "a", statement: "A", options: ["x", "y"], correctOptionId: "x" }, { id: "b", statement: "B", options: ["p", "q"], correctOptionId: "p" }] } as Question;
    render(<Harness question={question} initial={{ inlineSelections: {} }}>{(value, set) => <InlineChoiceBody question={question} value={value} onChange={set} phone locked={false} />}</Harness>);
    fireEvent.click(screen.getByRole("option", { name: "y" }));
    expect(read().inlineSelections).toEqual({ a: "y" });
    expect(screen.getByRole("listbox").getAttribute("aria-label")).toBe("Chỗ 2");
  });

  it("drag words: tap a word then a slot; tapping the placed word returns it", () => {
    const question = { ...base, kind: "drag_words", title: "t", wordBank: [{ id: "w1", label: "Ctrl + S" }], wordSlots: [{ id: "s1", label: "Lưu", correctWordId: "w1" }] } as Question;
    render(<Harness question={question} initial={{ dragWordPlacements: {} }}>{(value, set) => <DragWordsBody question={question} value={value} onChange={set} phone={false} locked={false} />}</Harness>);
    fireEvent.click(screen.getByRole("button", { name: "Ctrl + S" }));
    fireEvent.click(screen.getByRole("button", { name: "Chỗ trống" }));
    expect(read().dragWordPlacements).toEqual({ s1: "w1" });
    fireEvent.click(screen.getByRole("button", { name: /bấm để trả về kho/ }));
    expect(read().dragWordPlacements).toEqual({});
  });

  it("drag drop: tap an item then a group", () => {
    const question = { ...base, kind: "drag_drop", title: "t", dropTargets: [{ id: "in", label: "VÀO" }], dragDropItems: [{ id: "d1", label: "Chuột", correctTargetId: "in" }] } as Question;
    render(<Harness question={question} initial={{ dragDropPlacements: {} }}>{(value, set) => <DragDropBody question={question} value={value} onChange={set} phone={false} locked={false} />}</Harness>);
    fireEvent.click(screen.getByRole("button", { name: "Chuột" }));
    fireEvent.click(screen.getByRole("group", { name: "VÀO" }));
    expect(read().dragDropPlacements).toEqual({ d1: "in" });
  });

  it("sequence: the ^ and v buttons swap neighbours", () => {
    const question = { ...base, kind: "sequence", title: "t", sequenceItems: [{ id: "a", label: "Một" }, { id: "b", label: "Hai" }] } as Question;
    render(<Harness question={question} initial={{ sequenceOrder: ["a", "b"] }}>{(value, set) => <SequenceBody question={question} value={value} onChange={set} phone locked={false} />}</Harness>);
    fireEvent.click(screen.getByRole("button", { name: "Xuống: Một" }));
    expect(read().sequenceOrder).toEqual(["b", "a"]);
  });
});
