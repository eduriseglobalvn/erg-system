import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import { buildReconnectSignature, offlineAttemptScope } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import {
  replayOfflineQuizAttemptQueue,
  type useSaveAttemptDraftMutation,
  type useSyncAttemptMutation,
} from "@/features/lcms/quiz/quiz-runtime";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/lib/quiz-runtime-types";
import type { AnswerPayload, QuizPackage } from "@/lib/types";

export type UsePlayerSyncEffectsArgs = {
  activePackage: QuizPackage | null;
  activeSession: LocalQuizAttemptSession | null;
  attemptCompleted: boolean;
  attemptScope: { accountId?: string; portal: QuizRuntimePortal; tenantId: string };
  drafts: Record<string, AnswerPayload>;
  networkOnline: boolean;
  runtimePortal: QuizRuntimePortal;
  saveAttemptDraftAsync: ReturnType<typeof useSaveAttemptDraftMutation>["mutateAsync"];
  started: boolean;
  syncAttemptAsync: ReturnType<typeof useSyncAttemptMutation>["mutateAsync"];
  setSubmitError: Dispatch<SetStateAction<string | null>>;
};

export function usePlayerSyncEffects({
  activePackage,
  activeSession,
  attemptCompleted,
  attemptScope,
  drafts,
  networkOnline,
  runtimePortal,
  saveAttemptDraftAsync,
  started,
  syncAttemptAsync,
  setSubmitError,
}: UsePlayerSyncEffectsArgs) {
  const lastReconnectSyncSignatureRef = useRef<string | null>(null);
  const previousOnlineRef = useRef(networkOnline);

  useEffect(() => {
    if (!started || !activeSession?.serverStarted || !activePackage || attemptCompleted) {
      return;
    }

    const sessionSnapshot = activeSession;
    const packageSnapshot = activePackage;
    const answersSnapshot = { ...drafts };
    const syncTimerId = window.setTimeout(() => {
      void saveAttemptDraftAsync({
        attemptId: sessionSnapshot.attemptId,
        payload: {
          answers: answersSnapshot,
          packageHash: packageSnapshot.contentHash,
          quizVersion: packageSnapshot.quizVersion,
          events: sessionSnapshot.clientEvents,
          client: {
            mode: packageSnapshot.quiz.settings.mode,
            source: "quiz-player",
            updatedAt: sessionSnapshot.updatedAt,
          },
        },
        portal: runtimePortal,
      }).catch((error) => {
        setSubmitError(error instanceof Error ? error.message : "Không thể đồng bộ nháp lên máy chủ.");
      });
    }, 1500);

    return () => {
      window.clearTimeout(syncTimerId);
    };
  }, [
    setSubmitError,
    activePackage,
    activeSession,
    attemptCompleted,
    drafts,
    runtimePortal,
    saveAttemptDraftAsync,
    started,
  ]);

  useEffect(() => {
    if (!started || !activeSession?.serverStarted || !activePackage || attemptCompleted) {
      return;
    }

    const replayAfterReconnect = () => {
      const eventSignature = buildReconnectSignature(activeSession);
      if (lastReconnectSyncSignatureRef.current === eventSignature) {
        return;
      }
      lastReconnectSyncSignatureRef.current = eventSignature;

      void replayOfflineQuizAttemptQueue(offlineAttemptScope(attemptScope, runtimePortal), runtimePortal);
      void syncAttemptAsync({
        attemptId: activeSession.attemptId,
        payload: {
          packageHash: activePackage.contentHash,
          quizVersion: activePackage.quizVersion,
          attempt: {
            answers: activeSession.answers,
            status: activeSession.status,
            updatedAt: activeSession.updatedAt,
          },
          events: activeSession.clientEvents,
          client: {
            mode: activePackage.quiz.settings.mode,
            source: "quiz-player-reconnect",
            updatedAt: activeSession.updatedAt,
          },
        },
        portal: runtimePortal,
      }).catch((error) => {
        setSubmitError(error instanceof Error ? error.message : "Không thể đồng bộ lại bài làm sau khi có mạng.");
      });
    };

    const becameOnline = !previousOnlineRef.current && networkOnline;
    previousOnlineRef.current = networkOnline;
    if (becameOnline) replayAfterReconnect();
  }, [
    setSubmitError,
    activePackage,
    activeSession,
    attemptCompleted,
    attemptScope,
    runtimePortal,
    started,
    syncAttemptAsync,
    networkOnline,
  ]);
}
