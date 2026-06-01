import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import {
  buildClientSubmitPayload,
  createEmptyAttempt,
  createRuntimeKey,
  getQuizPackage,
  gradeFinalAttemptLocally,
  localQuizAttemptStore,
  startAttempt,
  submitFinalAttempt,
} from "@/features/lcms/quiz/quiz-runtime";
import { createInitialAnswer, getAllQuestions, isAnswerComplete, normalizeAnswerForSubmission } from "@/lib/quiz";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LocalQuizAttemptSession } from "@/features/lcms/quiz/quiz-runtime";
import type { AnswerPayload, AnswerResult, Attempt, Question, Quiz, QuizPackage, QuizResultDisplay } from "@/lib/types";

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
  "inline-flex min-h-10 min-w-[92px] items-center justify-center rounded-xl border border-transparent px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(0,0,139,0.16)] transition disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex min-h-10 min-w-[92px] items-center justify-center rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40";
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

  useEffect(() => {
    let cancelled = false;

    window.queueMicrotask(() => {
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
  }, [loadRequestId, quizId, resolvedAssignmentId]);

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

    const frameId = window.requestAnimationFrame(() => {
      setSessionStartedAt(Date.now());
      setRemainingSeconds(testingDurationSeconds);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [started, isTestingMode, attemptCompleted, sessionStartedAt, testingDurationSeconds]);

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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-[var(--erg-shadow)]">
        Đang tải bài làm...
      </div>
    );
  }

  if (loadState.status === "error" || !activeQuiz || !activeAttempt || !activePackage || !activeSession || !activeQuestion) {
    return (
      <div className="grid gap-4 rounded-3xl border border-red-100 bg-white p-8 text-red-600 shadow-[var(--erg-shadow)]">
        <p>{loadState.status === "error" ? loadState.message : "Quiz unavailable."}</p>
        <button
          type="button"
          className="w-fit rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
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
    background: "linear-gradient(135deg, var(--quiz-accent-start), var(--quiz-accent-end))",
  };
  const secondaryButtonStyle = {
    borderColor: "var(--quiz-canvas-border)",
    backgroundColor: "var(--quiz-player-bg)",
    color: "var(--quiz-option-text)",
  };
  const modeBadgeStyle = isTrainingMode
    ? {
        background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.22))",
        color: "#047857",
      }
    : {
        background: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,116,144,0.22))",
        color: "#1d4ed8",
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
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-[0_8px_20px_rgba(26,44,64,0.08)]">
          {submitError}
        </div>
      ) : null}

      {!isMobile ? (
        <div className="pointer-events-none absolute bottom-4 right-6 text-xl font-extrabold opacity-30 sm:text-2xl" style={{ color: "var(--quiz-option-text)" }}>
          ERG E-LEARNING
        </div>
      ) : null}
    </>
  );

  function renderSidebar() {
    return (
      <aside
        className={`flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-[28px] border shadow-[var(--erg-shadow)] ${playerViewportClass}`}
        style={playerCardStyle}
      >
        <div className="flex gap-1 bg-slate-100 px-2 pt-3">
          {(["outline", "notes"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 rounded-t-xl px-3 py-2 text-xs font-extrabold tracking-wide ${
                sidebarTab === tab ? "shadow-[0_12px_28px_rgba(0,0,139,0.16)]" : "text-slate-700"
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
            <div className="relative bg-slate-100 px-3 py-3">
              <input
                type="search"
                value={sidebarQuery}
                onChange={(event) => setSidebarQuery(event.target.value)}
                placeholder="Tìm kiếm"
                className="min-h-9 w-full border px-3 pr-10 text-sm text-slate-600 outline-none"
                style={sidebarInputStyle}
              />
              <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-lg text-slate-500">⌕</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-auto bg-slate-100 px-3 pb-4">
              {!started ? (
                <button
                  type="button"
                  className="flex items-start gap-3 rounded-2xl bg-slate-100 p-2 text-left"
                  onClick={() => setStarted(false)}
                >
                  <span className="h-11 w-[86px] flex-none rounded-sm bg-[linear-gradient(145deg,transparent_54%,#1794d8_55%,#1794d8_72%,transparent_73%),linear-gradient(140deg,transparent_70%,#d51471_71%,#d51471_94%,transparent_95%),#fff]" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="line-clamp-2 text-xs font-bold text-slate-600">1. Trang giới thiệu</strong>
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
                      active ? "border-transparent shadow-[0_18px_40px_rgba(0,0,139,0.18)]" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    style={active ? sidebarActiveStyle : undefined}
                    onClick={() => handleJumpToQuestion(index)}
                  >
                    <span
                      className={`inline-flex h-11 w-[86px] flex-none items-center justify-center rounded-sm text-sm font-extrabold ${
                        active ? "bg-white/14 text-white" : "bg-[linear-gradient(135deg,#eef4ff,#dbeafe)]"
                      }`}
                      style={!active ? { color: "var(--quiz-accent-start)" } : undefined}
                    >
                      {answered ? "✓" : index + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-start justify-between gap-2">
                        <strong className={`line-clamp-3 text-xs font-bold ${active ? "text-white" : "text-slate-600"}`}>
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
            <h3 className="text-lg font-extrabold text-slate-800">Ghi chú cho giáo viên</h3>
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
          className={`flex flex-col rounded-[32px] border p-3 shadow-[var(--erg-shadow-lg)] ${playerViewportClass}`}
          style={playerCardStyle}
        >
          <div className="flex min-h-9 items-center justify-between px-3 pb-3 text-sm text-slate-500">
            <span>Tài nguyên</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden border" style={canvasStyle}>
            <div className="grid h-full overflow-auto gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(340px,1fr)_minmax(280px,0.9fr)] lg:p-12">
              <div className="flex flex-col justify-center gap-4">
                <p className="text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--quiz-accent-start)" }}>
                  {readyQuiz.subtitle}
                </p>
                <h1
                  className="max-w-[720px] text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl"
                  style={{ color: "var(--quiz-accent-end)" }}
                >
                  {readyQuiz.title}
                </h1>
                <p className="text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--quiz-option-text)" }}>
                  Bấm &quot;Bắt đầu&quot; để bắt đầu làm bài.
                </p>
                {restoredDraft ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    Local draft restored: {answeredCount}/{questions.length} answered. Continue to keep working from this device.
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="inline-flex items-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em]" style={modeBadgeStyle}>
                    {isTrainingMode ? "Chế độ luyện tập" : "Chế độ kiểm tra"}
                  </span>
                  {isTrainingMode ? (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-[0_10px_24px_rgba(26,44,64,0.08)]">
                      Work locally, then submit once at the end
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-[0_10px_24px_rgba(26,44,64,0.08)]">
                      Làm hết bài rồi mới nộp và chấm điểm
                    </span>
                  )}
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-[28px]"
                style={{
                  background: `radial-gradient(circle at top left, rgba(255,255,255,0.4), transparent 30%), linear-gradient(145deg, var(--quiz-accent-start) 0%, var(--quiz-accent-end) 55%, #0f172a 100%)`,
                }}
              >
                <div className="absolute left-6 top-6 flex flex-col gap-2 rounded-3xl bg-white/92 p-6 shadow-[0_16px_38px_rgba(30,48,77,0.12)]">
                  <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--quiz-accent-start)" }}>
                    {isTrainingMode ? "LUYỆN TẬP" : "KIỂM TRA"}
                  </span>
                  <strong className="text-4xl font-black leading-none sm:text-[42px]" style={{ color: "var(--quiz-accent-end)" }}>
                    {isTrainingMode ? "Học theo bước" : "Làm bài đánh giá"}
                  </strong>
                  <span className="text-base font-bold text-slate-600">Version {readyQuiz.version}</span>
                </div>
                <div className="absolute right-10 top-24 h-60 w-60 rounded-full bg-[rgb(255_255_255_/_0.12)] blur-sm sm:h-[312px] sm:w-[312px]" />
                <div className="absolute bottom-14 right-6 h-32 w-60 rotate-[-22deg] rounded-full bg-[rgb(204_0_34_/_0.3)] blur-sm sm:h-44 sm:w-80" />
                <div className="absolute bottom-14 left-16 h-20 w-20 rounded-full bg-[rgb(255_255_255_/_0.16)]" />
              </div>
            </div>
          </div>

          <div className="flex min-h-14 items-center justify-between gap-3 px-3 pt-4">
            <span className="text-sm font-bold tracking-[0.02em] text-slate-500">
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
        className={`flex min-w-0 flex-col rounded-[32px] border p-3 shadow-[var(--erg-shadow-lg)] ${playerViewportClass}`}
        style={playerCardStyle}
      >
        <div className="flex min-h-9 items-center justify-between gap-3 px-3 pb-3 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>Tài nguyên</span>
            <span className="text-slate-300">|</span>
            <span>{`Câu ${currentIndex + 1} / ${questions.length}`}</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {allQuestionsAnswered ? "Đã hoàn tất" : `${answeredCount}/${questions.length} đã trả lời`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isCurrentQuestionBookmarked ? "Remove bookmark" : "Add bookmark"}
              className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                isCurrentQuestionBookmarked ? "border-sky-200 bg-sky-50 text-sky-600" : "border-slate-200 bg-white text-slate-400"
              }`}
              onClick={() => void handleToggleBookmark()}
            >
              <Bookmark className={`h-4 w-4 ${isCurrentQuestionBookmarked ? "fill-current" : ""}`} />
            </button>
            <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em]" style={modeBadgeStyle}>
              {readyQuiz.settings.mode}
            </span>
            {isTestingMode && remainingSeconds !== null ? (
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${testingTimerTone}`}>
                {formatTimer(remainingSeconds)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative min-h-[560px] min-w-0 flex-1 overflow-hidden rounded-[24px] border lg:flex lg:min-h-0 lg:flex-col"
          style={{
            ...canvasStyle,
            background:
              "radial-gradient(circle at 12% 84%, rgba(204,0,34,0.08), transparent 14%), radial-gradient(circle at 82% 76%, rgba(29,78,216,0.09), transparent 16%), radial-gradient(circle at 64% 20%, rgba(59,130,246,0.08), transparent 17%), radial-gradient(circle at 20% 26%, rgba(248,208,211,0.14), transparent 16%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,1))",
          }}
        >
          <div className="mx-3 mt-3 rounded-[20px] px-4 py-4 sm:mx-6 sm:mt-6 sm:px-5" style={headerStyle}>
            <h2 className="text-2xl font-bold leading-[1.18] sm:text-3xl lg:text-[40px]">
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
            <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em]" style={modeBadgeStyle}>
              {isTrainingMode ? "Học theo từng câu" : "Chế độ kiểm tra"}
            </span>
            <span className="text-sm font-bold tracking-[0.02em] text-slate-600">
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

async function createFreshLocalSession(assignmentId: string, quizPackage: QuizPackage) {
  const localAttemptId = createRuntimeKey("attempt");
  const startKey = createRuntimeKey("start");
  const submitKey = createRuntimeKey("submit");
  const startedAttempt = await startAttempt({
    assignmentId,
    idempotencyKey: startKey,
    localAttemptId,
    packageHash: quizPackage.contentHash,
    packageId: quizPackage.id,
    quizId: quizPackage.quizId,
  });

  return localQuizAttemptStore.createSession({
    assignmentId,
    attemptId: startedAttempt.attemptId,
    packageHash: quizPackage.contentHash,
    quizId: quizPackage.quizId,
    quizVersion: quizPackage.quizVersion,
    submitIdempotencyKey: submitKey,
  });
}

function buildNormalizedAnswers(questions: Question[], drafts: Record<string, AnswerPayload>) {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      normalizeAnswerForSubmission(question, drafts[question.id] ?? {}),
    ]),
  );
}

