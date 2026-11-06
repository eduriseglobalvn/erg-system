import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { ReviewLayout } from "@/components/quiz/review/review-layout";
import type { Attempt, QuizResultDisplay } from "@/domain/quiz/types";
import { buildReviewFixture, reviewQuestion } from "@/test/fixtures/quiz-review-fixture";

const questions = [1, 2, 3].map(reviewQuestion);
const attempt = {
  id: "a", quizId: "z", submittedCount: 3, totalQuestions: 3, totalScore: 1, maxScore: 3, percent: 33, passed: false,
  answers: { q1: { input: { choiceId: "q1a" }, result: { correct: true, awardedPoints: 0.5 } }, q2: { input: { choiceId: "q2b" }, result: { correct: false } } },
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

  it("counts a blank record as not answered and partial credit as đúng một phần", () => {
    const answers = {
      q1: { input: {}, result: { correct: false, awardedPoints: 0 } },
      q2: { input: {}, result: { correct: false, partiallyRight: true, awardedPoints: 0.25 } },
    };
    render(<FinalResultScreen attempt={{ ...attempt, answers } as unknown as Attempt} questions={questions} resultDisplay={display} onReview={vi.fn()} onReviewQuestion={vi.fn()} onBackToList={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Câu 1: chưa làm/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Câu 2: đúng một phần/ })).toBeTruthy();
    expect(screen.getByText(/Đúng 0 · Sai 1 · Chưa làm 2/)).toBeTruthy();
  });

  it("gives the same wrong / skipped counts as the review screen (90 questions)", () => {
    const fixture = buildReviewFixture();
    const { unmount } = render(<FinalResultScreen attempt={fixture.attempt} questions={fixture.questions} resultDisplay={display} onReview={vi.fn()} onReviewQuestion={vi.fn()} onBackToList={vi.fn()} />);
    expect(screen.getByText(/Đúng 78 · Sai 9 · Chưa làm 3/)).toBeTruthy();
    unmount();
    render(<ReviewLayout attempt={fixture.attempt} questions={fixture.questions} flagged={new Set()} current={0} elapsedSeconds={null} surface="web" onSelect={vi.fn()} onBack={vi.fn()} startLocalRetry={vi.fn()} />);
    const aside = screen.getByTestId("review-aside");
    expect(within(aside).getByRole("button", { name: "Sai · 9" })).toBeTruthy();
    expect(within(aside).getByRole("button", { name: "Bỏ trống · 3" })).toBeTruthy();
    expect(screen.getByText("78/90 câu đúng")).toBeTruthy();
  });

  it("shows Làm lại in practice mode", () => {
    setup(vi.fn());
    expect(screen.getByRole("button", { name: "Làm lại" })).toBeTruthy();
  });
});
