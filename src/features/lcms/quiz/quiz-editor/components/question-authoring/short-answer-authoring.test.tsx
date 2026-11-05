import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { assessQuestionReadiness } from "./question-readiness";
import { ShortAnswerAuthoring } from "./short-answer-authoring";

const mk = (...blanks: string[][]): Question =>
  ({ id: "q", kind: "short_answer", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, textBlanks: blanks.map((correctAnswers, i) => ({ id: `b${i}`, label: "", placeholder: "......", correctAnswers })) }) as unknown as Question;

let last: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  last = q;
  return <ShortAnswerAuthoring onChange={setQ} question={q} />;
}
const add = (text: string) => {
  const input = screen.getByRole("textbox", { name: "Thêm cách viết đúng" });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
};
const answers = () => last.textBlanks!.map((b) => b.correctAnswers);

describe("ShortAnswerAuthoring", () => {
  it("collects every spelling in one blank", () => {
    render(<Harness start={mk()} />);
    add("CONCAT");
    add("TEXTJOIN");
    expect(answers()).toEqual([["CONCAT", "TEXTJOIN"]]);
    expect(last.textBlanks![0].id).toBe("q-answer");
  });

  it("removes a spelling and reports no answer when none is left", () => {
    render(<Harness start={mk(["CONCAT", "TEXTJOIN"])} />);
    fireEvent.click(screen.getByTitle("Xoá “CONCAT”"));
    expect(answers()).toEqual([["TEXTJOIN"]]);
    fireEvent.click(screen.getByTitle("Xoá “TEXTJOIN”"));
    expect(answers()).toEqual([[]]);
    expect(assessQuestionReadiness(last, { hasQuestionImage: false }).issues.map((i) => i.code)).toContain("no-answer");
  });

  it("shows old multi-blank data without writing, and merges it on the first edit", () => {
    const onChange = vi.fn();
    const q = mk(["a"], ["b", " "]);
    const { unmount } = render(<ShortAnswerAuthoring onChange={onChange} question={q} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    render(<Harness start={q} />);
    add("c");
    expect(answers()).toEqual([["a", "b", "c"]]);
  });
});
