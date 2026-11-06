import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import type { Attempt, Question, QuizResultDisplay } from "@/domain/quiz/types";

const questions = [1, 2, 3].map((n) => ({ id: `q${n}`, title: `Câu ${n}` })) as unknown as Question[];
const attempt = {
  id: "a", quizId: "z", submittedCount: 3, totalQuestions: 3, totalScore: 1, maxScore: 3, percent: 33, passed: false,
  answers: { q1: { result: { correct: true } }, q2: { result: { correct: false } } },
} as unknown as Attempt;
const display = { passMessage: "Đạt", failMessage: "Chưa đạt", showReviewButton: true, reviewButtonLabel: "Xem lại bài", thankYouMessage: "Cảm ơn" } as QuizResultDisplay;

function setup(onRetry?: () => void) {
  const onReviewQuestion = vi.fn();
  render(<FinalResultScreen attempt={attempt} questions={questions} resultDisplay={display} onReview={vi.fn()} onReviewQuestion={onReviewQuestion} onRetry={onRetry} onBackToList={vi.fn()} />);
  return onReviewQuestion;
}

describe("FinalResultScreen", () => {
  it("shows score and per-question correctness, jumping to review", () => {
    const jump = setup();
    expect(screen.getByTestId("result-score").textContent).toBe("1/3");
    expect(screen.getByRole("button", { name: /Câu 1: đúng/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Câu 2: sai/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Câu 3: chưa làm/ }));
    expect(jump).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Về danh sách" })).toBeTruthy();
  });

  it("shows Làm lại only when onRetry is provided", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Làm lại" })).toBeNull();
  });

  it("labels an essay waiting for the teacher as pending, not wrong", () => {
    const pending = { ...attempt, answers: { ...attempt.answers, q3: { result: { correct: false, pendingReview: true } } } } as unknown as Attempt;
    render(<FinalResultScreen attempt={pending} questions={questions} resultDisplay={display} onReview={vi.fn()} onReviewQuestion={vi.fn()} onBackToList={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Câu 3: chờ giáo viên chấm/ })).toBeTruthy();
    expect(screen.getByText(/Chờ chấm 1/)).toBeTruthy();
  });

  it("Xem lại bài làm opens the review screen", () => {
    const onReview = vi.fn();
    render(<FinalResultScreen attempt={attempt} questions={questions} resultDisplay={display} onReview={onReview} onReviewQuestion={vi.fn()} onBackToList={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Xem lại bài làm" });
    expect(button.className).toContain("MuiButton-contained");
    fireEvent.click(button);
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toMatch(/XP/);
  });

  it("shows Làm lại in practice mode", () => {
    setup(vi.fn());
    expect(screen.getByRole("button", { name: "Làm lại" })).toBeTruthy();
  });
});
