import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Flag, List, X } from "lucide-react";
import Drawer from "@mui/material/Drawer";

import { QuestionNavigator } from "@/components/quiz/question-navigator";
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
  remainingSeconds: number | null;
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
  allQuestionsAnswered,
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
  remainingSeconds,
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
  const showSubmitAction = (allQuestionsAnswered || submitFailed) && !attemptCompleted;
  const timerVisible = isTestingMode && remainingSeconds !== null;

  if (!started) {
    return (
      <div className="md:hidden">
        <section
          className="min-h-[100svh] bg-[#f4f5f7]"
          style={{ ...playerCardStyle, borderColor: "transparent" }}
        >
          <div className="border-b border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">
            {quiz.title}
          </div>
          <div className="px-4 py-5">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm">
              <div className="inline-flex rounded-md px-3 py-1 text-[11px] font-semibold" style={modeBadgeStyle}>
                {quiz.settings.mode === "training" ? "Chế độ luyện tập" : "Chế độ kiểm tra"}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Bài làm trên mobile hiển thị theo dạng tối giản để dễ thao tác trên Android.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <IntroStat label="Số câu" value={String(questions.length)} />
                <IntroStat label="Chế độ" value={quiz.settings.mode === "training" ? "Luyện tập" : "Kiểm tra"} />
              </div>
              <button
                type="button"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm"
                onClick={onStart}
              >
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <section
        className="min-h-[100svh] bg-[#f4f5f7] pb-24"
        style={{ ...playerCardStyle, borderColor: "transparent" }}
      >
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="relative mx-auto flex min-h-10 max-w-md items-center justify-center px-4 py-2">
            <div className="text-sm font-semibold text-slate-700">
              {attemptCompleted && !reviewingSubmittedAttempt ? quiz.title : `Câu ${currentIndex + 1} / ${questions.length}`}
            </div>
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 text-slate-400">
              <button
                type="button"
                aria-label={isBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                className="grid h-7 w-7 place-items-center"
                onClick={onToggleBookmark}
              >
                <Flag className={`h-4 w-4 ${isBookmarked ? "fill-current text-[#FF5630]" : ""}`} />
              </button>
              <QuestionSheet
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
                  {timerVisible ? <span>{formatTimer(remainingSeconds)}</span> : null}
                </div>
              </div>
              <div className="space-y-3">{body}</div>
            </div>
          )}
        </div>

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
                  {currentQuestionSubmitted ? "Đã nộp" : submitting ? "Đang nộp" : "Nộp bài"}
                </button>
              ) : (
              <div className={`grid gap-2 ${showSubmitAction ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-3 text-[13px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isFirstQuestion || submitting}
                  onClick={onPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-3 text-[13px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isLastQuestion || submitting}
                  onClick={onNext}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
                {showSubmitAction ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-2 text-[11px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
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
      </section>
    </div>
  );
}

function QuestionSheet({
  answeredQuestionIds,
  bookmarkCount,
  bookmarkedQuestionIds,
  currentIndex,
  questions,
  onJumpToQuestion,
}: {
  answeredQuestionIds: string[];
  bookmarkCount: number;
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  questions: Question[];
  onJumpToQuestion: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Mở mục lục câu hỏi"
        className="grid h-7 w-7 place-items-center text-[var(--erg-blue)] transition"
        onClick={() => setOpen(true)}
      >
        <List className="h-4 w-4" />
      </button>
      <Drawer
        anchor="top"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { height: "100svh", maxHeight: "100svh", width: "100vw", maxWidth: "none", backgroundColor: "#f7f8fb" } } }}
      >
        <div className="relative border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            aria-label="Đóng mục lục câu hỏi"
            className="absolute left-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            onClick={() => setOpen(false)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center text-base font-semibold text-slate-900">Mục lục</div>
          <div className="text-center text-xs font-semibold text-slate-500">{bookmarkCount} câu đã đánh dấu</div>
          <button
            type="button"
            aria-label="Đóng mục lục câu hỏi"
            className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <QuestionNavigator
          answeredQuestionIds={answeredQuestionIds}
          className="min-h-[calc(100svh-68px)] rounded-none border-0 shadow-none"
          currentIndex={currentIndex}
          flaggedQuestionIds={bookmarkedQuestionIds}
          onJumpToQuestion={(index) => {
            onJumpToQuestion(index);
            setOpen(false);
          }}
          questions={questions}
          started
        />
      </Drawer>
    </>
  );
}

function IntroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--erg-blue)]">{value}</div>
    </div>
  );
}

function formatTimer(totalSeconds: number | null) {
  const safeSeconds = Math.max(totalSeconds ?? 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
