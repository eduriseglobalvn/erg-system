import { useEffect, type Dispatch, type SetStateAction } from "react";

import type { PlayerLoadState } from "@/components/quiz/player-shell-runtime-model";
import { createEmptyAttempt, localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/lib/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/lib/types";

export type UseTimeUpSubmitArgs = {
  activeAttempt: Attempt | null;
  activePackage: QuizPackage | null;
  activeSession: LocalQuizAttemptSession | null;
  attemptCompleted: boolean;
  attemptScope: { accountId?: string; portal: QuizRuntimePortal; tenantId: string };
  isTestingMode: boolean;
  started: boolean;
  submitReadyAttempt: (
    readyPackage: QuizPackage,
    readySession: LocalQuizAttemptSession,
    currentAttempt: Attempt | null,
  ) => Promise<void>;
  submitting: boolean;
  timeUp: boolean;
  setLoadState: Dispatch<SetStateAction<PlayerLoadState>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
};

export function useTimeUpSubmit({
  activeAttempt,
  activePackage,
  activeSession,
  attemptCompleted,
  attemptScope,
  isTestingMode,
  started,
  submitReadyAttempt,
  submitting,
  timeUp,
  setLoadState,
  setSubmitError,
  setSubmitting,
}: UseTimeUpSubmitArgs) {
  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || !timeUp || submitting || !activePackage || !activeSession) {
      return;
    }

    void (async () => {
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
    })();
  }, [started, isTestingMode, attemptCompleted, timeUp, submitting, activePackage, activeSession, activeAttempt, attemptScope, submitReadyAttempt, setLoadState, setSubmitError, setSubmitting]);
}
