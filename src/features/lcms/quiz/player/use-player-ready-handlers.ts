import { areAnswerPayloadsEqual, firstUnansweredIndex } from "@/components/quiz/player-shell-utils";
import { createRuntimeKey, localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import type { LocalQuizAttemptSession } from "@/lib/quiz-runtime-types";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage } from "@/lib/types";
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
    attemptScope, beginAttempt, drafts, finalizeAttempt, isTrainingMode, questions, requestSubmit, started,
    setCurrentIndex, setDrafts, setLoadState, setReviewingSubmittedAttempt, setSubmitDialogMode, setSubmitError,
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
  const retryHandler = isTrainingMode && activeSession ? () => {
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

  function handleGoToUnanswered() {
    const index = firstUnansweredIndex(questions, drafts);
    if (index >= 0) setCurrentIndex(index);
    setSubmitDialogMode(null);
  }

  return {
    handleBackToList, handleDraftChange, handleFinalizeAttempt, handleGoToUnanswered, handleJumpToQuestion,
    handleRequestSubmit, handleReviewQuestion, handleReviewQuiz, handleStartQuiz, handleToggleBookmark,
    retryHandler, submitCurrentTrainingQuestion,
  };
}
