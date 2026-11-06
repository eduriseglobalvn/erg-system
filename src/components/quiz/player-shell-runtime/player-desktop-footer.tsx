import type { CSSProperties } from "react";

import { navButtonClass, secondaryButtonClass } from "@/components/quiz/player-shell-runtime/player-shell-styles";
import type { Question, QuizResultDisplay } from "@/domain/quiz/types";

export type PlayerDesktopFooterProps = {
  accentButtonStyle: CSSProperties;
  attemptCompleted: boolean;
  currentAnswerComplete: boolean;
  footerMessage: string;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  modeBadgeStyle: CSSProperties;
  questions: Question[];
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  secondaryButtonStyle: CSSProperties;
  submitFailed: boolean;
  submitted: boolean;
  submitting: boolean;
  handleRequestSubmit: () => void;
  handleReviewQuiz: () => void;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

export function PlayerDesktopFooter({
  accentButtonStyle, attemptCompleted, currentAnswerComplete, footerMessage, isFirstQuestion, isLastQuestion,
  isTrainingMode, modeBadgeStyle, questions, resultDisplay, reviewingSubmittedAttempt, secondaryButtonStyle,
  submitFailed, submitted, submitting, handleRequestSubmit, handleReviewQuiz, setCurrentIndex,
  submitCurrentTrainingQuestion,
}: PlayerDesktopFooterProps) {
  return (
    <div className="flex min-h-10 flex-col gap-2 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
          {isTrainingMode ? "Học theo từng câu" : "Chế độ kiểm tra"}
        </span>
        <span className="line-clamp-1 text-xs font-medium text-slate-600">
          {footerMessage}
        </span>
      </div>

      {attemptCompleted && !reviewingSubmittedAttempt ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {resultDisplay.showReviewButton ? (
            <button className={navButtonClass} style={accentButtonStyle} type="button" onClick={handleReviewQuiz}>
              {resultDisplay.reviewButtonLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isTrainingMode ? (
            <button
              className={`${navButtonClass} min-w-[132px]`}
              style={accentButtonStyle}
              type="button"
              disabled={submitting || submitted || !currentAnswerComplete}
              onClick={() => void submitCurrentTrainingQuestion()}
            >
              {submitted ? "Đã kiểm tra" : submitting ? "Đang kiểm tra…" : "Kiểm tra đáp án"}
            </button>
          ) : (
            <>
          <button
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
            type="button"
            disabled={isFirstQuestion || submitting}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          >
            Quay lại
          </button>
          <button
            className={navButtonClass}
            style={accentButtonStyle}
            type="button"
            disabled={isLastQuestion || submitting}
            onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
          >
            Tiếp theo
          </button>
          {!attemptCompleted ? (
            <button
              className={navButtonClass}
              style={accentButtonStyle}
              type="button"
              disabled={submitting}
              onClick={handleRequestSubmit}
            >
              {submitting ? "Đang nộp…" : submitFailed ? "Thử nộp lại" : "Nộp bài"}
            </button>
          ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
