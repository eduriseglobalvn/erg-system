import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { QueryClient } from "@tanstack/react-query";

import {
  applyTrainingQuestionResult,
  isEventRecord,
  type PlayerLoadState,
  type SubmitDialogMode,
} from "@/components/quiz/player-shell-runtime-model";
import { offlineAttemptScope } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import { buildNormalizedAnswers, serverNowMs } from "@/components/quiz/player-shell-utils";
import { ensureServerAttempt } from "@/features/lcms/quiz/player/player-shell-session";
import {
  buildClientSubmitPayload,
  createEmptyAttempt,
  createRuntimeKey,
  getOfflineQuizSnapshot,
  gradeFinalAttemptLocally,
  localQuizAttemptStore,
  offlineQuizAttemptQueue,
  submitFinalAttempt,
  useSaveAttemptAnswerMutation,
} from "@/features/lcms/quiz/quiz-runtime";
import { createInitialAnswer, isAnswerComplete, normalizeAnswerForSubmission, scoreQuestion } from "@/domain/quiz/quiz";
import { quizReportQueryKeys } from "@/lib/quiz-report-query-keys";
import { getDefaultTenantId } from "@/lib/graphql-client";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage } from "@/domain/quiz/types";

export type UsePlayerActionsArgs = {
  activeAttempt: Attempt | null;
  activePackage: QuizPackage | null;
  activeQuestion: Question | null;
  activeQuiz: Quiz | null;
  activeSession: LocalQuizAttemptSession | null;
  allQuestionsAnswered: boolean;
  attemptCompleted: boolean;
  attemptExpired: boolean;
  attemptScope: { accountId?: string; portal: QuizRuntimePortal; tenantId: string };
  drafts: Record<string, AnswerPayload>;
  isTrainingMode: boolean;
  portableOffline: boolean;
  queryClient: QueryClient;
  questions: Question[];
  runtimePortal: QuizRuntimePortal;
  saveAttemptAnswerAsync: ReturnType<typeof useSaveAttemptAnswerMutation>["mutateAsync"];
  submitFailed: boolean;
  submitting: boolean;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setDrafts: Dispatch<SetStateAction<Record<string, AnswerPayload>>>;
  setLoadState: Dispatch<SetStateAction<PlayerLoadState>>;
  setRecentTrainingSubmitQuestionId: Dispatch<SetStateAction<string | null>>;
  setReviewingSubmittedAttempt: Dispatch<SetStateAction<boolean>>;
  setStarted: Dispatch<SetStateAction<boolean>>;
  setSubmitDialogMode: Dispatch<SetStateAction<SubmitDialogMode | null>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setTimeUp: Dispatch<SetStateAction<boolean>>;
};

