import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import type { ComponentProps } from "react";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";

const question = { id: "q1", kind: "single_choice", title: "Câu 1", points: 1 };
const questions = [question, { ...question, id: "q2" }];
const resultDisplay = { reviewButtonLabel: "Xem lại", passMessage: "Đạt", failMessage: "Chưa đạt" };
const noop = vi.fn();

function mobile(overrides: Record<string, unknown> = {}) {
  return (
    <MobilePlayerShell
      {...({
        allQuestionsAnswered: false,
        answeredCount: 0,
        answeredQuestionIds: [],
        attemptCompleted: false,
        bookmarkCount: 0,
        bookmarkedQuestionIds: [],
        currentIndex: 0,
        currentAnswerComplete: false,
        currentQuestionSubmitted: false,
        footerMessage: "",
        isBookmarked: false,
        isFirstQuestion: true,
        isLastQuestion: false,
        isTestingMode: true,
        isTrainingMode: false,
        playerCardStyle: {},
        canvasStyle: {},
        headerStyle: {},
        accentButtonStyle: {},
        secondaryButtonStyle: {},
        modeBadgeStyle: {},
        question,
        questions,
        quiz: { title: "Bài", settings: { mode: "testing", timeLimitMinutes: 45 } },
        resultDisplay,
        reviewingSubmittedAttempt: false,
        started: true,
        submitting: false,
        submitFailed: false,
        onJumpToQuestion: noop,
        onNext: noop,
        onPrev: noop,
        onRequestSubmit: noop,
        onReview: noop,
        onStart: noop,
        onSubmitCurrentQuestion: noop,
        onToggleBookmark: noop,
        body: <div />,
        ...overrides,
      } as unknown as ComponentProps<typeof MobilePlayerShell>)}
    />
  );
}

function desktop(overrides: Record<string, unknown> = {}) {
  return (
    <PlayerDesktopLayout
      {...({
        accentButtonStyle: {},
        allQuestionsAnswered: false,
        answeredCount: 0,
        attemptCompleted: false,
        canvasStyle: {},
        countdownProps: { active: false, deadlineAt: null, onExpiredChange: noop, session: null },
        currentAnswerComplete: true,
        currentIndex: 0,
        footerMessage: "",
        isCurrentQuestionBookmarked: false,
        isFirstQuestion: true,
        isLastQuestion: false,
        isTestingMode: true,
        isTrainingMode: false,
        lastResult: null,
        modeBadgeStyle: {},
        playerCardStyle: {},
        questionBody: <div />,
        questionBodyRef: { current: null },
        questions,
        readyAttempt: {},
        readyQuestion: question,
        resultDisplay,
        reviewingSubmittedAttempt: false,
        saveIndicator: <span>Đã lưu 10:42</span>,
        secondaryButtonStyle: {},
        submitFailed: false,
        submitted: false,
        submitting: false,
        handleRequestSubmit: noop,
        handleReviewQuiz: noop,
        handleToggleBookmark: vi.fn(),
        setCurrentIndex: noop,
        submitCurrentTrainingQuestion: vi.fn(),
        ...overrides,
      } as unknown as ComponentProps<typeof PlayerDesktopLayout>)}
    />
  );
}

describe("submit is always available", () => {
  it("desktop testing mode shows Nộp bài before every question is answered", () => {
    render(desktop());
    expect(screen.getByRole("button", { name: "Nộp bài" })).toBeEnabled();
    expect(screen.queryByText("Tài nguyên")).toBeNull();
    expect(screen.getByText("Đã lưu 10:42")).toBeInTheDocument();
  });

  it("mobile testing mode shows Nộp bài before every question is answered", () => {
    render(mobile());
    expect(screen.getByRole("button", { name: "Nộp bài" })).toBeEnabled();
  });

  it("practice mode labels the per-question button Kiểm tra đáp án", () => {
    render(desktop({ isTestingMode: false, isTrainingMode: true }));
    expect(screen.getByRole("button", { name: "Kiểm tra đáp án" })).toBeInTheDocument();
    expect(screen.queryByText("NỘP BÀI")).toBeNull();
  });

  it("mobile bookmark target is at least 44px", () => {
    render(mobile());
    expect(screen.getByRole("button", { name: "Đánh dấu câu hỏi" }).className).toContain("h-11 w-11");
  });

  it("mobile intro shows the time limit", () => {
    render(mobile({ started: false }));
    expect(screen.getByText("45 phút")).toBeInTheDocument();
  });
});
