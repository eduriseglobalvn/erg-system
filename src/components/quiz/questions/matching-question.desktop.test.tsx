import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MatchingQuestion } from "@/components/quiz/questions/matching-question";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { AnswerPayload, AnswerResult, Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const question: Question = {
  id: "q-shortcuts",
  kind: "matching",
  title: "Ghép phím tắt",
  points: 3,
  feedback: { correct: "", incorrect: "", partial: "" },
  matching: [
    { id: "m1", prompt: "Ctrl + C", response: "Sao chép" },
    { id: "m2", prompt: "Ctrl + V", response: "Dán" },
    { id: "m3", prompt: "Ctrl + Shift + L", response: "Bật / tắt bộ lọc" },
  ],
};

const pieces = () => screen.getAllByRole("button", { name: /^Mảnh / });
const pieceNames = () => pieces().map((piece) => /^Mảnh (.+), hàng \d+/.exec(piece.getAttribute("aria-label") ?? "")?.[1]);
const verdicts = () => screen.queryAllByText(/^(✓ Đúng|✕ Sai|Chưa ghép)$/).map((node) => node.textContent);

function setup(value: AnswerPayload, props: { reviewMode?: boolean; submitted?: boolean; result?: AnswerResult; q?: Question } = {}) {
  const onChange = vi.fn();
  render(<MatchingQuestion question={props.q ?? question} value={value} onChange={onChange} reviewMode={props.reviewMode} submitted={props.submitted} result={props.result} />);
  return onChange;
}

describe("MatchingQuestion desktop puzzle", () => {
  const initial = createInitialAnswer(question);

  test("starts shuffled away from the answer with every piece apart", () => {
    setup(initial);
    expect(pieceNames()).toHaveLength(3);
    expect(pieceNames()).not.toEqual(["Sao chép", "Dán", "Bật / tắt bộ lọc"]);
    for (const piece of pieces()) expect(piece.getAttribute("aria-label")).toMatch(/chưa ghép$/);
  });

  test("Enter pushes the piece into its own row", () => {
    const onChange = setup(initial);
    fireEvent.keyDown(pieces()[0], { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ matchingOrder: initial.matchingOrder, matchingConnectedRows: ["m1"] });
  });

  test("ArrowDown swaps rows 1 and 2 and connects row 2", () => {
    const onChange = setup(initial);
    fireEvent.keyDown(pieces()[0], { key: "ArrowDown" });
    const [a, b, c] = initial.matchingOrder ?? [];
    expect(onChange).toHaveBeenCalledWith({ matchingOrder: [b, a, c], matchingConnectedRows: ["m2"] });
  });

  test("review marks right, wrong and unconnected rows", () => {
    setup({ matchingOrder: ["m1", "m3", "m2"], matchingConnectedRows: ["m1", "m2"] }, { reviewMode: true });
    expect(verdicts()).toEqual(["✓ Đúng", "✕ Sai", "Chưa ghép"]);
  });

  test("review reads a Focus 1 answer that only has assignments", () => {
    setup({ matchingAssignments: { m1: "m1", m2: "m2", m3: "m3" } }, { reviewMode: true });
    expect(verdicts()).toEqual(["✓ Đúng", "✓ Đúng", "✓ Đúng"]);
  });

  test("a secured question without a key takes the verdict from the result", () => {
    const secured: Question = {
      ...question,
      matching: [{ id: "p1", prompt: "Ctrl + C" }, { id: "p2", prompt: "Ctrl + V" }],
      matchingResponses: [{ id: "x", response: "Sao chép" }, { id: "y", response: "Dán" }],
    };
    const value = { matchingOrder: ["x", "y"], matchingConnectedRows: ["p1", "p2"] };
    const result = { correctMatchingOrder: ["x", "x"] } as AnswerResult;
    setup(value, { q: secured, reviewMode: true, result });
    expect(pieceNames()).toEqual(["Sao chép", "Dán"]);
    expect(verdicts()).toEqual(["✓ Đúng", "✕ Sai"]);
  });

  test("a submitted answer is locked", () => {
    const onChange = setup(initial, { submitted: true });
    fireEvent.keyDown(pieces()[0], { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
