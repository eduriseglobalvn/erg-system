import type { ComponentProps, CSSProperties, ReactNode, RefObject } from "react";
import { Flag } from "lucide-react";

import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { FinalResultScreen, QuestionFeedbackPanel } from "@/components/quiz/player-shell-parts";
import {
  navButtonClass,
  playerViewportClass,
  secondaryButtonClass,
  timerTone,
} from "@/components/quiz/player-shell-runtime/player-shell-styles";
import { formatTimer, questionLabel } from "@/components/quiz/player-shell-utils";
import type { AnswerRecord, Attempt, Question, QuizResultDisplay } from "@/lib/types";

export type PlayerDesktopLayoutProps = {
  accentButtonStyle: CSSProperties;
  allQuestionsAnswered: boolean;
  answeredCount: number;
  attemptCompleted: boolean;
  canvasStyle: CSSProperties;
  countdownProps: Omit<ComponentProps<typeof PlayerCountdown>, "children">;
  currentAnswerComplete: boolean;
  currentIndex: number;
  footerMessage: string;
  isCurrentQuestionBookmarked: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTestingMode: boolean;
  isTrainingMode: boolean;
  lastResult: AnswerRecord["result"] | null;
  modeBadgeStyle: CSSProperties;
  playerCardStyle: CSSProperties;
  questionBody: ReactNode;
  questionBodyRef: RefObject<HTMLDivElement | null>;
  questions: Question[];
  readyAttempt: Attempt;
  readyQuestion: Question;
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  secondaryButtonStyle: CSSProperties;
  submitFailed: boolean;
  submitted: boolean;
  submitting: boolean;
  handleRequestSubmit: () => void;
  handleReviewQuiz: () => void;
  handleToggleBookmark: () => Promise<void>;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

export function PlayerDesktopLayout({
  accentButtonStyle,
  allQuestionsAnswered,
  answeredCount,
  attemptCompleted,
  canvasStyle,
  countdownProps,
  currentAnswerComplete,
  currentIndex,
  footerMessage,
  isCurrentQuestionBookmarked,
  isFirstQuestion,
  isLastQuestion,
  isTestingMode,
  isTrainingMode,
  lastResult,
  modeBadgeStyle,
  playerCardStyle,
  questionBody,
  questionBodyRef,
  questions,
  readyAttempt,
  readyQuestion,
  resultDisplay,
  reviewingSubmittedAttempt,
  secondaryButtonStyle,
  submitFailed,
  submitted,
  submitting,
  handleRequestSubmit,
  handleReviewQuiz,
  handleToggleBookmark,
  setCurrentIndex,
  submitCurrentTrainingQuestion,
}: PlayerDesktopLayoutProps) {
  return (
        <section
          className={`flex min-w-0 flex-col rounded-[18px] border border-[rgba(145,158,171,0.16)] bg-white p-1.5 shadow-[0_18px_45px_rgba(28,37,46,0.08)] sm:p-2 ${playerViewportClass}`}
          style={playerCardStyle}
        >
          <div className="flex min-h-8 items-center justify-between gap-2 px-1 pb-1.5 text-xs text-slate-500 sm:px-2">
            <div className="flex flex-wrap items-center gap-2">
              <span>Tài nguyên</span>
              <span className="text-slate-300">|</span>
              <span>{`Câu ${currentIndex + 1} / ${questions.length}`}</span>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <span className="text-xs font-semibold text-slate-400">
                {allQuestionsAnswered ? "Đã hoàn tất" : `${answeredCount}/${questions.length} đã trả lời`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={isCurrentQuestionBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                  isCurrentQuestionBookmarked ? "border-[rgba(255,86,48,0.2)] bg-[rgba(255,86,48,0.12)] text-[#FF5630]" : "border-slate-200 bg-white text-slate-400"
                }`}
                onClick={() => void handleToggleBookmark()}
              >
                <Flag className={`h-4 w-4 ${isCurrentQuestionBookmarked ? "fill-current" : ""}`} />
              </button>
              <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
                {isTrainingMode ? "Luyện tập" : "Kiểm tra"}
              </span>
              {isTestingMode ? (
                <PlayerCountdown {...countdownProps}>
                  {(seconds) => (
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${timerTone(seconds)}`}>{formatTimer(seconds)}</span>
                  )}
                </PlayerCountdown>
              ) : null}
            </div>
          </div>

          <div
            className="relative min-h-[560px] min-w-0 flex-1 overflow-hidden rounded-[22px] border-[4px] bg-white p-3 shadow-[0_20px_48px_rgba(8,120,148,0.10)] sm:p-4 lg:flex lg:min-h-0 lg:flex-col"
            style={{
              ...canvasStyle,
              backgroundColor: "#ffffff",
              borderColor: "#000088",
            }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -top-2 left-[28%] h-3 w-[34%] skew-x-[-28deg] bg-[#e82828]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-2 left-[30%] h-3 w-[34%] skew-x-[28deg] bg-[#e82828]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[30%] h-72 w-72 rounded-full border-[34px] border-[#f7d8df] opacity-70" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#eef0ff] opacity-70" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 right-16 h-56 w-56 rotate-45 rounded-[34px] bg-gradient-to-b from-[#dfe3ff] to-transparent opacity-80"
            />
            <div className="pointer-events-none absolute bottom-6 right-10 z-0 opacity-35">
              <img
                src="https://media.erg.edu.vn/logo/erg.png"
                alt=""
                className="h-auto w-[88px] object-contain"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10 -mx-3 mt-0 border border-[#3d43a8] bg-[#000088] px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] sm:-mx-4 sm:px-6">
              <div className="hidden">
                <span>{`Câu ${currentIndex + 1} / ${questions.length}`}</span>
                <span className="text-[#c6ced8]">|</span>
                <span>{questionLabel(readyQuestion)}</span>
              </div>
              <h2 className="quiz-player-question-title leading-snug text-white" style={{ fontSize: "var(--quiz-question-title-size)" }}>
                {attemptCompleted && !reviewingSubmittedAttempt ? resultDisplay[readyAttempt.passed ? "passMessage" : "failMessage"] : readyQuestion.title}
              </h2>
            </div>

            <div ref={questionBodyRef} className="quiz-player-question-body relative z-10 min-h-[460px] overflow-auto px-4 pb-36 pt-5 sm:px-7 sm:pr-32 sm:pt-6 lg:min-h-0 lg:flex-1">
              {attemptCompleted && !reviewingSubmittedAttempt ? (
                <FinalResultScreen
                  attempt={readyAttempt}
                  resultDisplay={resultDisplay}
                  onReview={handleReviewQuiz}
                />
              ) : null}

              {attemptCompleted && !reviewingSubmittedAttempt ? null : (
                <>{questionBody}</>
              )}
            </div>

            {lastResult && !(attemptCompleted && !reviewingSubmittedAttempt) ? (
              <div className="pointer-events-none absolute inset-x-4 bottom-5 z-30 flex justify-center px-3 sm:inset-x-8">
                <QuestionFeedbackPanel result={lastResult} floating />
              </div>
            ) : null}
          </div>

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
              <div className="ml-auto flex flex-wrap items-center gap-2 rounded-full border border-[rgba(0,0,136,0.10)] bg-white/70 p-1 shadow-[0_12px_28px_rgba(0,0,136,0.08)] backdrop-blur-xl">
                {resultDisplay.showReviewButton ? (
                  <button className={navButtonClass} style={accentButtonStyle} type="button" onClick={handleReviewQuiz}>
                    {resultDisplay.reviewButtonLabel}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="ml-auto flex flex-wrap items-center gap-2 rounded-full border border-[rgba(0,0,136,0.10)] bg-white/70 p-1 shadow-[0_12px_28px_rgba(0,0,136,0.08)] backdrop-blur-xl">
                {isTrainingMode ? (
                  <button
                    className={`${navButtonClass} min-w-[132px]`}
                    style={accentButtonStyle}
                    type="button"
                    disabled={submitting || submitted || !currentAnswerComplete}
                    onClick={() => void submitCurrentTrainingQuestion()}
                  >
                    {submitted ? "ĐÃ NỘP" : submitting ? "ĐANG NỘP..." : "NỘP BÀI"}
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
                  QUAY LẠI
                </button>
                <button
                  className={navButtonClass}
                  style={accentButtonStyle}
                  type="button"
                  disabled={isLastQuestion || submitting}
                  onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
                >
                  TIẾP THEO
                </button>
                {!attemptCompleted ? (
                  <button
                    className={navButtonClass}
                    style={accentButtonStyle}
                    type="button"
                    disabled={submitting}
                    onClick={handleRequestSubmit}
                  >
                    {submitting ? "ĐANG NỘP..." : submitFailed ? "THỬ NỘP LẠI" : "NỘP BÀI"}
                  </button>
                ) : null}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
  );
}
