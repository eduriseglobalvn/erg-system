import type { CSSProperties, ReactNode } from "react";
import { Bookmark, ChevronLeft, ChevronRight, List, X } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Question, Quiz, QuizResultDisplay } from "@/lib/types";

type MobilePlayerShellProps = {
  allQuestionsAnswered: boolean;
  answeredCount: number;
  attemptCompleted: boolean;
  bookmarkCount: number;
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  footerMessage: string;
  isBookmarked: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTestingMode: boolean;
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
  onToggleBookmark: () => void;
  body: ReactNode;
  resultBody?: ReactNode;
};

export function MobilePlayerShell({
  allQuestionsAnswered,
  answeredCount,
  attemptCompleted,
  bookmarkCount,
  bookmarkedQuestionIds,
  currentIndex,
  isBookmarked,
  isFirstQuestion,
  isLastQuestion,
  isTestingMode,
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
                {quiz.settings.mode === "training" ? "Practice mode" : "Test mode"}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Bài làm trên mobile hiển thị theo dạng tối giản để dễ thao tác trên Android.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <IntroStat label="Questions" value={String(questions.length)} />
                <IntroStat label="Mode" value={quiz.settings.mode} />
              </div>
              <button
                type="button"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm"
                onClick={onStart}
              >
                Start quiz
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
              {attemptCompleted && !reviewingSubmittedAttempt ? quiz.title : `Question ${currentIndex + 1} of ${questions.length}`}
            </div>
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 text-slate-400">
              <button
                type="button"
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                className="grid h-7 w-7 place-items-center"
                onClick={onToggleBookmark}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current text-[var(--erg-blue)]" : ""}`} />
              </button>
              <QuestionSheet
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
                <p className="text-[18px] leading-8 text-slate-700">{question.title}</p>
                {question.instructions ? (
                  <p className="text-sm leading-6 text-slate-500">{question.instructions}</p>
                ) : null}
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
                  <span>{answeredCount}/{questions.length} answered</span>
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
              <div className={`grid gap-2 ${showSubmitAction ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-3 text-[13px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isFirstQuestion || submitting}
                  onClick={onPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-3 text-[13px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isLastQuestion || submitting}
                  onClick={onNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
                {showSubmitAction ? (
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#b8d6fa] bg-[var(--erg-blue)] px-2 text-[11px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={submitting}
                    onClick={onRequestSubmit}
                  >
                    {submitting ? "Submitting" : submitFailed ? "Retry" : "Submit"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function QuestionSheet({
  bookmarkCount,
  bookmarkedQuestionIds,
  currentIndex,
  questions,
  onJumpToQuestion,
}: {
  bookmarkCount: number;
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  questions: Question[];
  onJumpToQuestion: (index: number) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open question list"
          className="grid h-7 w-7 place-items-center text-[var(--erg-blue)] transition"
        >
          <List className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="h-[100svh] max-h-[100svh] w-screen max-w-none border-b-0 bg-[#f7f8fb] p-0"
        showCloseButton={false}
      >
        <SheetHeader className="relative border-b border-slate-200 bg-white px-4 py-3">
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close question list"
              className="absolute left-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </SheetClose>
          <SheetTitle className="text-center text-base font-semibold text-slate-900">Questions</SheetTitle>
          <div className="text-center text-xs font-semibold text-slate-500">{bookmarkCount} bookmarked</div>
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close question list"
              className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetClose>
        </SheetHeader>
        <div className="grid gap-0 bg-white">
          {questions.map((item, index) => (
            <SheetClose key={item.id} asChild>
              <button
                type="button"
                className={`flex items-start gap-3 border-b px-4 py-4 text-left ${index === currentIndex ? "bg-[var(--erg-blue-light)]" : "bg-white"}`}
                onClick={() => onJumpToQuestion(index)}
              >
                <span className="w-5 flex-none pt-0.5 text-sm font-semibold text-slate-500">
                  {index + 1}.
                </span>
                <span className="min-w-0 flex-1 text-sm leading-6 text-slate-600">{item.title}</span>
                {bookmarkedQuestionIds.includes(item.id) ? (
                  <Bookmark className="mt-1 h-4 w-4 flex-none fill-current text-[var(--quiz-accent-start)]" />
                ) : null}
              </button>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
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
