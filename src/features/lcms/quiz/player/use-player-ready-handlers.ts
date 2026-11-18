import { areAnswerPayloadsEqual } from "@/components/quiz/player-shell-utils";
import { createFreshLocalSession } from "@/features/lcms/quiz/player/player-shell-session";
import { createEmptyAttempt, createRuntimeKey, localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage } from "@/domain/quiz/types";
import type { PlayerRuntime } from "./use-player-runtime";

export type PlayerReady = {
  quiz: Quiz;
  attempt: Attempt;
  quizPackage: QuizPackage;
  question: Question;
  session: LocalQuizAttemptSession;
};

export function usePlayerReadyHandlers(rt: PlayerRuntime, ready: PlayerReady) {
  const {
    attemptScope, attemptsExhausted, beginAttempt, drafts, finalizeAttempt, isTrainingMode, requestSubmit, reviewBeforeRetryRef, started,
    setCurrentIndex, setDrafts, setLoadState, setReviewingSubmittedAttempt, setStarted, setSubmitError,
    submitCurrentTrainingQuestion,
  } = rt;
  const readyQuestion = ready.question;
  const readyAttempt = ready.attempt;
  const readyPackage = ready.quizPackage;
  const readySession = ready.session;
  const activeSession = ready.session;

  async function handleFinalizeAttempt() {
    await finalizeAttempt();
  }

  function handleRequestSubmit() {
    requestSubmit();
  }

  function handleReviewQuiz() {
    setReviewingSubmittedAttempt(true);
    setCurrentIndex(0);
  }

  function handleReviewQuestion(index: number) {
    setReviewingSubmittedAttempt(true);
    setCurrentIndex(index);
  }

  function handleBackToList() {
    window.history.back();
  }

  // Practice mode only: drop the finished local session, then reload into a fresh attempt.
  // A server-sourced review (no local session) has nothing to clear and a reload would show it again: open a fresh
  // local attempt on the start screen instead; "Bắt đầu" then asks the server (409 when no attempts are left).
  // No "Làm lại" once the server said there is no attempt left; the fresh session stays in memory until the server accepts the start.
  const retryHandler = (isTrainingMode || (activeSession.reviewOnly && !attemptsExhausted && !activeSession.attemptsExhausted)) ? () => {
    if (activeSession.reviewOnly) {
      reviewBeforeRetryRef.current = { status: "ready", attempt: readyAttempt, quizPackage: readyPackage, restored: false, session: activeSession };
      void createFreshLocalSession(activeSession.assignmentId, readyPackage, attemptScope, false).then((fresh) => {
        setDrafts({});
        setCurrentIndex(0);
        setReviewingSubmittedAttempt(false);
        setStarted(false);
        setLoadState({ status: "ready", attempt: createEmptyAttempt(readyPackage, fresh.attemptId), quizPackage: readyPackage, restored: false, session: fresh });
      });
      return;
    }
    void localQuizAttemptStore.clearScopedSession(activeSession.assignmentId, activeSession.quizId, attemptScope).then(() => window.location.reload());
  } : undefined;

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
          id: createRuntimeKey("evt"),
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
    if (readySession.reviewOnly) return; // memory-only session: saving it would plant a keyless "submitted" session in IndexedDB
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
      void beginAttempt(index);
      return;
    }
    setCurrentIndex(index);
  }

  function handleStartQuiz() {
    void beginAttempt();
  }

  return {
    handleBackToList, handleDraftChange, handleFinalizeAttempt, handleJumpToQuestion,
    handleRequestSubmit, handleReviewQuestion, handleReviewQuiz, handleStartQuiz, handleToggleBookmark,
    retryHandler, submitCurrentTrainingQuestion,
  };
}
