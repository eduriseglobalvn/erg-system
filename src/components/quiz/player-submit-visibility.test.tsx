import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import type { ComponentProps } from "react";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { buildTakingCells } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";

const question = { id: "q1", kind: "single_choice", title: "Câu 1", points: 1 };
const choices = ["a", "b", "c", "d"].map((id) => ({ id, label: id, correct: false }));
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
        readyQuestion: { ...question, choices },
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

describe("result screen", () => {
  it("desktop has exactly one contained button (Xem lại bài làm)", () => {
    const readyAttempt = { totalScore: 1, maxScore: 2, percent: 50, passed: false, answers: {} };
    const keyed = questions.map((q) => ({ ...q, choices: [{ id: "a", label: "a", correct: true }] }));
    render(desktop({ attemptCompleted: true, questions: keyed, readyAttempt, resultDisplay: { ...resultDisplay, showReviewButton: true } }));
    const contained = document.querySelectorAll(".MuiButton-contained");
    expect(contained).toHaveLength(1);
    expect(contained[0].textContent).toBe("Xem lại bài làm");
  });

  it("desktop without answer keys offers no review; Về danh sách is the one contained button", () => {
    const readyAttempt = { totalScore: 1, maxScore: 2, percent: 50, passed: false, answers: {} };
    // The ready view turns showReviewButton off for keyless packages.
    render(desktop({ attemptCompleted: true, readyAttempt, resultDisplay: { ...resultDisplay, showReviewButton: false } }));
    expect(screen.queryByRole("button", { name: "Xem lại bài làm" })).toBeNull();
    const contained = document.querySelectorAll(".MuiButton-contained");
    expect(contained).toHaveLength(1);
    expect(contained[0].textContent).toBe("Về danh sách");
  });

  it("mobile has no review button when review is unavailable (no answer keys)", () => {
    render(mobile({ attemptCompleted: true, onReview: undefined }));
    expect(screen.queryByRole("button", { name: "Xem lại bài làm" })).toBeNull();
    // No empty fixed bar either.
    expect(screen.queryByTestId("mobile-player-footer")).toBeNull();
  });

  it("mobile footer review button is not a filled button", () => {
    render(mobile({ attemptCompleted: true }));
    expect(screen.getByTestId("mobile-player-footer")).toBeTruthy();
    const footerReview = screen.getAllByRole("button", { name: "Xem lại bài làm" }).at(-1) as HTMLElement;
    expect(footerReview.className).not.toContain("bg-[var(--erg-blue)]");
  });
});

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

  it("practice mode shows only Kết quả before the answer is checked, and Câu tiếp after", () => {
    const setCurrentIndex = vi.fn();
    const { rerender } = render(desktop({ isTestingMode: false, isTrainingMode: true }));
    expect(screen.getByRole("button", { name: "Kết quả" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Câu tiếp" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Kiểm tra đáp án" })).toBeNull();
    expect(screen.queryByText("NỘP BÀI")).toBeNull();

    rerender(desktop({ isTestingMode: false, isTrainingMode: true, submitted: true, setCurrentIndex }));
    expect(screen.queryByRole("button", { name: "Kết quả" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    expect(setCurrentIndex).toHaveBeenCalledTimes(1);
  });

  it("mobile practice mode swaps the single button from Kết quả to Câu tiếp", () => {
    const onNext = vi.fn();
    const onSubmitCurrentQuestion = vi.fn();
    const props = { isTestingMode: false, isTrainingMode: true, currentAnswerComplete: true, onNext, onSubmitCurrentQuestion };
    const { rerender } = render(mobile(props));
    fireEvent.click(screen.getByRole("button", { name: "Kết quả" }));
    expect(onSubmitCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();

    rerender(mobile({ ...props, currentQuestionSubmitted: true }));
    expect(screen.queryByRole("button", { name: "Kết quả" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    expect(onNext).toHaveBeenCalledTimes(1);
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

  it("only hints the keys that work: N appears with more than 20 questions, 1–n follows the choices", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ ...question, id: `q${i + 1}` }));
    render(desktop({ questions: many, cells: buildTakingCells(25, new Set(), new Set(), 0), readyQuestion: { ...question, choices: choices.slice(0, 3) } }));
    expect(screen.getByText("1–3 chọn · ← → đổi câu · F đánh dấu · N đi tới câu")).toBeInTheDocument();
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
