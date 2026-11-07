import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { ReviewLayout } from "@/components/quiz/review/review-layout";
import { createQuizPackage } from "@/domain/quiz/assessment-engine";
import type { Quiz, QuizResultDisplay } from "@/domain/quiz/types";
import { normalizeSubmitResponse } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-submit-model";
import { buildReviewFixture } from "@/test/fixtures/quiz-review-fixture";

const display = { passMessage: "Đạt", failMessage: "Chưa đạt", showReviewButton: true, thankYouMessage: "" } as QuizResultDisplay;

// The real backend submit returns only score/maxScore/percent/passed.
describe("online submit of a keyed (client-first) package", () => {
  const fixture = buildReviewFixture();
  const quiz = { id: "quiz-1", title: "Q", version: "1", settings: { passPercent: 50 }, sections: [{ id: "s", title: "S", questions: fixture.questions }] } as unknown as Quiz;
  const quizPackage = createQuizPackage(quiz);
  const answers = Object.fromEntries(Object.values(fixture.attempt.answers).map((r) => [r.questionId, r.input]));
  const attempt = normalizeSubmitResponse({ score: 7, maxScore: 10, percent: 70, passed: true }, {
    attemptId: "att", idempotencyKey: "k", portal: "elearning", quiz, quizPackage, payload: { answers } as never,
  });

  it("result screen shows real per-question counts and the server score", () => {
    render(<FinalResultScreen attempt={attempt} questions={fixture.questions} resultDisplay={display} onReview={vi.fn()} onReviewQuestion={vi.fn()} onBackToList={vi.fn()} />);
    expect(screen.getByTestId("result-score").textContent).toBe("7/10");
    expect(screen.getByText(/70% · Đúng 78 · Sai 9 · Chưa làm 3/)).toBeTruthy();
  });

  it("review shows the same counts, header score from the server", () => {
    render(<ReviewLayout attempt={attempt} questions={fixture.questions} flagged={new Set()} current={36} elapsedSeconds={null} surface="web" onSelect={vi.fn()} onBack={vi.fn()} startLocalRetry={vi.fn()} />);
    const aside = screen.getByTestId("review-aside");
    expect(within(aside).getByRole("button", { name: "Sai · 9" })).toBeTruthy();
    expect(within(aside).getByRole("button", { name: "Bỏ trống · 3" })).toBeTruthy();
    expect(screen.getByText("78/90 câu đúng")).toBeTruthy();
    expect(screen.getByText("7/10")).toBeTruthy();
    expect(screen.getByText("Sai · 0 điểm")).toBeTruthy();
  });
});
