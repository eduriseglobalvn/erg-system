import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { type DraftSyncState } from "@/components/quiz/player-status";
import { type PlayerLoadState, type SubmitDialogMode } from "@/components/quiz/player-shell-runtime-model";
import { usePlayerDerivedState } from "@/components/quiz/player-shell-runtime/use-player-derived-state";
import { usePlayerActions } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-actions";
import { usePlayerKeyboard } from "@/components/quiz/player-shell-runtime/use-player-keyboard";
import { usePlayerLoadEffect } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-load-effect";
import { usePlayerSyncEffects } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-sync-effects";
import { useTimeUpSubmit } from "@/features/lcms/quiz/player/player-shell-runtime/use-time-up-submit";
import { useTrainingAdvanceEffects } from "@/components/quiz/player-shell-runtime/use-training-advance-effects";
import {
  useSaveAttemptAnswerMutation,
  useSaveAttemptDraftMutation,
  useSyncAttemptMutation,
  useQuizPackageQuery,
} from "@/features/lcms/quiz/quiz-runtime";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { AnswerPayload } from "@/domain/quiz/types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type { PlayerShellProps } from "./player-shell-props";

export type PlayerShortcuts = {
  pickOption?: (index: number) => void;
  toggleFlag?: () => void;
  focusGoTo?: () => void;
};

export function usePlayerRuntime({
  assignmentId,
  quizId,
  portablePackage,
  portableOffline = false,
  startImmediately = false,
  runtimePortal = "elearning",
  identityAccountId,
}: PlayerShellProps) {
  const resolvedQuizId = portablePackage?.quizId ?? quizId;
  const resolvedAssignmentId = assignmentId ?? (portablePackage ? `portable:${portablePackage.id}` : quizId);
  const isMobile = useIsMobile();
  const network = useOfflineShellStatus({ trackTelemetry: false });
  const queryClient = useQueryClient();
  const attemptScope = useMemo(() => {
    const viewer = getCurrentElearningViewerSession();
    return {
      accountId: identityAccountId ?? viewer?.id,
      portal: runtimePortal,
      tenantId: getDefaultTenantId(),
    };
  }, [identityAccountId, runtimePortal]);
  const [loadState, setLoadState] = useState<PlayerLoadState>({ status: "loading" });
  const quizPackageQuery = useQuizPackageQuery(portablePackage ? "" : quizId ?? "", runtimePortal);
  const [started, setStarted] = useState(startImmediately);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, AnswerPayload>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSync, setDraftSync] = useState<DraftSyncState>({ status: "idle" });
  const [submitDialogMode, setSubmitDialogMode] = useState<SubmitDialogMode | null>(null);
  const [reviewingSubmittedAttempt, setReviewingSubmittedAttempt] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [localRetryIndices, setLocalRetryIndices] = useState<number[] | null>(null);
  const questionBodyRef = useRef<HTMLDivElement | null>(null);
  // Filled by the ready view each render: option picking, flag and go-to need the current question and session.
  const shortcutsRef = useRef<PlayerShortcuts>({});
  const paceStateUpdate = usePacedStateBatch();
  const { mutateAsync: saveAttemptAnswerAsync } = useSaveAttemptAnswerMutation();
  const { mutateAsync: saveAttemptDraftAsync } = useSaveAttemptDraftMutation();
  const { mutateAsync: syncAttemptAsync } = useSyncAttemptMutation();

  usePlayerLoadEffect({
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
  });

  const {
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptExpired, currentAnswerComplete, deadlineAt, draftAnswer, isFirstQuestion, isLastQuestion, isTestingMode,
    isTrainingMode, lastResult, questions, reviewingAttempt, submitFailed, submitted,
  } = usePlayerDerivedState({ currentIndex, drafts, loadState, portableOffline, reviewingSubmittedAttempt, timeUp });

  const { beginAttempt, finalizeAttempt, requestSubmit, startLocalRetry, submitCurrentTrainingQuestion, submitReadyAttempt } = usePlayerActions({
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptExpired, attemptScope, drafts, isTrainingMode, portableOffline, queryClient, questions, runtimePortal,
    saveAttemptAnswerAsync, submitFailed, submitting,
    setCurrentIndex, setDrafts, setLoadState, setLocalRetryIndices, setReviewingSubmittedAttempt,
    setStarted, setSubmitDialogMode, setSubmitError, setSubmitting, setTimeUp,
  });

  usePlayerSyncEffects({
    activePackage, activeSession, attemptCompleted, attemptScope, drafts, networkOnline: network.online,
    runtimePortal, saveAttemptDraftAsync, started, syncAttemptAsync, setDraftSync,
  });

  const { phase: timeUpPhase, retry: retryTimeUpSubmit } = useTimeUpSubmit({
    activeAttempt, activePackage, activeSession, attemptCompleted, attemptScope, isTestingMode, started,
    submitReadyAttempt, submitting, timeUp, setLoadState, setSubmitDialogMode, setSubmitError, setSubmitting,
  });

  usePlayerKeyboard({
    allQuestionsAnswered, attemptExpired, attemptCompleted, beginAttempt, finalizeAttempt, isTestingMode,
    isTrainingMode, loadStatus: loadState.status, questionsLength: questions.length, requestSubmit,
    onPickOption: (index) => shortcutsRef.current.pickOption?.(index),
    onToggleFlag: () => shortcutsRef.current.toggleFlag?.(),
    focusGoTo: () => shortcutsRef.current.focusGoTo?.(),
    reviewingSubmittedAttempt, started, submitCurrentTrainingQuestion, submitDialogMode, submitFailed, submitting,
    setCurrentIndex,
  });

  useTrainingAdvanceEffects({ currentIndex, questionBodyRef, started });

  return {
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptScope, beginAttempt, currentAnswerComplete, currentIndex, deadlineAt, draftAnswer, draftSync, drafts, finalizeAttempt,
    isFirstQuestion, isLastQuestion, isMobile, localRetryIndices, setLocalRetryIndices, startLocalRetry, isTestingMode, isTrainingMode, lastResult, loadState, network, questionBodyRef,
    questions, quizPackageQuery, requestSubmit, retryTimeUpSubmit, reviewingAttempt, reviewingSubmittedAttempt,
    shortcutsRef, setCurrentIndex, setDrafts, setLoadState, setStarted, setSubmitDialogMode, setSubmitError, setTimeUp,
    setReviewingSubmittedAttempt, started, submitCurrentTrainingQuestion, submitDialogMode, submitError, submitFailed,
    submitted, submitting, timeUpPhase,
  };
}

export type PlayerRuntime = ReturnType<typeof usePlayerRuntime>;
