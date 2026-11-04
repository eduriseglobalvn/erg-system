import { useMemo } from "react";

import type { PlayerLoadState } from "@/components/quiz/player-shell-runtime-model";
import { attemptDeadlineMs, serverNowMs } from "@/components/quiz/player-shell-utils";
import { createInitialAnswer, getAllQuestions, isAnswerComplete } from "@/domain/quiz/quiz";
import type { AnswerPayload } from "@/domain/quiz/types";

export function usePlayerDerivedState({
  currentIndex,
  drafts,
  loadState,
  portableOffline = false,
  reviewingSubmittedAttempt,
  timeUp,
}: {
  currentIndex: number;
  drafts: Record<string, AnswerPayload>;
  loadState: PlayerLoadState;
  portableOffline?: boolean;
  reviewingSubmittedAttempt: boolean;
  timeUp: boolean;
}) {
  const quizPackage = loadState.status === "ready" ? loadState.quizPackage : null;
  const session = loadState.status === "ready" ? loadState.session : null;
  const quiz = quizPackage?.quiz ?? null;
  const attempt = loadState.status === "ready" ? loadState.attempt : null;
  const questions = useMemo(() => (quiz ? getAllQuestions(quiz) : []), [quiz]);
  const currentQuestion = questions[currentIndex];

  const activeQuiz = quiz;
  const activeAttempt = attempt;
  const activePackage = quizPackage;
  const activeSession = session;
  const activeQuestion = currentQuestion ?? null;
  const submitFailed = activeSession?.status === "submit_failed";
  const isTrainingMode = activeQuiz?.settings.mode === "training";
  const isTestingMode = activeQuiz?.settings.mode === "testing";
  const attemptCompleted = Boolean(activeAttempt && activeAttempt.submittedCount === questions.length && questions.length > 0);
  const reviewingAttempt = attemptCompleted && reviewingSubmittedAttempt;
  const currentRecord = activeQuestion && activeAttempt ? activeAttempt.answers[activeQuestion.id] : undefined;
  const submitted = Boolean(currentRecord);
  const storedAnswer = activeQuestion ? currentRecord?.input ?? drafts[activeQuestion.id] : undefined;
  const draftAnswer = activeQuestion ? storedAnswer ?? createInitialAnswer(activeQuestion) : {};
  const currentAnswerComplete = activeQuestion ? isAnswerComplete(activeQuestion, drafts[activeQuestion.id]) : false;
  const allQuestionsAnswered = questions.every((question) =>
    isAnswerComplete(question, drafts[question.id]),
  );
  const lastResult = currentRecord?.result ?? null;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const testingDurationSeconds = Math.max(activeQuiz?.settings.timeLimitMinutes ?? 0, 0) * 60;
  const deadlineAt = isTestingMode && activeSession && (activeSession.serverStarted || portableOffline)
    ? attemptDeadlineMs(activeSession, testingDurationSeconds, portableOffline)
    : null;
  const attemptServerNowMs = activeSession ? serverNowMs(activeSession, undefined, portableOffline) : null;
  const attemptExpired = timeUp || (deadlineAt !== null && attemptServerNowMs !== null && attemptServerNowMs >= deadlineAt);

  return {
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptExpired, currentAnswerComplete, deadlineAt, draftAnswer, isFirstQuestion, isLastQuestion, isTestingMode,
    isTrainingMode, lastResult, questions, reviewingAttempt, submitFailed, submitted,
  };
}
