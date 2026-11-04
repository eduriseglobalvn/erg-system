import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { PlayerLoadState } from "@/components/quiz/player-shell-runtime-model";
import { createEmptyAttempt, localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";

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

export type TimeUpPhase = "idle" | "submitting" | "waiting-network" | "failed";

/**
 * Auto-submits once when the deadline passes (testing mode only). Guarded by a ref keyed on the
 * attempt id so re-renders / StrictMode / refocus cannot double-fire; a failed offline submit
 * is retried when the browser comes back online (answers stay in the local session store).
 */
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
  const firedForRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<TimeUpPhase>("idle");
  const [retryTick, setRetryTick] = useState(0);

  const retry = useCallback(() => {
    firedForRef.current = null;
    setRetryTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (phase !== "waiting-network") return;
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [phase, retry]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || !timeUp || submitting || !activePackage || !activeSession) {
      return;
    }
    if (firedForRef.current === activeSession.attemptId) return;
    firedForRef.current = activeSession.attemptId;

    void (async () => {
      setPhase("submitting");
      setSubmitting(true);
      try {
        await submitReadyAttempt(activePackage, activeSession, activeAttempt);
        setPhase("idle");
      } catch (error) {
        const latestSession =
          (await localQuizAttemptStore.getSession(activeSession.assignmentId, activeSession.quizId, attemptScope)) ?? activeSession;
        const failedSession = await localQuizAttemptStore.markSubmitFailed(
          latestSession,
          error instanceof Error ? error.message : "Nộp bài không thành công.",
        );
        setSubmitError(error instanceof Error ? error.message : "Nộp bài không thành công. Vui lòng thử lại.");
        setPhase(typeof navigator !== "undefined" && !navigator.onLine ? "waiting-network" : "failed");
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
  }, [started, isTestingMode, attemptCompleted, timeUp, submitting, activePackage, activeSession, activeAttempt, attemptScope, submitReadyAttempt, retryTick, setLoadState, setSubmitError, setSubmitting]);

  return { phase: attemptCompleted ? ("idle" as const) : phase, retry };
}
