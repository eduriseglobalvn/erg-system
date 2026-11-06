import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnswerKeyCard, QuestionFeedbackPanel, SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import type { Question } from "@/domain/quiz/types";

const base = { submitting: false, remainingSeconds: 192, attemptsLeft: 1, onCancel: vi.fn(), onConfirm: vi.fn(), onJump: vi.fn() };
const partial = { unanswered: [7, 15], flagged: [12], answeredCount: 18 };

describe("SubmitConfirmDialog", () => {
  it("lists unanswered and flagged question numbers with the lead text", () => {
    render(<SubmitConfirmDialog {...base} summary={partial} />);

    expect(screen.getByRole("dialog", { name: "Nộp bài?" })).toBeInTheDocument();
    expect(screen.getByText("Còn 03:12. Sau khi nộp không sửa được nữa, bạn còn 1 lần làm lại.")).toBeInTheDocument();
    expect(screen.getByText("2 câu chưa làm")).toBeInTheDocument();
    expect(screen.getByText("Chưa làm tính 0 điểm")).toBeInTheDocument();
    expect(screen.getByText("1 câu đánh dấu xem lại")).toBeInTheDocument();
    expect(screen.getByText("18 câu đã làm")).toBeInTheDocument();
    for (const n of ["7", "15", "12"]) expect(screen.getByRole("button", { name: `Câu ${n}` })).toBeInTheDocument();
  });

  it("omits the empty groups when everything is answered", () => {
    render(<SubmitConfirmDialog {...base} summary={{ unanswered: [], flagged: [], answeredCount: 20 }} />);

    expect(screen.getByText("20 câu đã làm")).toBeInTheDocument();
    expect(screen.queryByText(/câu chưa làm/)).toBeNull();
    expect(screen.queryByText(/đánh dấu xem lại/)).toBeNull();
  });

  it("jumps to the clicked question and closes", () => {
    const onJump = vi.fn();
    const onCancel = vi.fn();
    render(<SubmitConfirmDialog {...base} onCancel={onCancel} onJump={onJump} summary={partial} />);

    fireEvent.click(screen.getByRole("button", { name: "Câu 7" }));
    expect(onJump).toHaveBeenCalledWith(6);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("keeps working with Làm tiếp and Nộp bài", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<SubmitConfirmDialog {...base} onCancel={onCancel} onConfirm={onConfirm} summary={partial} />);

    fireEvent.click(screen.getByRole("button", { name: "Làm tiếp" }));
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("AnswerKeyCard", () => {
  it("renders nothing when an essay has no marking guide to show", () => {
    const question = { id: "q", kind: "essay", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } } as Question;
    const { container } = render(<AnswerKeyCard question={question} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists an essay's guide criteria as plain labels, without points", () => {
    const question = {
      id: "q", kind: "essay", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
      essayRubric: [{ id: "c1", label: "Nêu đủ ý", points: 0 }, { id: "c2", label: "Có ví dụ", points: 2 }],
    } as Question;
    render(<AnswerKeyCard question={question} />);
    expect(screen.getByText("Nêu đủ ý")).toBeInTheDocument();
    expect(screen.getByText("Có ví dụ")).toBeInTheDocument();
    expect(screen.queryByText(/dđ/)).toBeNull();
  });
});

describe("QuestionFeedbackPanel", () => {
  it("shows no empty body when the teacher left the correct-answer feedback blank", () => {
    render(<QuestionFeedbackPanel result={{ questionId: "q", correct: true, score: 1, maxScore: 1, message: "" } as never} />);
    expect(screen.getByText("Đáp án chính xác!")).toBeInTheDocument();
    expect(screen.queryByTestId("question-feedback-body")).toBeNull();
  });

  it("shows the teacher's feedback when there is some", () => {
    render(<QuestionFeedbackPanel result={{ questionId: "q", correct: true, score: 1, maxScore: 1, message: "Giỏi lắm" } as never} />);
    expect(screen.getByTestId("question-feedback-body")).toHaveTextContent("Giỏi lắm");
  });
});
