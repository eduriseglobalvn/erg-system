import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import { buildReconnectSignature, offlineAttemptScope } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import {
  replayOfflineQuizAttemptQueue,
  type useSaveAttemptDraftMutation,
  type useSyncAttemptMutation,
} from "@/features/lcms/quiz/quiz-runtime";
import type { DraftSyncState } from "@/components/quiz/player-status";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { AnswerPayload, QuizPackage } from "@/domain/quiz/types";

const DRAFT_SAVE_DEBOUNCE_MS = 5000;

export type UsePlayerSyncEffectsArgs = {
  activePackage: QuizPackage | null;
  activeSession: LocalQuizAttemptSession | null;
  attemptCompleted: boolean;
  attemptScope: { accountId?: string; portal: QuizRuntimePortal; tenantId: string };
  /** Moving to another question saves the draft right away. */
  currentIndex: number;
  drafts: Record<string, AnswerPayload>;
  networkOnline: boolean;
  runtimePortal: QuizRuntimePortal;
  saveAttemptDraftAsync: ReturnType<typeof useSaveAttemptDraftMutation>["mutateAsync"];
  started: boolean;
  syncAttemptAsync: ReturnType<typeof useSyncAttemptMutation>["mutateAsync"];
  /** Draft-sync status only; submit errors live in a separate state. */
  setDraftSync: Dispatch<SetStateAction<DraftSyncState>>;
};

/** Answers that differ from the last saved snapshot; a cleared answer is sent as null (the server removes it). */
function changedDraftAnswers(saved: Record<string, AnswerPayload>, drafts: Record<string, AnswerPayload>) {
  const changes: Record<string, AnswerPayload | null> = {};
  for (const [questionId, answer] of Object.entries(drafts)) {
    if (JSON.stringify(answer) !== JSON.stringify(saved[questionId])) changes[questionId] = answer;
  }
  for (const questionId of Object.keys(saved)) {
    if (!(questionId in drafts)) changes[questionId] = null;
  }
  return changes;
}

export function usePlayerSyncEffects(args: UsePlayerSyncEffectsArgs) {
  const {
    activePackage,
    activeSession,
    attemptCompleted,
    attemptScope,
    currentIndex,
    drafts,
    networkOnline,
    runtimePortal,
    started,
    syncAttemptAsync,
    setDraftSync,
  } = args;
  const lastReconnectSyncSignatureRef = useRef<string | null>(null);
  const previousOnlineRef = useRef(networkOnline);
  const latestArgsRef = useRef(args);
  // Answers the server confirmed for this attempt; only the difference is sent next time.
  const savedDraftRef = useRef<{ attemptId: string; answers: Record<string, AnswerPayload> } | null>(null);
  // Saves run one after another so an older PATCH can never land after a newer one.
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const previousIndexRef = useRef(currentIndex);

  useEffect(() => {
    latestArgsRef.current = args;
  });

  const saveDraftNow = useCallback(() => {
    saveChainRef.current = saveChainRef.current.then(async () => {
      const latest = latestArgsRef.current;
      const session = latest.activeSession;
      const quizPackage = latest.activePackage;
      if (!latest.started || !session?.serverStarted || !quizPackage || latest.attemptCompleted) return;
      if (savedDraftRef.current?.attemptId !== session.attemptId) {
        savedDraftRef.current = { attemptId: session.attemptId, answers: {} };
      }
      const saved = savedDraftRef.current;
      const changes = changedDraftAnswers(saved.answers, latest.drafts);
      if (Object.keys(changes).length === 0) return;

      latest.setDraftSync({ status: "saving" });
      try {
        // No client events here: saveDraft ignores them; they travel with the final submit.
        await latest.saveAttemptDraftAsync({
          attemptId: session.attemptId,
          payload: {
            answers: changes,
            packageHash: quizPackage.contentHash,
            quizVersion: quizPackage.quizVersion,
            client: {
              mode: quizPackage.quiz.settings.mode,
              source: "quiz-player",
              updatedAt: session.updatedAt,
            },
          },
          portal: latest.runtimePortal,
        });
        for (const [questionId, answer] of Object.entries(changes)) {
          if (answer === null) delete saved.answers[questionId];
          else saved.answers[questionId] = answer;
        }
        latest.setDraftSync({ status: "saved", savedAt: Date.now() });
      } catch (error) {
        // The snapshot stays as it was, so the next save resends these answers.
        latest.setDraftSync({ status: "local", error: error instanceof Error ? error.message : "Không thể đồng bộ nháp lên máy chủ." });
      }
    });
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(saveDraftNow, DRAFT_SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timerId);
    // Re-arms once the server attempt exists, so answers restored before that still reach the server.
  }, [drafts, started, activeSession?.serverStarted, saveDraftNow]);

  useEffect(() => {
    if (previousIndexRef.current === currentIndex) return;
    previousIndexRef.current = currentIndex;
    saveDraftNow();
  }, [currentIndex, saveDraftNow]);

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") saveDraftNow();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      saveDraftNow(); // leaving the player must not drop the last few seconds of typing
    };
  }, [saveDraftNow]);

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
        setDraftSync({ status: "local", error: error instanceof Error ? error.message : "Không thể đồng bộ lại bài làm sau khi có mạng." });
      });
    };

    const becameOnline = !previousOnlineRef.current && networkOnline;
    previousOnlineRef.current = networkOnline;
    if (becameOnline) replayAfterReconnect();
  }, [
    setDraftSync,
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