function FinalResultScreen({
  attempt,
  resultDisplay,
  onReview,
}: {
  attempt: Attempt;
  resultDisplay: QuizResultDisplay;
  onReview: () => void;
}) {
  const resultMessage = attempt.passed ? resultDisplay.passMessage : resultDisplay.failMessage;

  return (
    <div className="relative grid min-h-[500px] place-items-center overflow-hidden bg-white px-8 py-10">
      <div className="pointer-events-none absolute left-8 top-7 h-28 w-36 rounded-[52%] bg-emerald-100 opacity-70" />
      <div className="pointer-events-none absolute -left-20 top-52 h-28 w-80 rotate-[-24deg] rounded-full bg-pink-300 opacity-70" />
      <div className="pointer-events-none absolute right-[-72px] top-5 h-24 w-96 rotate-[-24deg] rounded-full bg-sky-300 opacity-80" />
      <div className="pointer-events-none absolute right-[-60px] top-28 h-24 w-72 rotate-[-24deg] rounded-full bg-pink-300 opacity-75" />
      <div className="pointer-events-none absolute bottom-8 right-28 h-44 w-56 rounded-[42%] bg-amber-100 opacity-80" />

      <div className="relative z-10 grid justify-items-center gap-5 text-center">
        <div
          className={`grid h-24 w-24 place-items-center rounded-full text-6xl font-light text-white ${
            attempt.passed ? "bg-emerald-500" : "bg-[#f35b48]"
          }`}
        >
          {attempt.passed ? "✓" : "×"}
        </div>
        <h2 className="text-3xl font-black tracking-[0.08em] text-[#b9535f] sm:text-4xl">
          {resultMessage}
        </h2>
        <div className="grid gap-2">
          <span className="text-2xl font-black text-[#173653]">Điểm</span>
          <strong className="text-3xl font-black text-[#b9535f]">
            {attempt.totalScore}/{attempt.maxScore}
          </strong>
          <span className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
            {attempt.percent}%
          </span>
        </div>
        {resultDisplay.showReviewButton ? (
          <button
            type="button"
            onClick={onReview}
            className="min-h-14 rounded-lg border-2 border-blue-500 bg-[#1e6172] px-7 text-xl font-black uppercase tracking-[0.05em] text-white shadow-[0_14px_28px_rgba(29,78,216,0.18)]"
          >
            {resultDisplay.reviewButtonLabel}
          </button>
        ) : null}
        <div className="text-5xl font-black tracking-[0.06em] text-fuchsia-300 opacity-90">
          {resultDisplay.thankYouMessage}
        </div>
      </div>
    </div>
  );
}

