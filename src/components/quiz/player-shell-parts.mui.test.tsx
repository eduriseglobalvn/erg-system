import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import type { QuizResultDisplay } from "@/lib/types";

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
});
