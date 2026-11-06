import type { ComponentProps, CSSProperties, ReactNode, RefObject } from "react";
import { Flag } from "lucide-react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { QuestionFeedbackPanel } from "@/components/quiz/player-shell-parts";
import { PlayerTimerText } from "@/components/quiz/player-status";
import { playerGridClass } from "@/components/quiz/player-shell-runtime/player-shell-styles";
import { PlayerQuestionAside } from "@/components/quiz/player-shell-runtime/player-question-aside";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { PlayerDesktopFooter } from "@/components/quiz/player-shell-runtime/player-desktop-footer";
import type { AnswerRecord, Attempt, Question, QuizResultDisplay } from "@/domain/quiz/types";

export type PlayerDesktopLayoutProps = {
  allQuestionsAnswered: boolean;
  answeredCount: number;
  attemptCompleted: boolean;
  canvasStyle: CSSProperties;
  cells: QuestionCell[];
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
  saveIndicator: ReactNode;
  submitFailed: boolean;
  submitted: boolean;
  submitting: boolean;
  handleRequestSubmit: () => void;
  handleReviewQuiz: () => void;
  onBackToList: () => void;
  onJumpToQuestion: (index: number) => void;
  onRetry?: () => void;
  handleToggleBookmark: () => Promise<void>;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

export function PlayerDesktopLayout({
  allQuestionsAnswered,
  answeredCount,
  attemptCompleted,
  canvasStyle,
  cells,
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
  saveIndicator,
  submitFailed,
  submitted,
  submitting,
  handleRequestSubmit,
  handleReviewQuiz,
  onBackToList,
  onJumpToQuestion,
  onRetry,
  handleToggleBookmark,
  setCurrentIndex,
  submitCurrentTrainingQuestion,
}: PlayerDesktopLayoutProps) {
  return (
    <div className={playerGridClass}>
        <article
          className="flex min-h-0 min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2"
          style={playerCardStyle}
        >
          <div className="flex min-h-8 items-center justify-between gap-2 px-1 pb-1.5 text-xs text-slate-500 sm:px-2">
            <div className="flex flex-wrap items-center gap-2">
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
              {saveIndicator}
              <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
                {isTrainingMode ? "Luyện tập" : "Kiểm tra"}
              </span>
              {isTestingMode ? (
                <PlayerCountdown {...countdownProps}>{(seconds) => <PlayerTimerText seconds={seconds} />}</PlayerCountdown>
              ) : null}
            </div>
          </div>

          <div
            className="relative min-h-[560px] min-w-0 flex-1 overflow-hidden rounded-lg border bg-white p-3 sm:p-4 lg:flex lg:min-h-0 lg:flex-col"
            style={canvasStyle}
          >
            <div className="relative z-10 border-b border-slate-200 pb-3">
              <h2 className="quiz-player-question-title leading-snug text-slate-900" style={{ fontSize: "var(--quiz-question-title-size)" }}>
                {attemptCompleted && !reviewingSubmittedAttempt ? resultDisplay[readyAttempt.passed ? "passMessage" : "failMessage"] : readyQuestion.title}
              </h2>
            </div>

            <div ref={questionBodyRef} className="quiz-player-question-body relative z-10 min-h-[460px] overflow-auto px-4 pb-36 pt-5 sm:px-7 sm:pr-32 sm:pt-6 lg:min-h-0 lg:flex-1">
              {attemptCompleted && !reviewingSubmittedAttempt ? (
                <FinalResultScreen
                  attempt={readyAttempt}
                  questions={questions}
                  resultDisplay={resultDisplay}
                  onReview={handleReviewQuiz}
                  onReviewQuestion={(index) => { handleReviewQuiz(); setCurrentIndex(() => index); }}
                  onRetry={onRetry}
                  onBackToList={onBackToList}
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

          <PlayerDesktopFooter
            attemptCompleted={attemptCompleted} currentAnswerComplete={currentAnswerComplete}
            footerMessage={footerMessage} isFirstQuestion={isFirstQuestion} isLastQuestion={isLastQuestion}
            isTrainingMode={isTrainingMode} modeBadgeStyle={modeBadgeStyle} questions={questions} resultDisplay={resultDisplay}
            reviewingSubmittedAttempt={reviewingSubmittedAttempt} submitted={submitted} submitting={submitting}
            handleReviewQuiz={handleReviewQuiz} setCurrentIndex={setCurrentIndex}
            submitCurrentTrainingQuestion={submitCurrentTrainingQuestion}
          />
        </article>

        <PlayerQuestionAside cells={cells} onSelect={onJumpToQuestion}>
          {isTrainingMode || attemptCompleted ? null : (
            <ErgButton fullWidth disabled={submitting} variant="contained" onClick={handleRequestSubmit}>
              {submitting ? "Đang nộp…" : submitFailed ? "Thử nộp lại" : "Nộp bài"}
            </ErgButton>
          )}
        </PlayerQuestionAside>
    </div>
  );
}