function QuestionFeedbackPanel({ result }: { result: AnswerResult }) {
  const tone = result.correct ? "correct" : "wrong";
  const title = result.correct ? "Đáp án chính xác!" : result.partiallyRight ? "Đáp án gần đúng!" : "Đáp án chưa đúng!";
  const headerClass =
    tone === "correct"
      ? "bg-[#78b816]"
      : result.partiallyRight
        ? "bg-[#f59e0b]"
        : "bg-[#e65a4d]";

  return (
    <div className="mx-auto mt-8 w-full max-w-[884px] overflow-hidden rounded-lg bg-white shadow-[0_16px_38px_rgba(15,23,42,0.16)]">
      <div className={`flex min-h-14 items-center justify-between px-7 text-2xl font-black text-white ${headerClass}`}>
        <span>{title}</span>
        <span className="text-3xl font-light">⌄</span>
      </div>
      <div className="px-7 py-8 text-xl leading-8 text-slate-950">{result.message}</div>
    </div>
  );
}

function SubmitConfirmDialog({
  mode,
  resultDisplay,
  submitting,
  onCancel,
  onConfirm,
}: {
  mode: SubmitDialogMode;
  resultDisplay: QuizResultDisplay;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isAllAnswered = mode === "all-answered";

  return (
    <div className="fixed inset-0 z-[260] grid place-items-center bg-black/10">
      <div className="flex w-[min(590px,calc(100vw-56px))] items-center gap-4 border border-slate-300 bg-white px-7 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.28)]">
        <div className="grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-slate-500 text-xl font-black text-slate-500">
          ?
        </div>
        <div className="grid flex-1 gap-6">
          <p className="text-sm font-medium text-slate-900">
            {isAllAnswered ? resultDisplay.submitAllPrompt : resultDisplay.confirmSubmitPrompt}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="min-h-9 min-w-[136px] bg-[#4f86dd] px-5 text-sm font-black text-white shadow-sm outline outline-1 outline-offset-[-4px] outline-white/45 disabled:opacity-60"
            >
              {submitting
                ? "SUBMITTING..."
                : isAllAnswered
                  ? resultDisplay.submitAllLabel
                  : resultDisplay.confirmYesLabel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="min-h-9 min-w-[136px] bg-[#4f86dd] px-5 text-sm font-black text-white shadow-sm disabled:opacity-60"
            >
              {isAllAnswered ? resultDisplay.returnToQuizLabel : resultDisplay.confirmNoLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnswerKeyCard({ question }: { question: Question }) {
  const lines = getAnswerKeyLines(question);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_8px_20px_rgba(26,44,64,0.08)]">
      <div className="px-4 py-3 text-sm font-black text-white" style={{ background: "linear-gradient(135deg, var(--quiz-accent-start), var(--quiz-accent-end))" }}>
        Đáp án
      </div>
      <div className="grid gap-2 px-4 py-4 text-sm leading-6 text-slate-600">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function getAnswerKeyLines(question: Question): string[] {
  switch (question.kind) {
    case "single_choice":
    case "true_false":
      return (question.choices ?? []).filter((choice) => choice.correct).map((choice) => `Đáp án đúng: ${choice.label}`);
    case "multiple_response":
      return (question.choices ?? []).filter((choice) => choice.correct).map((choice) => `Đáp án đúng: ${choice.label}`);
    case "short_answer":
    case "fill_blank":
      return (question.textBlanks ?? []).map(
        (blank, index) => `${index + 1}. ${blank.label}: ${blank.correctAnswers[0] ?? ""}`,
      );
    case "numeric":
      return question.numericAnswer
        ? [`Đáp án đúng: ${question.numericAnswer.correctValue}${question.numericAnswer.unit ? ` ${question.numericAnswer.unit}` : ""}`]
        : [];
    case "matching":
      return (question.matching ?? []).map((pair, index) => `${index + 1}. ${pair.prompt} -> ${pair.response}`);
    case "sequence":
      return (question.sequenceItems ?? []).map((item, index) => `${index + 1}. ${item.label}`);
    case "inline_choice":
    case "select_from_lists":
      return (question.inlineBlanks ?? []).map(
        (blank, index) => `${index + 1}. ${blank.statement}: ${formatInlineOption(blank.correctOptionId)}`,
      );
    case "drag_words":
      return (question.wordSlots ?? []).map((slot, index) => {
        const word = question.wordBank?.find((item) => item.id === slot.correctWordId);
        return `${index + 1}. ${slot.label}: ${word?.label ?? ""}`;
      });
    case "hotspot":
      return ["Vùng đáp án đúng đã được hiển thị trên hình."];
    case "drag_drop":
      return (question.dragDropItems ?? []).map((item, index) => {
        const target = question.dropTargets?.find((candidate) => candidate.id === item.correctTargetId);
        return `${index + 1}. ${item.label} -> ${target?.label ?? ""}`;
      });
    case "likert_scale":
      return ["Câu khảo sát ghi nhận mức độ lựa chọn, không có đáp án đúng sai tuyệt đối."];
    case "essay":
      return (question.essayRubric ?? []).map((item) => `${item.label}: ${item.points}đ`);
    default:
      return [];
  }
}

function formatInlineOption(option: string) {
  if (option === "yes") {
    return "Có";
  }

  if (option === "no") {
    return "Không";
  }

  return option;
}

function areAnswerPayloadsEqual(left?: AnswerPayload, right?: AnswerPayload) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.choiceId === right.choiceId &&
    stringArraysEqual(left.choiceIds, right.choiceIds) &&
    stringArraysEqual(left.matchingOrder, right.matchingOrder) &&
    stringArraysEqual(left.matchingConnectedRows, right.matchingConnectedRows) &&
    stringArraysEqual(left.sequenceOrder, right.sequenceOrder) &&
    recordsEqual(left.matchingAssignments, right.matchingAssignments) &&
    recordsEqual(left.inlineSelections, right.inlineSelections) &&
    recordsEqual(left.textResponses, right.textResponses) &&
    recordsEqual(left.dragWordPlacements, right.dragWordPlacements) &&
    recordsEqual(left.dragDropPlacements, right.dragDropPlacements) &&
    recordsEqual(left.likertResponses, right.likertResponses) &&
    left.numericValue === right.numericValue &&
    left.essayText === right.essayText &&
    left.hotspotPoint?.x === right.hotspotPoint?.x &&
    left.hotspotPoint?.y === right.hotspotPoint?.y
  );
}

function stringArraysEqual(left?: string[], right?: string[]) {
  if (left === right) {
    return true;
  }

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

function recordsEqual(left?: Record<string, string>, right?: Record<string, string>) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function questionLabel(question: Question) {
  switch (question.kind) {
    case "single_choice":
      return "Chọn 1 đáp án";
    case "multiple_response":
      return "Chọn nhiều đáp án";
    case "true_false":
      return "Đúng / Sai";
    case "short_answer":
      return "Trả lời ngắn";
    case "numeric":
      return "Số học";
    case "matching":
      return "Nối cặp";
    case "sequence":
      return "Sắp xếp thứ tự";
    case "fill_blank":
      return "Điền chỗ trống";
    case "inline_choice":
      return "Chọn trong dòng";
    case "select_from_lists":
      return "Chọn từ danh sách";
    case "drag_words":
      return "Kéo từ";
    case "hotspot":
      return "Điểm nóng";
    case "drag_drop":
      return "Kéo và thả";
    case "likert_scale":
      return "Thang Likert";
    case "essay":
      return "Tự luận";
    default:
      return "Câu hỏi";
  }
}
