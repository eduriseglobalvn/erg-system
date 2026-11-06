import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import type { ComponentProps } from "react";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { buildTakingCells } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";

const question = { id: "q1", kind: "single_choice", title: "Câu 1", points: 1 };
const questions = Array.from({ length: 20 }, (_, i) => ({ ...question, id: `q${i + 1}` }));
const cells = buildTakingCells(20, new Set([0, 1]), new Set([3]), 0);
const resultDisplay = { reviewButtonLabel: "Xem lại", passMessage: "Đạt", failMessage: "Chưa đạt" };
const noop = vi.fn();

function mobile(overrides: Record<string, unknown> = {}) {
  return (
    <MobilePlayerShell
      {...({
        allQuestionsAnswered: false,
        answeredCount: 0,
        attemptCompleted: false,
        cells,
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
        allQuestionsAnswered: false,
        answeredCount: 0,
        attemptCompleted: false,
        canvasStyle: {},
        cells,
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
        submitFailed: false,
        submitted: false,
        submitting: false,
        onJumpToQuestion: noop,
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

describe("balanced two-column web layout", () => {
  it("puts the question list in the right column, with Nộp bài at its foot and no timer or shortcuts card", () => {
    render(desktop());
    const column = screen.getByRole("navigation", { name: "Danh sách câu hỏi" }).closest("aside") as HTMLElement;
    expect(column).not.toBeNull();
    expect(within(column).getByRole("button", { name: "Nộp bài" })).toBeEnabled();
    expect(column.querySelector('[role="timer"]')).toBeNull();
    expect(within(column).queryByText(/\d\d:\d\d/)).toBeNull();
    expect(within(column).queryByText(/Phím tắt/)).toBeNull();
    expect(column.contains(screen.getByText("Đã lưu 10:42"))).toBe(false);
  });

  it("keeps Câu trước / Câu tiếp and the key hints inside the question card", () => {
    render(desktop());
    const card = screen.getByRole("article");
    expect(within(card).getByRole("button", { name: "Câu tiếp" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "Câu trước" })).toBeDisabled();
    expect(within(card).getByText("1–4 chọn · ← → đổi câu · F đánh dấu")).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Nộp bài" })).toBeNull();
  });

  it("jumps from the list and moves with Câu tiếp", () => {
    const onJumpToQuestion = vi.fn();
    const setCurrentIndex = vi.fn();
    render(desktop({ onJumpToQuestion, setCurrentIndex }));
    fireEvent.click(screen.getByRole("button", { name: /^Câu 7,/ }));
    expect(onJumpToQuestion).toHaveBeenCalledWith(6);
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    expect(setCurrentIndex).toHaveBeenCalledTimes(1);
  });

  it("practice mode offers no Nộp bài in the column", () => {
    render(desktop({ isTestingMode: false, isTrainingMode: true }));
    expect(screen.queryByRole("button", { name: "Nộp bài" })).toBeNull();
  });
});

describe("phone header", () => {
  it("shows Câu n/N in the middle with the quiz title below and the clock on the right", () => {
    render(
      mobile({
        cells: buildTakingCells(90, new Set(), new Set(), 60),
        currentIndex: 60,
        questions: Array.from({ length: 90 }, (_, i) => ({ ...question, id: `q${i}` })),
        timer: <span>12:34</span>,
      }),
    );
    expect(screen.getByRole("button", { name: "Câu 61/90" })).toBeInTheDocument();
    expect(screen.getByText("Bài")).toBeInTheDocument();
    expect(screen.getByText("12:34")).toBeInTheDocument();
  });
});