export function usePlayerActions({
  activeAttempt,
  activePackage,
  activeQuestion,
  activeQuiz,
  activeSession,
  allQuestionsAnswered,
  attemptCompleted,
  attemptExpired,
  attemptScope,
  drafts,
  isTrainingMode,
  portableOffline,
  queryClient,
  questions,
  runtimePortal,
  saveAttemptAnswerAsync,
  submitFailed,
  submitting,
  setCurrentIndex,
  setDrafts,
  setLoadState,
  setRecentTrainingSubmitQuestionId,
  setReviewingSubmittedAttempt,
  setStarted,
  setSubmitDialogMode,
  setSubmitError,
  setSubmitting,
  setTimeUp,
}: UsePlayerActionsArgs) {
  const submitReadyAttempt = useCallback(async (
    readyPackage: QuizPackage,
    readySession: LocalQuizAttemptSession,
    currentAttempt: Attempt | null,
  ) => {
    if (portableOffline) {
      const submittedAt = new Date().toISOString();
      const answers = buildNormalizedAnswers(questions, drafts);
      const submittingSession = await localQuizAttemptStore.markSubmitting({
        ...readySession,
        answers,
      });
      const nextAttempt = gradeFinalAttemptLocally(readyPackage, readySession.attemptId, answers);
      const submittedSession = await localQuizAttemptStore.markSubmitted(
        { ...submittingSession, answers },
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
      return;
    }

    const serverSession = await ensureServerAttempt(readySession, readyPackage, runtimePortal);
    const submittedAt = new Date(serverNowMs(serverSession) ?? Date.now()).toISOString();
    const answers = buildNormalizedAnswers(questions, drafts);
    const submittingSession = await localQuizAttemptStore.markSubmitting({
      ...serverSession,
      answers,
    });

    setLoadState({
      status: "ready",
      attempt: currentAttempt ? { ...currentAttempt, id: serverSession.attemptId } : createEmptyAttempt(readyPackage, serverSession.attemptId),
      quizPackage: readyPackage,
      restored: false,
      session: submittingSession,
    });

    const payload = buildClientSubmitPayload({
      answers,
      attemptId: serverSession.attemptId,
      clientEvents: submittingSession.clientEvents,
      quizPackage: readyPackage,
      startedAt: serverSession.startedAt,
      submittedAt,
    });

    const nextAttempt = await submitFinalAttempt({
      attemptId: serverSession.attemptId,
      idempotencyKey: serverSession.submitIdempotencyKey,
      payload,
      portal: runtimePortal,
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
    const tenantId = getDefaultTenantId();
    void queryClient.invalidateQueries({ queryKey: quizReportQueryKeys.assignmentReport(serverSession.assignmentId, tenantId) });
    void queryClient.invalidateQueries({ queryKey: quizReportQueryKeys.reportTenantRoot(tenantId) });
    setReviewingSubmittedAttempt(false);
    setCurrentIndex(0);
  }, [drafts, portableOffline, queryClient, questions, runtimePortal, setCurrentIndex, setDrafts, setLoadState, setReviewingSubmittedAttempt, setSubmitError]);

  const beginAttempt = useCallback(async (nextIndex?: number) => {
    if (!activePackage || !activeSession || !activeAttempt) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const startedSession = portableOffline
        ? activeSession
        : await ensureServerAttempt(activeSession, activePackage, runtimePortal);
      setLoadState({
        status: "ready",
        attempt: { ...activeAttempt, id: startedSession.attemptId },
        quizPackage: activePackage,
        restored: false,
        session: startedSession,
      });
      setStarted(true);
      setTimeUp(false);
      if (typeof nextIndex === "number") {
        setCurrentIndex(nextIndex);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể bắt đầu lượt làm. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [activeAttempt, activePackage, activeSession, portableOffline, runtimePortal, setCurrentIndex, setLoadState, setStarted, setSubmitError, setSubmitting, setTimeUp]);

  const submitCurrentTrainingQuestion = useCallback(async () => {
    if (
      !activePackage ||
      !activeSession ||
      !activeAttempt ||
      !activeQuestion ||
      !activeQuiz ||
      !isTrainingMode ||
      submitting ||
      attemptCompleted ||
      activeAttempt.answers[activeQuestion.id]
    ) {
      return;
    }

    const currentDraft = drafts[activeQuestion.id] ?? createInitialAnswer(activeQuestion);
    if (!isAnswerComplete(activeQuestion, currentDraft)) {
      return;
    }

    const normalizedAnswer = normalizeAnswerForSubmission(activeQuestion, currentDraft);
    const result = scoreQuestion(activeQuestion, normalizedAnswer);
    const nextAttempt = applyTrainingQuestionResult({
      answer: normalizedAnswer,
      attempt: activeAttempt,
      question: activeQuestion,
      questions,
      result,
      quiz: activeQuiz,
    });
    const now = new Date().toISOString();
    const nextSession: LocalQuizAttemptSession = {
      ...activeSession,
      answers: {
        ...activeSession.answers,
        [activeQuestion.id]: normalizedAnswer,
      },
      clientEvents: [
        ...activeSession.clientEvents,
        {
          id: createRuntimeKey("evt"),
          type: "answer_graded",
          createdAt: now,
          questionId: activeQuestion.id,
        },
      ],
      status: activeSession.status === "submit_failed" ? "in_progress" : activeSession.status,
      updatedAt: now,
    };

    setDrafts(nextSession.answers);
    setSubmitError(null);
    setLoadState({
      status: "ready",
      attempt: nextAttempt,
      quizPackage: activePackage,
      restored: false,
      session: nextSession,
    });
    setRecentTrainingSubmitQuestionId(activeQuestion.id);
    await localQuizAttemptStore.saveSession(nextSession);
    if (portableOffline) {
      return;
    }
    try {
      await saveAttemptAnswerAsync({
        attemptId: nextSession.attemptId,
        payload: {
          answer: normalizedAnswer,
          answeredAt: now,
          clientResult: result,
        },
        portal: runtimePortal,
        questionId: activeQuestion.id,
      });
    } catch (error) {
      void (async () => {
        const capability = await getOfflineQuizSnapshot({
          scope: offlineAttemptScope(attemptScope, runtimePortal),
          assignmentId: nextSession.assignmentId,
          quizId: nextSession.quizId,
          attemptId: nextSession.attemptId,
        });
        const latestEvent = nextSession.clientEvents.at(-1);
        const eventId = isEventRecord(latestEvent) && typeof latestEvent.id === "string" ? latestEvent.id : null;
        if (!capability || !eventId) return;
        const queued = await offlineQuizAttemptQueue.enqueue({
          scope: offlineAttemptScope(attemptScope, runtimePortal),
          capability,
          packageHash: activePackage.contentHash,
          quizVersion: activePackage.quizVersion,
          attempt: {
            answers: nextSession.answers,
            status: nextSession.status,
            updatedAt: nextSession.updatedAt,
          },
          event: { ...latestEvent, id: eventId },
          client: { source: "quiz-player-offline-training", mode: activePackage.quiz.settings.mode },
        });
        if (queued.status === "queued") {
          setSubmitError("Mất kết nối. Câu trả lời đã được lưu an toàn và sẽ đồng bộ khi có mạng.");
        }
      })();
      setSubmitError(error instanceof Error ? error.message : "Không thể đồng bộ câu trả lời lên máy chủ.");
    }
  }, [
    setDrafts,
    setLoadState,
    setRecentTrainingSubmitQuestionId,
    setSubmitError,
    activeAttempt,
    activePackage,
    activeQuestion,
    activeQuiz,
    activeSession,
    attemptCompleted,
    attemptScope,
    drafts,
    isTrainingMode,
    portableOffline,
    questions,
    runtimePortal,
    saveAttemptAnswerAsync,
    submitting,
  ]);

  const finalizeAttempt = useCallback(async () => {
    if (!activePackage || !activeSession) {
      return;
    }

    setSubmitDialogMode(null);
    setSubmitting(true);
    try {
      await submitReadyAttempt(activePackage, activeSession, activeAttempt);
    } catch (error) {
      const latestSession =
        (await localQuizAttemptStore.getSession(activeSession.assignmentId, activeSession.quizId, attemptScope)) ?? activeSession;
      const failedSession = await localQuizAttemptStore.markSubmitFailed(
        latestSession,
        error instanceof Error ? error.message : "Nộp bài không thành công.",
      );
      setSubmitError(error instanceof Error ? error.message : "Nộp bài không thành công. Vui lòng thử lại.");
      setLoadState({
        status: "ready",
        attempt: activeAttempt ? { ...activeAttempt, id: latestSession.attemptId } : createEmptyAttempt(activePackage, latestSession.attemptId),
        quizPackage: activePackage,
        restored: false,
        session: failedSession,
      });
    } finally {
      setSubmitting(false);
    }
  }, [activeAttempt, activePackage, activeSession, attemptScope, submitReadyAttempt, setLoadState, setSubmitDialogMode, setSubmitError, setSubmitting]);

  const requestSubmit = useCallback(() => {
    if (attemptExpired && !submitFailed) {
      setSubmitError("Bài làm đã hết thời gian theo đồng hồ máy chủ.");
      return;
    }

    setSubmitDialogMode(allQuestionsAnswered ? "all-answered" : "confirm");
  }, [allQuestionsAnswered, attemptExpired, submitFailed, setSubmitDialogMode, setSubmitError]);

  return { beginAttempt, finalizeAttempt, requestSubmit, submitCurrentTrainingQuestion, submitReadyAttempt };
}
