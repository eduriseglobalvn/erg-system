import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { NumericAuthoring } from "./numeric-authoring";
import { assessQuestionReadiness } from "./question-readiness";

const mk = (correctValue: number | null): Question =>
  ({ id: "q", kind: "numeric", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, numericAnswer: { correctValue } }) as unknown as Question;

let last: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  last = q;
  return <NumericAuthoring onChange={setQ} question={q} />;
}
const type = (name: string, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
const codes = () => assessQuestionReadiness(last, { hasQuestionImage: false }).issues.map((i) => i.code);

describe("NumericAuthoring", () => {
  it("stores a typed comma decimal", () => {
    render(<Harness start={mk(1)} />);
    type("Đáp số", "2,6");
    expect(last.numericAnswer!.correctValue).toBe(2.6);
  });

  it("clearing the value is NaN and not ready", () => {
    render(<Harness start={mk(1)} />);
    type("Đáp số", "");
    expect(last.numericAnswer!.correctValue).toBeNaN();
    expect(codes()).toContain("numeric-value");
  });

  it("draws the accepted range from the tolerance", () => {
    render(<Harness start={mk(2.6)} />);
    type("Sai số", "0,05");
    expect(screen.getByRole("img", { name: "Được tính đúng từ 2,55 đến 2,65" })).toBeInTheDocument();
  });

  it("flags a tolerance that is not a number", () => {
    render(<Harness start={mk(2.6)} />);
    type("Sai số", "abc");
    expect(codes()).toContain("numeric-tolerance");
  });

  it("follows an outside change to the answer", () => {
    const { rerender } = render(<NumericAuthoring onChange={vi.fn()} question={mk(1)} />);
    rerender(<NumericAuthoring onChange={vi.fn()} question={{ ...mk(5), numericAnswer: { correctValue: 5, tolerance: 0.5 } }} />);
    expect(screen.getByRole("textbox", { name: "Đáp số" })).toHaveValue("5");
    expect(screen.getByRole("textbox", { name: "Sai số" })).toHaveValue("0,5");
  });

  it("shows an empty value for null and does not emit while rendering", () => {
    const onChange = vi.fn();
    render(<NumericAuthoring onChange={onChange} question={mk(null)} />);
    expect(screen.getByRole("textbox", { name: "Đáp số" })).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("an empty tolerance is undefined and the line is a single point", () => {
    render(<Harness start={mk(2.6)} />);
    type("Sai số", "0,1");
    type("Sai số", "");
    expect(last.numericAnswer!.tolerance).toBeUndefined();
    expect(screen.getByRole("img", { name: "Chỉ tính đúng 2,6" })).toBeInTheDocument();
  });
});
