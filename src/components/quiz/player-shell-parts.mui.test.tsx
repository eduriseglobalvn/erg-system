import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnswerKeyCard, SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import type { Question, QuizResultDisplay } from "@/domain/quiz/types";

const resultDisplay: QuizResultDisplay = {
  passMessage: "Đạt",
  failMessage: "Chưa đạt",
  reviewButtonLabel: "Xem láº¡i",
  thankYouMessage: "Cảm ơn",
  showReviewButton: true,
  submitAllPrompt: "Nộp tất cả?",
  confirmSubmitPrompt: "Xác nhận nộp?",
  submitAllLabel: "Nộp bài",
  returnToQuizLabel: "Quay láº¡i",
  confirmYesLabel: "Đồng ý",
  confirmNoLabel: "Hủy",
};

describe("SubmitConfirmDialog MUI migration", () => {
  it("exposes a labelled modal and preserves confirm behavior", () => {
    const onConfirm = vi.fn();

    render(
      <SubmitConfirmDialog
        mode="confirm"
        resultDisplay={resultDisplay}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Xác nhận nộp bài" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("summarises unanswered and flagged questions and jumps to the first unanswered", () => {
    const onGoToUnanswered = vi.fn();
    render(
      <SubmitConfirmDialog
        mode="confirm"
        resultDisplay={resultDisplay}
        submitting={false}
        unansweredCount={3}
        flaggedCount={2}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onGoToUnanswered={onGoToUnanswered}
      />,
    );

    expect(screen.getByText("Còn 3 câu chưa làm, 2 câu đánh dấu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đến câu chưa làm" }));
    expect(onGoToUnanswered).toHaveBeenCalledOnce();
  });

  it("hides the jump button when everything is answered", () => {
    render(
      <SubmitConfirmDialog mode="all-answered" resultDisplay={resultDisplay} submitting={false} onCancel={vi.fn()} onConfirm={vi.fn()} onGoToUnanswered={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: "Đến câu chưa làm" })).toBeNull();
  });
});

describe("AnswerKeyCard", () => {
  it("renders nothing when an essay has no marking guide to show", () => {
    const question = { id: "q", kind: "essay", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } } as Question;
    const { container } = render(<AnswerKeyCard question={question} />);
    expect(container).toBeEmptyDOMElement();
  });
});
