import { useEffect, type Dispatch, type SetStateAction } from "react";

import { createFreshLocalSession } from "@/features/lcms/quiz/player/player-shell-session";
import type { PlayerLoadState, SubmitDialogMode } from "@/components/quiz/player-shell-runtime-model";
import {
  createEmptyAttempt,
  getOfflineQuizSnapshot,
  gradeFinalAttemptLocally,
  localQuizAttemptStore,
  prepareQuizPackageForAttempt,
  type useQuizPackageQuery,
} from "@/features/lcms/quiz/quiz-runtime";
import type { QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { AnswerPayload, QuizPackage } from "@/domain/quiz/types";

type AttemptScope = { accountId?: string; portal: QuizRuntimePortal; tenantId: string };

export type UsePlayerLoadEffectArgs = {
  attemptScope: AttemptScope;
  paceStateUpdate: (update: () => void) => void;
  runtimePortal: QuizRuntimePortal;
  portablePackage: QuizPackage | undefined;
  resolvedQuizId: string | undefined;
  resolvedAssignmentId: string | undefined;
  startImmediately: boolean;
  quizPackageQuery: ReturnType<typeof useQuizPackageQuery>;
  setLoadState: Dispatch<SetStateAction<PlayerLoadState>>;
  setStarted: Dispatch<SetStateAction<boolean>>;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setDrafts: Dispatch<SetStateAction<Record<string, AnswerPayload>>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  setSubmitDialogMode: Dispatch<SetStateAction<SubmitDialogMode | null>>;
  setReviewingSubmittedAttempt: Dispatch<SetStateAction<boolean>>;
  setTimeUp: Dispatch<SetStateAction<boolean>>;
};

export function usePlayerLoadEffect({
  attemptScope,
  paceStateUpdate,
  runtimePortal,
  portablePackage,
  resolvedQuizId,
  resolvedAssignmentId,
  startImmediately,
  quizPackageQuery,
  setLoadState,
  setStarted,
  setCurrentIndex,
  setDrafts,
  setSubmitting,
  setSubmitError,
  setSubmitDialogMode,
  setReviewingSubmittedAttempt,
  setTimeUp,
}: UsePlayerLoadEffectArgs) {
  useEffect(() => {
    let cancelled = false;

    if (!resolvedQuizId || !resolvedAssignmentId) {
      setLoadState({ status: "error", message: "Assessment identity is unavailable for this assignment." });
      return () => {
        cancelled = true;
      };
    }

    if (quizPackageQuery.isPending) {
      setLoadState({ status: "loading" });
      return () => {
        cancelled = true;
      };
    }

    paceStateUpdate(() => {
      if (cancelled) {
        return;
      }

      setLoadState({ status: "loading" });
      setStarted(startImmediately);
      setCurrentIndex(0);
      setDrafts({});
      setSubmitting(false);
      setSubmitError(null);
      setSubmitDialogMode(null);
      setReviewingSubmittedAttempt(false);
      setTimeUp(false);
    });

    async function load() {
      try {
        if (!resolvedAssignmentId || !resolvedQuizId) {
          throw new Error("Assessment identity is unavailable for this assignment.");
        }

        const storedSession = await localQuizAttemptStore.getSession(resolvedAssignmentId, resolvedQuizId, attemptScope);
        const queryResult = portablePackage ?? quizPackageQuery.data;
        let quizPackage = queryResult;
        if (!quizPackage && storedSession) {
          const offlineSnapshot = await getOfflineQuizSnapshot({
            scope: {
              accountId: attemptScope.accountId ?? "",
              tenantId: attemptScope.tenantId ?? "",
              workspace: attemptScope.portal ?? runtimePortal,
            },
            assignmentId: resolvedAssignmentId,
            quizId: resolvedQuizId,
            attemptId: storedSession.attemptId,
          });
          quizPackage = offlineSnapshot?.quizPackage;
        }
        if (!quizPackage) {
          throw quizPackageQuery.error ?? new Error("Quiz package is not available offline. Please reconnect to continue.");
        }
        const reusableSession =
          storedSession &&
          storedSession.packageHash === quizPackage.contentHash &&
          storedSession.quizVersion === quizPackage.quizVersion
            ? storedSession
            : null;

        const session = reusableSession ?? (await createFreshLocalSession(resolvedAssignmentId, quizPackage, attemptScope));
        const playablePackage = prepareQuizPackageForAttempt(
          quizPackage,
          session.shuffleSeed ?? session.attemptId,
        );
        const attempt =
          session.status === "submitted"
            ? gradeFinalAttemptLocally(playablePackage, session.attemptId, session.answers)
            : createEmptyAttempt(playablePackage, session.attemptId);

        if (cancelled) {
          return;
        }

        setDrafts(session.answers);
        setStarted(startImmediately || session.status === "submitted");
        setReviewingSubmittedAttempt(false);
        setLoadState({
          status: "ready",
          attempt,
          quizPackage: playablePackage,
          restored: Boolean(reusableSession && Object.keys(reusableSession.answers).length > 0),
          session,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "Không thể tải bài làm.",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    setCurrentIndex,
    setDrafts,
    setLoadState,
    setReviewingSubmittedAttempt,
    setStarted,
    setSubmitDialogMode,
    setSubmitError,
    setSubmitting,
    setTimeUp,
    attemptScope,
    paceStateUpdate,
    runtimePortal,
    portablePackage,
    resolvedQuizId,
    quizPackageQuery.data,
    quizPackageQuery.error,
    quizPackageQuery.isPending,
    resolvedAssignmentId,
    startImmediately,
  ]);
}
