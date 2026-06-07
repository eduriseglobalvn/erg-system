import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Search } from "lucide-react";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import {
  AnswerKeyCard,
  FinalResultScreen,
  QuestionFeedbackPanel,
  SubmitConfirmDialog,
} from "@/components/quiz/player-shell-parts";
import {
  areAnswerPayloadsEqual,
  buildNormalizedAnswers,
  createFreshLocalSession,
  formatTimer,
  questionLabel,
} from "@/components/quiz/player-shell-utils";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildClientSubmitPayload,
  createEmptyAttempt,
  getQuizPackage,
  gradeFinalAttemptLocally,
  localQuizAttemptStore,
  submitFinalAttempt,
} from "@/features/lcms/quiz/quiz-runtime";
import { createInitialAnswer, getAllQuestions, isAnswerComplete } from "@/lib/quiz";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { LocalQuizAttemptSession } from "@/features/lcms/quiz/quiz-runtime";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage, QuizResultDisplay } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      attempt: Attempt;
      quizPackage: QuizPackage;
      restored: boolean;
      session: LocalQuizAttemptSession;
    }
  | { status: "error"; message: string };

type SidebarTab = "outline" | "notes";
type SubmitDialogMode = "all-answered" | "confirm";

const navButtonClass =
  "inline-flex min-h-10 min-w-[92px] items-center justify-center rounded-md border border-transparent px-4 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex min-h-10 min-w-[92px] items-center justify-center rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const playerViewportClass = "lg:h-[min(900px,calc(100vh-8rem))]";

const defaultResultDisplay: QuizResultDisplay = {
  passMessage: "Chúc mừng, bạn đã đạt!",
  failMessage: "Rất tiếc bạn đã không đạt!",
  reviewButtonLabel: "REVIEW QUIZ",
  thankYouMessage: "Thank you!",
  showReviewButton: true,
  submitAllPrompt: "All questions have been answered. Would you like to submit your answers?",
  confirmSubmitPrompt: "Are you sure you're ready to submit your answers and finish the quiz?",
  submitAllLabel: "SUBMIT ALL",
  returnToQuizLabel: "RETURN TO QUIZ",
  confirmYesLabel: "YES",
  confirmNoLabel: "NO",
};

