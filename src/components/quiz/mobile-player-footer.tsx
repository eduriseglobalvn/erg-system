import { ChevronLeft, ChevronRight } from "lucide-react";

import type { QuizResultDisplay } from "@/lib/types";

type Props = {
  attemptCompleted: boolean;
  currentAnswerComplete: boolean;
  currentQuestionSubmitted: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  submitFailed: boolean;
  submitting: boolean;
  onNext: () => void;
  onPrev: () => void;
  onRequestSubmit: () => void;
  onReview: () => void;
  onSubmitCurrentQuestion: () => void;
};

export function MobilePlayerFooter({
  attemptCompleted,
  currentAnswerComplete,
  currentQuestionSubmitted,
  isFirstQuestion,
  isLastQuestion,
  isTrainingMode,
  resultDisplay,
  reviewingSubmittedAttempt,
  submitFailed,
  submitting,
  onNext,
  onPrev,
  onRequestSubmit,
  onReview,
  onSubmitCurrentQuestion,
}: Props) {
  const showSubmitAction = !attemptCompleted;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5">
      <div className="mx-auto max-w-md">
        {attemptCompleted && !reviewingSubmittedAttempt ? (
          <button
            type="button"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm"
            onClick={onReview}
          >
            {resultDisplay.reviewButtonLabel}
          </button>
        ) : (
          isTrainingMode ? (
            <button
              type="button"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={submitting || currentQuestionSubmitted || !currentAnswerComplete}
              onClick={onSubmitCurrentQuestion}
            >
              {currentQuestionSubmitted ? "Đã kiểm tra" : submitting ? "Đang kiểm tra…" : "Kiểm tra đáp án"}
            </button>
          ) : (
          <div className={`grid gap-2 ${showSubmitAction ? "grid-cols-3" : "grid-cols-2"}`}>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--erg-blue)] bg-white px-3 text-sm font-medium text-[var(--erg-blue)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isFirstQuestion || submitting}
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--erg-blue)] bg-[var(--erg-blue)] px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLastQuestion || submitting}
              onClick={onNext}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
            {showSubmitAction ? (
              <button
                type="button"
                className={isLastQuestion ? "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--erg-blue)] bg-[var(--erg-blue)] px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" : "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--erg-blue)] bg-white px-3 text-sm font-medium text-[var(--erg-blue)] disabled:cursor-not-allowed disabled:opacity-40"}
                disabled={submitting}
                onClick={onRequestSubmit}
              >
                {submitting ? "Đang nộp" : submitFailed ? "Thử lại" : "Nộp bài"}
              </button>
            ) : null}
          </div>
          )
        )}
      </div>
    </div>
  );
}
