import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { SequenceQuestion } from "@/components/quiz/questions/sequence-question";
import { moveTo } from "@/components/quiz/questions/sequence-question/sequence-order";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { AnswerPayload, AnswerResult, Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const question: Question = {
  id: "q-seq",
  kind: "sequence",
  title: "Sắp xếp các bước vẽ biểu đồ",
  points: 1,
  feedback: { correct: "Đúng", incorrect: "Sai", partial: "Một phần" },
  sequenceItems: [
    { id: "s1", label: "Chọn dữ liệu" },
    { id: "s2", label: "Chèn biểu đồ" },
    { id: "s3", label: "Đặt tiêu đề" },
  ],
  sequenceCorrectOrder: ["s1", "s2", "s3"],
};
const labels: Record<string, string> = { s1: "Chọn dữ liệu", s2: "Chèn biểu đồ", s3: "Đặt tiêu đề" };
const result: AnswerResult = { questionId: "q-seq", correct: false, partiallyRight: false, awardedPoints: 0, maxPoints: 1, message: "" };

const cardLabels = () => screen.getAllByRole("button", { name: /, vị trí \d$/ }).map((card) => card.getAttribute("aria-label")?.replace(/, vị trí \d$/, ""));

describe("moveTo", () => {
  test("removes at from and inserts at to", () => {
    expect(moveTo(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveTo(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  });
});

describe("SequenceQuestion", () => {
  test("an unanswered question starts in the shuffled initial order, never solved", () => {
    render(<SequenceQuestion question={question} value={{}} onChange={vi.fn()} />);
    const initial = createInitialAnswer(question).sequenceOrder ?? [];
    expect(cardLabels()).toEqual(initial.map((id) => labels[id]));
    expect(cardLabels()).not.toEqual(["Chọn dữ liệu", "Chèn biểu đồ", "Đặt tiêu đề"]);
  });

  test("ArrowUp moves a card one row up and keeps focus on it", () => {
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState<AnswerPayload>({});
      return <SequenceQuestion question={question} value={value} onChange={(next) => { onChange(next); setValue(next); }} />;
    }
    render(<Harness />);
    const card = screen.getByRole("button", { name: /, vị trí 3$/ });
    const id = (createInitialAnswer(question).sequenceOrder ?? [])[2];

    fireEvent.keyDown(card, { key: "ArrowUp" });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].sequenceOrder[1]).toBe(id);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: `${labels[id]}, vị trí 2` }));
  });

  test("row numbers are hidden from screen readers, the card already names its position", () => {
    render(<SequenceQuestion question={question} value={{ sequenceOrder: ["s2", "s1", "s3"] }} onChange={vi.fn()} />);
    for (const n of ["1", "2", "3"]) expect(screen.getByText(n)).toHaveAttribute("aria-hidden", "true");
  });

  test("an ignored arrow move never steals focus on a later reorder", () => {
    const onChange = vi.fn();
    const props = { question, onChange };
    const { rerender } = render(<SequenceQuestion {...props} value={{ sequenceOrder: ["s2", "s1", "s3"] }} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Chèn biểu đồ, vị trí 1" }), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledTimes(1);
    // The parent ignores the move and renders the same order again.
    rerender(<SequenceQuestion {...props} value={{ sequenceOrder: ["s2", "s1", "s3"] }} />);
    // Later the order changes some other way, such as a pointer drag.
    rerender(<SequenceQuestion {...props} value={{ sequenceOrder: ["s1", "s3", "s2"] }} />);
    expect(document.activeElement).toBe(document.body);
  });

  test("arrows do nothing at the edges", () => {
    const onChange = vi.fn();
    render(<SequenceQuestion question={question} value={{ sequenceOrder: ["s2", "s1", "s3"] }} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /, vị trí 1$/ }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("button", { name: /, vị trí 3$/ }), { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });

  test("submitted makes the keys inert", () => {
    const onChange = vi.fn();
    render(<SequenceQuestion question={question} value={{ sequenceOrder: ["s2", "s1", "s3"] }} submitted onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /, vị trí 2$/ }), { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  test("review marks wrong rows with their correct position", () => {
    render(<SequenceQuestion question={question} value={{ sequenceOrder: ["s2", "s1", "s3"] }} submitted reviewMode result={result} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Chèn biểu đồ, vị trí 1" })).toHaveTextContent("đúng: 2");
    expect(screen.getByRole("button", { name: "Chọn dữ liệu, vị trí 2" })).toHaveTextContent("đúng: 1");
    expect(screen.getByRole("button", { name: "Đặt tiêu đề, vị trí 3" })).not.toHaveTextContent("đúng:");
  });

  test("review falls back to the result's order when the question carries none", () => {
    const keyless = { ...question, sequenceCorrectOrder: [] };
    const { rerender } = render(<SequenceQuestion question={keyless} value={{ sequenceOrder: ["s1", "s2", "s3"] }} submitted reviewMode result={result} onChange={vi.fn()} />);
    expect(screen.queryByText(/đúng:/)).not.toBeInTheDocument();

    rerender(
      <SequenceQuestion
        question={keyless}
        value={{ sequenceOrder: ["s1", "s2", "s3"] }}
        submitted
        reviewMode
        result={{ ...result, correctSequenceOrder: ["s2", "s1", "s3"] }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Chọn dữ liệu, vị trí 1" })).toHaveTextContent("đúng: 2");
    expect(screen.getByRole("button", { name: "Chèn biểu đồ, vị trí 2" })).toHaveTextContent("đúng: 1");
    expect(screen.getByRole("button", { name: "Đặt tiêu đề, vị trí 3" })).not.toHaveTextContent("đúng:");
  });
});