export function PlayerShell({
  assignmentId,
  quizId = "avs-demo",
}: {
  assignmentId?: string;
  quizId?: string;
}) {
  const resolvedAssignmentId = assignmentId ?? quizId;
  const isMobile = useIsMobile();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [loadRequestId, setLoadRequestId] = useState(0);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, AnswerPayload>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("outline");
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [submitDialogMode, setSubmitDialogMode] = useState<SubmitDialogMode | null>(null);
  const [reviewingSubmittedAttempt, setReviewingSubmittedAttempt] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    let cancelled = false;

    paceStateUpdate(() => {
      if (cancelled) {
        return;
      }

      setLoadState({ status: "loading" });
      setStarted(false);
      setCurrentIndex(0);
      setDrafts({});
      setSubmitting(false);
      setSubmitError(null);
      setSidebarTab("outline");
      setSidebarQuery("");
      setSubmitDialogMode(null);
      setReviewingSubmittedAttempt(false);
      setSessionStartedAt(null);
      setRemainingSeconds(null);
    });

    async function load() {
      try {
        const quizPackage = await getQuizPackage(quizId);
        const storedSession = await localQuizAttemptStore.getSession(resolvedAssignmentId, quizId);
        const reusableSession =
          storedSession &&
          storedSession.packageHash === quizPackage.contentHash &&
          storedSession.quizVersion === quizPackage.quizVersion
            ? storedSession
            : null;

        const session = reusableSession ?? (await createFreshLocalSession(resolvedAssignmentId, quizPackage));
        const attempt =
          session.status === "submitted"
            ? gradeFinalAttemptLocally(quizPackage, session.attemptId, session.answers)
            : createEmptyAttempt(quizPackage, session.attemptId);

        if (cancelled) {
          return;
        }

        setDrafts(session.answers);
        setStarted(session.status === "submitted");
        setReviewingSubmittedAttempt(false);
        setSessionStartedAt(Date.parse(session.startedAt));
        setLoadState({
          status: "ready",
          attempt,
          quizPackage,
          restored: Boolean(reusableSession && Object.keys(reusableSession.answers).length > 0),
          session,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load quiz.",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadRequestId, paceStateUpdate, quizId, resolvedAssignmentId]);

  const quizPackage = loadState.status === "ready" ? loadState.quizPackage : null;
  const session = loadState.status === "ready" ? loadState.session : null;
  const quiz = quizPackage?.quiz ?? null;
  const attempt = loadState.status === "ready" ? loadState.attempt : null;
  const questions = useMemo(() => (quiz ? getAllQuestions(quiz) : []), [quiz]);
  const currentQuestion = questions[currentIndex];

  const filteredQuestions = useMemo(() => {
    const normalized = sidebarQuery.trim().toLowerCase();
    if (!normalized) {
      return questions;
    }

    return questions.filter((question, index) => `${index + 1}. ${question.title}`.toLowerCase().includes(normalized));
  }, [questions, sidebarQuery]);

  const activeQuiz = quiz;
  const activeAttempt = attempt;
  const activePackage = quizPackage;
  const activeSession = session;
  const activeQuestion = currentQuestion ?? null;
  const isTrainingMode = activeQuiz?.settings.mode === "training";
  const isTestingMode = activeQuiz?.settings.mode === "testing";
  const attemptCompleted = Boolean(activeAttempt && activeAttempt.submittedCount === questions.length && questions.length > 0);
  const reviewingAttempt = attemptCompleted && reviewingSubmittedAttempt;
  const currentRecord = activeQuestion && activeAttempt ? activeAttempt.answers[activeQuestion.id] : undefined;
  const submitted = Boolean(currentRecord);
  const storedAnswer = activeQuestion ? currentRecord?.input ?? drafts[activeQuestion.id] : undefined;
  const draftAnswer = activeQuestion ? storedAnswer ?? createInitialAnswer(activeQuestion) : {};
  const allQuestionsAnswered = questions.every((question) =>
    isAnswerComplete(question, drafts[question.id]),
  );
  const lastResult = currentRecord?.result ?? null;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const testingDurationSeconds = Math.max(activeQuiz?.settings.timeLimitMinutes ?? 0, 0) * 60;
  const deadlineAt = isTestingMode && sessionStartedAt !== null ? sessionStartedAt + testingDurationSeconds * 1000 : null;

  const submitReadyAttempt = useCallback(async (
    readyPackage: QuizPackage,
    readySession: LocalQuizAttemptSession,
    currentAttempt: Attempt | null,
  ) => {
    const submittedAt = new Date().toISOString();
    const answers = buildNormalizedAnswers(questions, drafts);
    const submittingSession = await localQuizAttemptStore.markSubmitting({
      ...readySession,
      answers,
    });

    setLoadState({
      status: "ready",
      attempt: currentAttempt ?? createEmptyAttempt(readyPackage, readySession.attemptId),
      quizPackage: readyPackage,
      restored: false,
      session: submittingSession,
    });

    const payload = buildClientSubmitPayload({
      answers,
      attemptId: readySession.attemptId,
      clientEvents: submittingSession.clientEvents,
      quizPackage: readyPackage,
      startedAt: readySession.startedAt,
      submittedAt,
    });

    const nextAttempt = await submitFinalAttempt({
      attemptId: readySession.attemptId,
      idempotencyKey: readySession.submitIdempotencyKey,
      payload,
      quiz: readyPackage.quiz,
      quizPackage: readyPackage,
    });
    const submittedSession = await localQuizAttemptStore.markSubmitted(
      {
        ...submittingSession,
        answers,
      },
      submittedAt,
    );

    setDrafts(answers);
    setSubmitError(null);
    setLoadState({
      status: "ready",
      attempt: nextAttempt,
      quizPackage: readyPackage,
      restored: false,
      session: submittedSession,
    });
    setReviewingSubmittedAttempt(false);
    setCurrentIndex(0);
  }, [drafts, questions]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || sessionStartedAt !== null) {
      return;
    }

    paceStateUpdate(() => {
      setSessionStartedAt(Date.now());
      setRemainingSeconds(testingDurationSeconds);
    });

  }, [started, isTestingMode, attemptCompleted, paceStateUpdate, sessionStartedAt, testingDurationSeconds]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || deadlineAt === null) {
      return;
    }

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [started, isTestingMode, attemptCompleted, deadlineAt]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || remainingSeconds !== 0 || submitting || !activePackage || !activeSession) {
      return;
    }

    void (async () => {
      setSubmitting(true);
      try {
        await submitReadyAttempt(activePackage, activeSession, activeAttempt);
      } catch (error) {
        const failedSession = await localQuizAttemptStore.markSubmitFailed(
          activeSession,
          error instanceof Error ? error.message : "Submit failed.",
        );
        setSubmitError(error instanceof Error ? error.message : "Submit failed. Please retry.");
        setLoadState({
          status: "ready",
          attempt: activeAttempt ?? createEmptyAttempt(activePackage, activeSession.attemptId),
          quizPackage: activePackage,
          restored: false,
          session: failedSession,
        });
      } finally {
        setSubmitting(false);
      }
    })();
  }, [started, isTestingMode, attemptCompleted, remainingSeconds, submitting, activePackage, activeSession, activeAttempt, submitReadyAttempt]);

  if (loadState.status === "loading") {
    return (
      <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
        <div className="grid gap-3 md:grid-cols-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (loadState.status === "error" || !activeQuiz || !activeAttempt || !activePackage || !activeSession || !activeQuestion) {
    return (
      <div className="grid gap-4 rounded-lg border border-red-100 bg-white p-8 text-red-600 shadow-sm">
        <p>{loadState.status === "error" ? loadState.message : "Quiz unavailable."}</p>
        <button
          type="button"
          className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setLoadRequestId((value) => value + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const readyQuiz: Quiz = activeQuiz;
  const readyAttempt: Attempt = activeAttempt;
  const readyPackage: QuizPackage = activePackage;
  const readyQuestion: Question = activeQuestion;
  const readySession: LocalQuizAttemptSession = activeSession;
  const resultDisplay: QuizResultDisplay = { ...defaultResultDisplay, ...(readyQuiz.result ?? {}) };
  const answeredCount = questions.filter((question) => isAnswerComplete(question, drafts[question.id])).length;
  const restoredDraft = loadState.status === "ready" && loadState.restored;
  const submitFailed = readySession.status === "submit_failed";
  const bookmarkedQuestionIds = readySession.bookmarkedQuestionIds;
  const isCurrentQuestionBookmarked = bookmarkedQuestionIds.includes(readyQuestion.id);

  const playerCardStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const canvasStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const headerStyle = {
    background: "var(--quiz-header-bg)",
    color: "var(--quiz-header-text)",
  };
  const accentButtonStyle = {
    backgroundColor: "var(--quiz-accent-start)",
  };
  const secondaryButtonStyle = {
    borderColor: "var(--quiz-canvas-border)",
    backgroundColor: "var(--quiz-player-bg)",
    color: "var(--quiz-option-text)",
  };
  const modeBadgeStyle = isTrainingMode
    ? {
        backgroundColor: "#ecfdf3",
        color: "#047857",
      }
    : {
        backgroundColor: "#ebf3fc",
        color: "var(--erg-blue)",
      };
  const sidebarActiveStyle = {
    background: "var(--quiz-sidebar-active-bg)",
    color: "var(--quiz-sidebar-active-text)",
  };
  const sidebarInputStyle = {
    backgroundColor: "var(--quiz-input-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const testingTimerTone =
    remainingSeconds !== null && remainingSeconds <= 60
      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
      : "bg-slate-100 text-slate-700";

  async function handleFinalizeAttempt() {
    setSubmitDialogMode(null);
    setSubmitting(true);
    try {
      await submitReadyAttempt(readyPackage, readySession, readyAttempt);
    } catch (error) {
      const failedSession = await localQuizAttemptStore.markSubmitFailed(
        readySession,
        error instanceof Error ? error.message : "Submit failed.",
      );
      setSubmitError(error instanceof Error ? error.message : "Submit failed. Please retry.");
      setLoadState({
        status: "ready",
        attempt: readyAttempt,
        quizPackage: readyPackage,
        restored: false,
        session: failedSession,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRequestSubmit() {
    setSubmitDialogMode(allQuestionsAnswered ? "all-answered" : "confirm");
  }

  function handleReviewQuiz() {
    setReviewingSubmittedAttempt(true);
    setCurrentIndex(0);
  }

  function handleDraftChange(next: AnswerPayload) {
    const previous = drafts[readyQuestion.id];
    if (areAnswerPayloadsEqual(previous, next)) {
      return;
    }

    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...readySession,
      answers: {
        ...readySession.answers,
        [readyQuestion.id]: next,
      },
      clientEvents: [
        ...readySession.clientEvents,
        {
          type: "answer_changed",
          createdAt: now,
          questionId: readyQuestion.id,
        },
      ],
      status: readySession.status === "submit_failed" ? "in_progress" : readySession.status,
      updatedAt: now,
    };

    setDrafts(nextSession.answers);
    setSubmitError(null);
    setLoadState({
      status: "ready",
      attempt: readyAttempt,
      quizPackage: readyPackage,
      restored: false,
      session: nextSession,
    });
    void localQuizAttemptStore.saveSession(nextSession);
  }

  async function handleToggleBookmark() {
    const nextSession = await localQuizAttemptStore.toggleBookmark(readySession, readyQuestion.id);
    setLoadState({
      status: "ready",
      attempt: readyAttempt,
      quizPackage: readyPackage,
      restored: false,
      session: nextSession,
    });
  }

  function handleJumpToQuestion(index: number) {
    if (!started) {
      setStarted(true);
      if (!isTestingMode) {
        setRemainingSeconds(null);
      }
    }
    setCurrentIndex(index);
  }

  function handleStartQuiz() {
    setStarted(true);
    if (!isTestingMode) {
      setRemainingSeconds(null);
    }
  }

  const footerMessage = reviewingAttempt
    ? "Đang xem lại kết quả. Màu xanh là đáp án đúng, màu đỏ/cam là câu trả lời cần sửa."
    : submitFailed
      ? "Submit failed. Your answers are still saved on this device. Retry with the same request key."
      : allQuestionsAnswered
        ? "Tất cả câu hỏi đã có câu trả lời. Bạn có thể nộp bài."
        : "Dùng Quay lại / Tiếp theo để rà soát bài trước khi nộp.";

  const questionBody = (
    <>
      <QuestionRenderer
        question={readyQuestion}
        value={draftAnswer}
        onChange={handleDraftChange}
        submitted={submitted}
        reviewMode={submitted}
        result={lastResult}
      />

      {lastResult ? <QuestionFeedbackPanel result={lastResult} /> : null}

      {submitted && readyQuestion.kind === "hotspot" ? <AnswerKeyCard question={readyQuestion} /> : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

      {!isMobile ? (
        <div className="pointer-events-none absolute bottom-4 right-6 text-xl font-semibold opacity-30 sm:text-2xl" style={{ color: "var(--quiz-option-text)" }}>
          ERG E-LEARNING
        </div>
      ) : null}
    </>
  );

  function renderSidebar() {
    return (
      <aside
        className={`flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-lg border shadow-sm ${playerViewportClass}`}
        style={playerCardStyle}
      >
        <div className="flex gap-1 bg-slate-100 px-2 pt-3">
          {(["outline", "notes"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 rounded-t-xl px-3 py-2 text-xs font-semibold  ${
                sidebarTab === tab ? "shadow-sm" : "text-slate-700"
              }`}
              style={sidebarTab === tab ? sidebarActiveStyle : undefined}
              onClick={() => setSidebarTab(tab)}
            >
              {tab === "outline" ? "MỤC LỤC" : "GHI CHÚ"}
            </button>
          ))}
        </div>

        {sidebarTab === "outline" ? (
          <>
            <div className="bg-slate-100 px-3 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={sidebarQuery}
                  onChange={(event) => setSidebarQuery(event.target.value)}
                  placeholder="Tìm kiếm"
                  className="min-h-9 w-full border px-3 pr-10 text-sm text-slate-600 outline-none"
                  style={sidebarInputStyle}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-auto bg-slate-100 px-3 pb-4">
              {!started ? (
                <button
                  type="button"
                  className="flex items-start gap-3 rounded-lg bg-slate-100 p-2 text-left"
                  onClick={() => setStarted(false)}
                >
                  <span className="h-11 w-[86px] flex-none rounded-sm border border-[#d1d1d1] bg-white" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="line-clamp-2 text-xs font-medium text-slate-600">1. Trang giới thiệu</strong>
                    <small className="text-[11px] text-slate-400">{readyQuiz.subtitle}</small>
                  </span>
                </button>
              ) : null}

              {filteredQuestions.map((question) => {
                const index = questions.findIndex((item) => item.id === question.id);
                const active = started && currentIndex === index;
                const answered = isAnswerComplete(question, drafts[question.id]);
                const bookmarked = bookmarkedQuestionIds.includes(question.id);

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`flex items-start gap-3 rounded border p-2 text-left transition ${
                      active ? "border-transparent shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    style={active ? sidebarActiveStyle : undefined}
                    onClick={() => handleJumpToQuestion(index)}
                  >
                    <span
                      className={`inline-flex h-11 w-[86px] flex-none items-center justify-center rounded-sm text-sm font-semibold ${
                        active ? "bg-white/14 text-white" : "bg-[#ebf3fc]"
                      }`}
                      style={!active ? { color: "var(--quiz-accent-start)" } : undefined}
                    >
                      {answered ? "✓" : index + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-start justify-between gap-2">
                        <strong className={`line-clamp-3 text-xs font-medium ${active ? "text-white" : "text-slate-600"}`}>
                          {`${index + 1}. ${question.title}`}
                        </strong>
                        {bookmarked ? <Bookmark className={`mt-0.5 h-3.5 w-3.5 flex-none ${active ? "fill-current text-white" : "fill-current text-[var(--quiz-accent-start)]"}`} /> : null}
                      </span>
                      <small className={`text-[11px] ${active ? "text-white/75" : "text-slate-400"}`}>
                        {questionLabel(question)}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid gap-3 p-4 text-sm leading-6 text-slate-500">
            <h3 className="text-lg font-semibold text-slate-800">Ghi chú cho giáo viên</h3>
            <p>
              Khu này có thể hiển thị ghi chú hướng dẫn, script giảng dạy, đáp án mẫu hoặc checklist để giống cách
              iSpring chia Outline và Notes.
            </p>
            <p>Ở bản clone sản phẩm thật, mình khuyến nghị cho phép authoring dashboard soạn note theo từng slide.</p>
          </div>
        )}
      </aside>
    );
  }

  if (!started) {
    if (isMobile) {
      return (
        <QuizThemeSurface quiz={readyQuiz}>
          <MobilePlayerShell
            allQuestionsAnswered={allQuestionsAnswered}
            answeredCount={answeredCount}
            attemptCompleted={attemptCompleted}
            bookmarkCount={bookmarkedQuestionIds.length}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
            currentIndex={currentIndex}
            footerMessage={footerMessage}
            isBookmarked={isCurrentQuestionBookmarked}
            isFirstQuestion={isFirstQuestion}
            isLastQuestion={isLastQuestion}
            isTestingMode={isTestingMode}
            playerCardStyle={playerCardStyle}
            canvasStyle={canvasStyle}
            headerStyle={headerStyle}
            accentButtonStyle={accentButtonStyle}
            secondaryButtonStyle={secondaryButtonStyle}
            modeBadgeStyle={modeBadgeStyle}
            question={readyQuestion}
            questions={questions}
            quiz={readyQuiz}
            resultDisplay={resultDisplay}
            reviewingSubmittedAttempt={reviewingSubmittedAttempt}
            started={started}
            submitting={submitting}
            submitFailed={submitFailed}
            remainingSeconds={remainingSeconds}
            onJumpToQuestion={handleJumpToQuestion}
            onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
            onPrev={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            onRequestSubmit={handleRequestSubmit}
            onReview={handleReviewQuiz}
            onStart={handleStartQuiz}
            onToggleBookmark={() => void handleToggleBookmark()}
            body={questionBody}
            resultBody={<FinalResultScreen attempt={readyAttempt} resultDisplay={resultDisplay} onReview={handleReviewQuiz} />}
          />
        </QuizThemeSurface>
      );
    }

    return (
      <QuizThemeSurface quiz={readyQuiz} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section
          className={`flex flex-col rounded-lg border p-3 shadow-sm ${playerViewportClass}`}
          style={playerCardStyle}
        >
          <div className="flex min-h-9 items-center justify-between px-3 pb-3 text-sm text-slate-500">
            <span>Tài nguyên</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden border" style={canvasStyle}>
            <div className="grid h-full overflow-auto gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(340px,1fr)_minmax(280px,0.9fr)]">
              <div className="flex flex-col justify-center gap-4">
                <p className="text-sm font-semibold" style={{ color: "var(--quiz-accent-start)" }}>
                  {readyQuiz.subtitle}
                </p>
                <h1
                  className="max-w-[720px] text-xl font-semibold leading-tight sm:text-2xl"
                  style={{ color: "var(--quiz-accent-end)" }}
                >
                  {readyQuiz.title}
                </h1>
                <p className="text-sm font-medium" style={{ color: "var(--quiz-option-text)" }}>
                  Bấm &quot;Bắt đầu&quot; để bắt đầu làm bài.
                </p>
                {restoredDraft ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Local draft restored: {answeredCount}/{questions.length} answered. Continue to keep working from this device.
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold" style={modeBadgeStyle}>
                    {isTrainingMode ? "Chế độ luyện tập" : "Chế độ kiểm tra"}
                  </span>
                  {isTrainingMode ? (
                    <span className="inline-flex items-center rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                      Work locally, then submit once at the end
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                      Làm hết bài rồi mới nộp và chấm điểm
                    </span>
                  )}
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-lg"
                style={{ backgroundColor: "var(--quiz-accent-start)" }}
              >
                <div className="absolute left-6 top-6 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/92 p-5 shadow-sm">
                  <span className="text-xs font-semibold" style={{ color: "var(--quiz-accent-start)" }}>
                    {isTrainingMode ? "LUYỆN TẬP" : "KIỂM TRA"}
                  </span>
                  <strong className="text-xl font-semibold leading-tight" style={{ color: "var(--quiz-accent-end)" }}>
                    {isTrainingMode ? "Học theo bước" : "Làm bài đánh giá"}
                  </strong>
                  <span className="text-sm font-medium text-slate-600">Version {readyQuiz.version}</span>
                </div>
                <div className="absolute inset-x-8 bottom-8 h-px bg-white/30" />
                <div className="absolute bottom-12 left-8 right-8 grid gap-2 text-sm font-medium text-white/80">
                  <span>{questions.length} câu hỏi</span>
                  <span>{isTestingMode ? "Chấm điểm sau khi nộp" : "Luyện tập theo từng bước"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-14 items-center justify-between gap-3 px-3 pt-4">
            <span className="text-sm font-medium text-slate-500">
              {isTrainingMode ? "Practice: answers stay local until final submit" : "Kiểm tra: nộp bài ở cuối cùng"}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                className={navButtonClass}
                style={accentButtonStyle}
                type="button"
                onClick={handleStartQuiz}
              >
                {restoredDraft ? "CONTINUE DRAFT" : "BẮT ĐẦU"}
              </button>
            </div>
          </div>
        </section>

        {renderSidebar()}
      </QuizThemeSurface>
    );
  }

  if (isMobile) {
    return (
      <QuizThemeSurface quiz={readyQuiz}>
        <MobilePlayerShell
          allQuestionsAnswered={allQuestionsAnswered}
          answeredCount={answeredCount}
          attemptCompleted={attemptCompleted}
          bookmarkCount={bookmarkedQuestionIds.length}
          bookmarkedQuestionIds={bookmarkedQuestionIds}
          currentIndex={currentIndex}
          footerMessage={footerMessage}
          isBookmarked={isCurrentQuestionBookmarked}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          isTestingMode={isTestingMode}
          playerCardStyle={playerCardStyle}
          canvasStyle={canvasStyle}
          headerStyle={headerStyle}
          accentButtonStyle={accentButtonStyle}
          secondaryButtonStyle={secondaryButtonStyle}
          modeBadgeStyle={modeBadgeStyle}
          question={readyQuestion}
          questions={questions}
          quiz={readyQuiz}
          resultDisplay={resultDisplay}
          reviewingSubmittedAttempt={reviewingSubmittedAttempt}
          started={started}
          submitting={submitting}
          submitFailed={submitFailed}
          remainingSeconds={remainingSeconds}
          onJumpToQuestion={handleJumpToQuestion}
          onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
          onPrev={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          onRequestSubmit={handleRequestSubmit}
          onReview={handleReviewQuiz}
          onStart={handleStartQuiz}
          onToggleBookmark={() => void handleToggleBookmark()}
          body={questionBody}
          resultBody={<FinalResultScreen attempt={readyAttempt} resultDisplay={resultDisplay} onReview={handleReviewQuiz} />}
        />
        {submitDialogMode ? (
          <SubmitConfirmDialog
            mode={submitDialogMode}
            resultDisplay={resultDisplay}
            submitting={submitting}
            onCancel={() => setSubmitDialogMode(null)}
            onConfirm={() => void handleFinalizeAttempt()}
          />
        ) : null}
      </QuizThemeSurface>
    );
  }

  return (
    <QuizThemeSurface quiz={readyQuiz} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section
        className={`flex min-w-0 flex-col rounded-lg border p-3 shadow-sm ${playerViewportClass}`}
        style={playerCardStyle}
      >
        <div className="flex min-h-9 items-center justify-between gap-3 px-3 pb-3 text-sm text-slate-500">
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
              aria-label={isCurrentQuestionBookmarked ? "Remove bookmark" : "Add bookmark"}
              className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                isCurrentQuestionBookmarked ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "border-slate-200 bg-white text-slate-400"
              }`}
              onClick={() => void handleToggleBookmark()}
            >
              <Bookmark className={`h-4 w-4 ${isCurrentQuestionBookmarked ? "fill-current" : ""}`} />
            </button>
            <span className="rounded-md px-3 py-1 text-xs font-semibold" style={modeBadgeStyle}>
              {readyQuiz.settings.mode}
            </span>
            {isTestingMode && remainingSeconds !== null ? (
              <span className={`rounded-md px-3 py-1 text-xs font-semibold ${testingTimerTone}`}>
                {formatTimer(remainingSeconds)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative min-h-[560px] min-w-0 flex-1 overflow-hidden rounded-lg border lg:flex lg:min-h-0 lg:flex-col"
          style={canvasStyle}
        >
          <div className="mx-3 mt-3 rounded-lg px-4 py-4 sm:mx-6 sm:mt-6 sm:px-5" style={headerStyle}>
            <h2 className="text-xl font-semibold leading-snug sm:text-2xl lg:text-[28px]">
              {attemptCompleted && !reviewingSubmittedAttempt ? resultDisplay[readyAttempt.passed ? "passMessage" : "failMessage"] : readyQuestion.title}
            </h2>
          </div>

          <div className="relative min-h-[460px] overflow-auto px-4 pb-12 pt-5 sm:px-8 lg:min-h-0 lg:flex-1">
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
        </div>

        <div className="flex min-h-14 flex-col gap-3 px-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-md px-3 py-1 text-xs font-semibold" style={modeBadgeStyle}>
              {isTrainingMode ? "Học theo từng câu" : "Chế độ kiểm tra"}
            </span>
            <span className="text-sm font-medium text-slate-600">
              {footerMessage}
            </span>
          </div>

          {attemptCompleted && !reviewingSubmittedAttempt ? (
            <div className="ml-auto flex flex-wrap gap-2">
              {resultDisplay.showReviewButton ? (
                <button className={navButtonClass} style={accentButtonStyle} type="button" onClick={handleReviewQuiz}>
                  {resultDisplay.reviewButtonLabel}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ml-auto flex flex-wrap gap-2">
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
              {(allQuestionsAnswered || submitFailed) && !attemptCompleted ? (
                <button
                  className={navButtonClass}
                  style={accentButtonStyle}
                  type="button"
                  disabled={submitting}
                  onClick={handleRequestSubmit}
                >
                  {submitting ? "ĐANG NỘP..." : submitFailed ? "RETRY SUBMIT" : "NỘP BÀI"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {renderSidebar()}

      {submitDialogMode ? (
        <SubmitConfirmDialog
          mode={submitDialogMode}
          resultDisplay={resultDisplay}
          submitting={submitting}
          onCancel={() => setSubmitDialogMode(null)}
          onConfirm={() => void handleFinalizeAttempt()}
        />
      ) : null}
    </QuizThemeSurface>
  );
}
