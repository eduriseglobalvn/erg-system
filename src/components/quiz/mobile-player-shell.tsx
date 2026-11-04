import { Flag } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { MobilePlayerFooter } from "@/components/quiz/mobile-player-footer";
import { MobilePlayerIntro } from "@/components/quiz/mobile-player-intro";
import { MobileQuestionSheet } from "@/components/quiz/mobile-player-question-sheet";
import type { Question, Quiz, QuizResultDisplay } from "@/lib/types";

type MobilePlayerShellProps = {
  allQuestionsAnswered: boolean;
  answeredCount: number;
  answeredQuestionIds: string[];
  attemptCompleted: boolean;
  bookmarkCount: number;
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  footerMessage: string;
  isBookmarked: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTestingMode: boolean;
  isTrainingMode: boolean;
  currentAnswerComplete: boolean;
  currentQuestionSubmitted: boolean;
  playerCardStyle: CSSProperties;
  canvasStyle: CSSProperties;
  headerStyle: CSSProperties;
  accentButtonStyle: CSSProperties;
  secondaryButtonStyle: CSSProperties;
  modeBadgeStyle: CSSProperties;
  question: Question;
  questions: Question[];
  quiz: Quiz;
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  started: boolean;
  submitting: boolean;
  submitFailed: boolean;
  timer?: ReactNode;
  saveIndicator?: ReactNode;
  onJumpToQuestion: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onRequestSubmit: () => void;
  onReview: () => void;
  onStart: () => void;
  onSubmitCurrentQuestion: () => void;
  onToggleBookmark: () => void;
  body: ReactNode;
  resultBody?: ReactNode;
};

export function MobilePlayerShell({
  answeredCount,
  answeredQuestionIds,
  attemptCompleted,
  bookmarkCount,
  bookmarkedQuestionIds,

  currentIndex,
  isBookmarked,
  isFirstQuestion,
  isLastQuestion,
  isTestingMode,
  isTrainingMode,
  currentAnswerComplete,
  currentQuestionSubmitted,
  playerCardStyle,
  modeBadgeStyle,
  question,
  questions,
  quiz,
  resultDisplay,
  reviewingSubmittedAttempt,
  started,
  submitting,
  submitFailed,
  timer,
  saveIndicator,
  onJumpToQuestion,
  onNext,
  onPrev,
  onRequestSubmit,
  onReview,
  onStart,
  onSubmitCurrentQuestion,
  onToggleBookmark,
  body,
  resultBody,
}: MobilePlayerShellProps) {
  if (!started) {
    return (
      <MobilePlayerIntro modeBadgeStyle={modeBadgeStyle} playerCardStyle={playerCardStyle} questions={questions} quiz={quiz} onStart={onStart} />
    );
  }


  return (
    <div className="md:hidden">
      <section
        className="min-h-[100svh] bg-[#f4f5f7] pb-24"
        style={{ ...playerCardStyle, borderColor: "transparent" }}
      >
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="mx-auto grid min-h-12 max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-1">
            <div className="flex min-w-0 items-center">{isTestingMode && !attemptCompleted ? timer : null}</div>
            <div className="text-center text-sm font-semibold text-slate-700">
              {attemptCompleted && !reviewingSubmittedAttempt ? quiz.title : `Câu ${currentIndex + 1} / ${questions.length}`}
              {saveIndicator ? <div>{saveIndicator}</div> : null}
            </div>
            <div className="flex items-center justify-end gap-1 text-slate-400">
              <button
                type="button"
                aria-label={isBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                className="grid h-11 w-11 place-items-center"
                onClick={onToggleBookmark}
              >
                <Flag className={`h-4 w-4 ${isBookmarked ? "fill-current text-[#FF5630]" : ""}`} />
              </button>
              <MobileQuestionSheet
                answeredQuestionIds={answeredQuestionIds}
                bookmarkCount={bookmarkCount}
                bookmarkedQuestionIds={bookmarkedQuestionIds}
                currentIndex={currentIndex}
                questions={questions}
                onJumpToQuestion={onJumpToQuestion}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-md px-4 pt-5">
          {attemptCompleted && !reviewingSubmittedAttempt ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm">{resultBody}</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="quiz-player-question-title text-[22px] leading-8 text-slate-800">{question.title}</p>
                {question.instructions ? (
                  <p className="text-sm leading-6 text-slate-500">{question.instructions}</p>
                ) : null}
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
                  <span>{answeredCount}/{questions.length} đã trả lời</span>
                </div>
              </div>
              <div className="space-y-3">{body}</div>
            </div>
          )}
        </div>

        <MobilePlayerFooter
          attemptCompleted={attemptCompleted} currentAnswerComplete={currentAnswerComplete}
          currentQuestionSubmitted={currentQuestionSubmitted} isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion} isTrainingMode={isTrainingMode} resultDisplay={resultDisplay}
          reviewingSubmittedAttempt={reviewingSubmittedAttempt} submitFailed={submitFailed} submitting={submitting}
          onNext={onNext} onPrev={onPrev} onRequestSubmit={onRequestSubmit} onReview={onReview}
          onSubmitCurrentQuestion={onSubmitCurrentQuestion}
        />
      </section>
    </div>
  );
}