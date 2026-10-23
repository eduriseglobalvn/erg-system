import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flag } from "lucide-react";

import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import {
  AnswerKeyCard,
  FinalResultScreen,
  QuestionFeedbackPanel,
  SubmitConfirmDialog,
} from "@/components/quiz/player-shell-parts";
import { QuestionNavigator } from "@/components/quiz/question-navigator";
import {
  areAnswerPayloadsEqual,
  attemptDeadlineMs,
  buildNormalizedAnswers,
  createFreshLocalSession,
  ensureServerAttempt,
  formatTimer,
  questionLabel,
  serverNowMs,
} from "@/components/quiz/player-shell-utils";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuizWelcomeScreen, type QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import {
  applyTrainingQuestionResult,
  defaultResultDisplay,
  isEditableKeyboardTarget,
  isEventRecord,
  type PlayerLoadState,
  type SubmitDialogMode,
} from "@/components/quiz/player-shell-runtime-model";
import Skeleton from "@mui/material/Skeleton";
import {
  buildClientSubmitPayload,
  createEmptyAttempt,
  createRuntimeKey,
  gradeFinalAttemptLocally,
  localQuizAttemptStore,
  getOfflineQuizSnapshot,
  offlineQuizAttemptQueue,
  replayOfflineQuizAttemptQueue,
  prepareQuizPackageForAttempt,
  submitFinalAttempt,
  useSaveAttemptAnswerMutation,
  useSaveAttemptDraftMutation,
  useSyncAttemptMutation,
  useQuizPackageQuery,
} from "@/features/lcms/quiz/quiz-runtime";
import { quizReportQueryKeys } from "@/features/lcms/quiz/quiz-reports";
import { createInitialAnswer, getAllQuestions, isAnswerComplete, normalizeAnswerForSubmission, scoreQuestion } from "@/lib/quiz";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage, QuizResultDisplay } from "@/lib/types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";

const navButtonClass =
  "inline-flex min-h-9 min-w-[108px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-4 text-xs font-extrabold text-white shadow-[0_12px_26px_rgba(0,0,136,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,136,0.22)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";
const secondaryButtonClass =
  "inline-flex min-h-9 min-w-[108px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-xs font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";
const playerViewportClass = "lg:h-[calc(100vh-3.75rem)]";

function offlineAttemptScope(scope: { accountId?: string | null; tenantId?: string | null; portal?: QuizRuntimePortal | null }, runtimePortal: QuizRuntimePortal) {
  return {
    accountId: scope.accountId ?? "",
    tenantId: scope.tenantId ?? "",
    workspace: scope.portal ?? runtimePortal,
  };
}

export type PlayerShellProps = {
  assignmentId?: string;
  quizId?: string;
  /** A verified .ergquiz package can use this same player without a second UI. */
  portablePackage?: QuizPackage;
  /** Portable packages may run without an online attempt endpoint. */
  portableOffline?: boolean;
  /** Question-only artifacts bypass the course welcome surface. */
  startImmediately?: boolean;
  runtimePortal?: QuizRuntimePortal;
  welcomeMeta?: QuizWelcomeMeta;
};

export function PlayerShellRuntime({
  assignmentId,
  quizId,
  portablePackage,
  portableOffline = false,
  startImmediately = false,
  runtimePortal = "elearning",
  welcomeMeta,
}: PlayerShellProps) {
  const resolvedQuizId = portablePackage?.quizId ?? quizId;
  const resolvedAssignmentId = assignmentId ?? (portablePackage ? `portable:${portablePackage.id}` : quizId);
  const isMobile = useIsMobile();
  const network = useOfflineShellStatus({ trackTelemetry: false });
  const queryClient = useQueryClient();
  const attemptScope = useMemo(() => {
    const viewer = getCurrentElearningViewerSession();
    return {
      accountId: viewer?.id,
      portal: runtimePortal,
      tenantId: getDefaultTenantId(),
    };
  }, [runtimePortal]);
  const [loadState, setLoadState] = useState<PlayerLoadState>({ status: "loading" });
  const quizPackageQuery = useQuizPackageQuery(portablePackage ? "" : quizId ?? "", runtimePortal);
  const [started, setStarted] = useState(startImmediately);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, AnswerPayload>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [submitDialogMode, setSubmitDialogMode] = useState<SubmitDialogMode | null>(null);
  const [reviewingSubmittedAttempt, setReviewingSubmittedAttempt] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [recentTrainingSubmitQuestionId, setRecentTrainingSubmitQuestionId] = useState<string | null>(null);
  const questionBodyRef = useRef<HTMLDivElement | null>(null);
  const lastReconnectSyncSignatureRef = useRef<string | null>(null);
  const previousOnlineRef = useRef(network.online);
  const paceStateUpdate = usePacedStateBatch();
  const { mutateAsync: saveAttemptAnswerAsync } = useSaveAttemptAnswerMutation();
  const { mutateAsync: saveAttemptDraftAsync } = useSaveAttemptDraftMutation();
  const { mutateAsync: syncAttemptAsync } = useSyncAttemptMutation();

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
      setSidebarQuery("");
      setSubmitDialogMode(null);
      setReviewingSubmittedAttempt(false);
      setRemainingSeconds(null);
      setRecentTrainingSubmitQuestionId(null);
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
  const deadlineAt = isTestingMode && activeSession?.serverStarted
    ? attemptDeadlineMs(activeSession, testingDurationSeconds)
    : null;
  const attemptServerNowMs = activeSession ? serverNowMs(activeSession) : null;
  const attemptExpired = deadlineAt !== null && attemptServerNowMs !== null && attemptServerNowMs >= deadlineAt;

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
  }, [drafts, portableOffline, queryClient, questions, runtimePortal]);

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
      setRemainingSeconds(null);
      if (typeof nextIndex === "number") {
        setCurrentIndex(nextIndex);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể bắt đầu lượt làm. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [activeAttempt, activePackage, activeSession, portableOffline, runtimePortal]);

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
  }, [activeAttempt, activePackage, activeSession, attemptScope, submitReadyAttempt]);

  const requestSubmit = useCallback(() => {
    if (isTestingMode && !allQuestionsAnswered && !submitFailed) {
      return;
    }

    if (attemptExpired && !submitFailed) {
      setSubmitError("Bài làm đã hết thời gian theo đồng hồ máy chủ.");
      return;
    }

    setSubmitDialogMode(allQuestionsAnswered ? "all-answered" : "confirm");
  }, [allQuestionsAnswered, attemptExpired, isTestingMode, submitFailed]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || deadlineAt === null || !activeSession) {
      return;
    }

    const tick = () => {
      const currentServerNowMs = serverNowMs(activeSession);
      if (currentServerNowMs === null) {
        setRemainingSeconds(null);
        return;
      }
      const nextRemaining = Math.max(0, Math.ceil((deadlineAt - currentServerNowMs) / 1000));
      setRemainingSeconds(nextRemaining);
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [activeSession, started, isTestingMode, attemptCompleted, deadlineAt]);

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
      const lastEvent = activeSession.clientEvents.at(-1);
      const eventSignature = `${activeSession.attemptId}:${activeSession.clientEvents.length}:${String(
        isEventRecord(lastEvent) ? lastEvent.id : "",
      )}`;
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

    const becameOnline = !previousOnlineRef.current && network.online;
    previousOnlineRef.current = network.online;
    if (becameOnline) replayAfterReconnect();
  }, [
    activePackage,
    activeSession,
    attemptCompleted,
    attemptScope,
    runtimePortal,
    started,
    syncAttemptAsync,
    network.online,
  ]);

  useEffect(() => {
    if (!started || !isTestingMode || attemptCompleted || remainingSeconds !== 0 || submitting || !activePackage || !activeSession) {
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
  }, [started, isTestingMode, attemptCompleted, remainingSeconds, submitting, activePackage, activeSession, activeAttempt, attemptScope, submitReadyAttempt]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (isEditableKeyboardTarget(event.target, event.key)) {
        return;
      }

      if (submitDialogMode) {
        if (event.key === "Enter") {
          event.preventDefault();
          void finalizeAttempt();
        }
        return;
      }

      if (!started) {
        if (event.key === "Enter" && loadState.status === "ready") {
          event.preventDefault();
          void beginAttempt();
        }
        return;
      }

      if (attemptCompleted || reviewingSubmittedAttempt || submitting) {
        return;
      }

      if (isTestingMode) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setCurrentIndex((value) => Math.max(0, value - 1));
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
          return;
        }

        if (event.key === "Enter" && (allQuestionsAnswered || submitFailed)) {
          event.preventDefault();
          requestSubmit();
        }
        return;
      }

      if (isTrainingMode && event.key === "Enter") {
        event.preventDefault();
        void submitCurrentTrainingQuestion();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    allQuestionsAnswered,
    attemptExpired,
    attemptCompleted,
    beginAttempt,
    finalizeAttempt,
    isTestingMode,
    isTrainingMode,
    loadState.status,
    questions.length,
    requestSubmit,
    reviewingSubmittedAttempt,
    started,
    submitCurrentTrainingQuestion,
    submitDialogMode,
    submitFailed,
    submitting,
  ]);

  useEffect(() => {
    if (!started) {
      return;
    }

    questionBodyRef.current?.scrollTo({ top: 0 });
  }, [currentIndex, started]);

  useEffect(() => {
    if (recentTrainingSubmitQuestionId && activeQuestion && recentTrainingSubmitQuestionId !== activeQuestion.id) {
      paceStateUpdate(() => setRecentTrainingSubmitQuestionId(null));
    }
  }, [activeQuestion, paceStateUpdate, recentTrainingSubmitQuestionId]);

  useEffect(() => {
    if (
      !started ||
      !isTrainingMode ||
      !activeQuestion ||
      !lastResult ||
      recentTrainingSubmitQuestionId !== activeQuestion.id ||
      attemptCompleted
    ) {
      return;
    }

    const nextQuestionTimerId = window.setTimeout(() => {
      if (!isLastQuestion) {
        questionBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
        setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
        window.requestAnimationFrame(() => {
          questionBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
        });
      }
      setRecentTrainingSubmitQuestionId(null);
    }, 1000);

    return () => {
      window.clearTimeout(nextQuestionTimerId);
    };
  }, [
    activeQuestion,
    attemptCompleted,
    isLastQuestion,
    isTrainingMode,
    lastResult,
    questions.length,
    recentTrainingSubmitQuestionId,
    started,
  ]);

  if (loadState.status === "loading") {
    return (
      <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Skeleton variant="rounded" className="h-8 w-48" />
          <Skeleton variant="rounded" className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton variant="rounded" className="h-72 w-full rounded-lg" />
        <div className="grid gap-3 md:grid-cols-4">
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (loadState.status === "error" || !activeQuiz || !activeAttempt || !activePackage || !activeSession || !activeQuestion) {
    return (
      <div className="grid gap-4 rounded-lg border border-red-100 bg-white p-8 text-red-600 shadow-sm">
        <p>{loadState.status === "error" ? loadState.message : "Không thể mở bài làm."}</p>
        <button
          type="button"
          className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void quizPackageQuery.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const readyQuiz: Quiz = activeQuiz;
  const readyAttempt: Attempt = activeAttempt;
  const readyPackage: QuizPackage = activePackage;
  const readyQuestion: Question = activeQuestion;
  const readySession: LocalQuizAttemptSession = activeSession;
  const resultDisplay: QuizResultDisplay = { ...defaultResultDisplay, ...(readyQuiz.result ?? {}) };
  const answeredCount = questions.filter((question) => isAnswerComplete(question, drafts[question.id])).length;
  const restoredDraft = loadState.status === "ready" && loadState.restored;
  const bookmarkedQuestionIds = readySession.bookmarkedQuestionIds;
  const isCurrentQuestionBookmarked = bookmarkedQuestionIds.includes(readyQuestion.id);
  const answeredQuestionIds = questions
    .filter((question) => isAnswerComplete(question, drafts[question.id]))
    .map((question) => question.id);

  const playerCardStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const canvasStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const headerStyle = {
    background: "var(--quiz-header-bg)",
    color: "var(--quiz-header-text)",
  };
  const accentButtonStyle = {
    backgroundColor: "#000088",
    boxShadow: "0 10px 24px rgba(0,0,136,0.18)",
  };
  const secondaryButtonStyle = {
    borderColor: "rgba(0,0,136,0.18)",
    backgroundColor: "rgba(255,255,255,0.72)",
    color: "#000088",
  };
  const modeBadgeStyle = isTrainingMode
    ? {
        backgroundColor: "rgba(0,0,136,0.08)",
        color: "#000088",
      }
    : {
        backgroundColor: "rgba(232,40,40,0.10)",
        color: "#b91c1c",
      };
  const testingTimerTone =
    remainingSeconds !== null && remainingSeconds <= 60
      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
      : "bg-slate-100 text-slate-700";

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

  const footerMessage = reviewingAttempt
    ? "Đang xem lại kết quả. Màu xanh là đáp án đúng, màu đỏ/cam là câu trả lời cần sửa."
    : submitFailed
      ? "Nộp bài chưa thành công. Câu trả lời vẫn được lưu trên thiết bị này, bạn có thể thử lại."
      : allQuestionsAnswered
        ? "Tất cả câu hỏi đã có câu trả lời. Bạn có thể nộp bài."
        : isTrainingMode
          ? "Chọn đáp án rồi bấm Nộp bài cho từng câu. Có thể dùng mục lục để chuyển câu."
          : "Dùng Quay lại / Tiếp theo để rà soát bài trước khi nộp.";

  const questionBody = (
    <>
      <QuestionRenderer
        key={readyQuestion.id}
        question={readyQuestion}
        value={draftAnswer}
        onChange={handleDraftChange}
        submitted={submitted}
        reviewMode={submitted}
        result={lastResult}
      />

      {submitted && readyQuestion.kind === "hotspot" ? <AnswerKeyCard question={readyQuestion} /> : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

    </>
  );

  function renderSidebar() {
    return (
      <QuestionNavigator
        answeredQuestionIds={answeredQuestionIds}
        className={playerViewportClass}
        currentIndex={currentIndex}
        flaggedQuestionIds={bookmarkedQuestionIds}
        introSubtitle={readyQuiz.subtitle}
        onIntroClick={() => setStarted(false)}
        onJumpToQuestion={handleJumpToQuestion}
        onQueryChange={setSidebarQuery}
        query={sidebarQuery}
        questions={questions}
        showIntro={!started}
        started={started}
        style={playerCardStyle}
      />
    );
  }

  if (!started) {
    if (isMobile) {
      return (
        <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell">
          <MobilePlayerShell
            allQuestionsAnswered={allQuestionsAnswered}
            answeredCount={answeredCount}
            answeredQuestionIds={answeredQuestionIds}
            attemptCompleted={attemptCompleted}
            bookmarkCount={bookmarkedQuestionIds.length}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
            currentIndex={currentIndex}
            footerMessage={footerMessage}
            isBookmarked={isCurrentQuestionBookmarked}
            isFirstQuestion={isFirstQuestion}
            isLastQuestion={isLastQuestion}
            isTestingMode={isTestingMode}
            isTrainingMode={isTrainingMode}
            currentAnswerComplete={currentAnswerComplete}
            currentQuestionSubmitted={submitted}
            playerCardStyle={playerCardStyle}
            canvasStyle={canvasStyle}
            headerStyle={headerStyle}
            accentButtonStyle={accentButtonStyle}
            secondaryButtonStyle={secondaryButtonStyle}
            modeBadgeStyle={modeBadgeStyle}
            question={readyQuestion}
            questions={questions}
            quiz={readyQuiz}
            resultDisplay={resultDisplay}
            reviewingSubmittedAttempt={reviewingSubmittedAttempt}
            started={started}
            submitting={submitting}
            submitFailed={submitFailed}
            remainingSeconds={remainingSeconds}
            onJumpToQuestion={handleJumpToQuestion}
            onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
            onPrev={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            onRequestSubmit={handleRequestSubmit}
            onReview={handleReviewQuiz}
            onStart={handleStartQuiz}
            onSubmitCurrentQuestion={() => void submitCurrentTrainingQuestion()}
            onToggleBookmark={() => void handleToggleBookmark()}
            body={questionBody}
            resultBody={<FinalResultScreen attempt={readyAttempt} resultDisplay={resultDisplay} onReview={handleReviewQuiz} />}
          />
        </QuizThemeSurface>
      );
    }

    return (
      <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell grid gap-3 lg:grid-cols-[minmax(0,1fr)_192px]">
        <QuizWelcomeScreen
          accentButtonStyle={accentButtonStyle}
          answeredCount={answeredCount}
          canvasStyle={canvasStyle}
          isTestingMode={isTestingMode}
          isTrainingMode={isTrainingMode}
          modeBadgeStyle={modeBadgeStyle}
          navButtonClass={navButtonClass}
          onStart={handleStartQuiz}
          playerCardStyle={playerCardStyle}
          playerViewportClass={playerViewportClass}
          questions={questions}
          quiz={readyQuiz}
          restoredDraft={restoredDraft}
          welcomeMeta={welcomeMeta}
        />

        {renderSidebar()}
      </QuizThemeSurface>
    );
  }

  if (isMobile) {
    return (
      <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell">
        <MobilePlayerShell
          allQuestionsAnswered={allQuestionsAnswered}
          answeredCount={answeredCount}
          answeredQuestionIds={answeredQuestionIds}
          attemptCompleted={attemptCompleted}
          bookmarkCount={bookmarkedQuestionIds.length}
          bookmarkedQuestionIds={bookmarkedQuestionIds}
          currentIndex={currentIndex}
          footerMessage={footerMessage}
          isBookmarked={isCurrentQuestionBookmarked}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          isTestingMode={isTestingMode}
          isTrainingMode={isTrainingMode}
          currentAnswerComplete={currentAnswerComplete}
          currentQuestionSubmitted={submitted}
          playerCardStyle={playerCardStyle}
          canvasStyle={canvasStyle}
          headerStyle={headerStyle}
          accentButtonStyle={accentButtonStyle}
          secondaryButtonStyle={secondaryButtonStyle}
          modeBadgeStyle={modeBadgeStyle}
          question={readyQuestion}
          questions={questions}
          quiz={readyQuiz}
          resultDisplay={resultDisplay}
          reviewingSubmittedAttempt={reviewingSubmittedAttempt}
          started={started}
          submitting={submitting}
          submitFailed={submitFailed}
          remainingSeconds={remainingSeconds}
          onJumpToQuestion={handleJumpToQuestion}
          onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
          onPrev={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          onRequestSubmit={handleRequestSubmit}
          onReview={handleReviewQuiz}
          onStart={handleStartQuiz}
          onSubmitCurrentQuestion={() => void submitCurrentTrainingQuestion()}
          onToggleBookmark={() => void handleToggleBookmark()}
          body={questionBody}
          resultBody={<FinalResultScreen attempt={readyAttempt} resultDisplay={resultDisplay} onReview={handleReviewQuiz} />}
        />
        {submitDialogMode ? (
          <SubmitConfirmDialog
            mode={submitDialogMode}
            resultDisplay={resultDisplay}
            submitting={submitting}
            onCancel={() => setSubmitDialogMode(null)}
            onConfirm={() => void handleFinalizeAttempt()}
          />
        ) : null}
      </QuizThemeSurface>
    );
  }

  return (
    <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell grid gap-3 lg:grid-cols-[minmax(0,1fr)_192px]">
      <section
        className={`flex min-w-0 flex-col rounded-[18px] border border-[rgba(145,158,171,0.16)] bg-white p-1.5 shadow-[0_18px_45px_rgba(28,37,46,0.08)] sm:p-2 ${playerViewportClass}`}
        style={playerCardStyle}
      >
        <div className="flex min-h-8 items-center justify-between gap-2 px-1 pb-1.5 text-xs text-slate-500 sm:px-2">
          <div className="flex flex-wrap items-center gap-2">
            <span>Tài nguyên</span>
            <span className="text-slate-300">|</span>
            <span>{`Câu ${currentIndex + 1} / ${questions.length}`}</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="text-xs font-semibold text-slate-400">
              {allQuestionsAnswered ? "Đã hoàn tất" : `${answeredCount}/${questions.length} đã trả lời`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isCurrentQuestionBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
              className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                isCurrentQuestionBookmarked ? "border-[rgba(255,86,48,0.2)] bg-[rgba(255,86,48,0.12)] text-[#FF5630]" : "border-slate-200 bg-white text-slate-400"
              }`}
              onClick={() => void handleToggleBookmark()}
            >
              <Flag className={`h-4 w-4 ${isCurrentQuestionBookmarked ? "fill-current" : ""}`} />
            </button>
            <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
              {isTrainingMode ? "Luyện tập" : "Kiểm tra"}
            </span>
            {isTestingMode && remainingSeconds !== null ? (
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${testingTimerTone}`}>
                {formatTimer(remainingSeconds)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative min-h-[560px] min-w-0 flex-1 overflow-hidden rounded-[22px] border-[4px] bg-white p-3 shadow-[0_20px_48px_rgba(8,120,148,0.10)] sm:p-4 lg:flex lg:min-h-0 lg:flex-col"
          style={{
            ...canvasStyle,
            backgroundColor: "#ffffff",
            borderColor: "#000088",
          }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute -top-2 left-[28%] h-3 w-[34%] skew-x-[-28deg] bg-[#e82828]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-2 left-[30%] h-3 w-[34%] skew-x-[28deg] bg-[#e82828]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[30%] h-72 w-72 rounded-full border-[34px] border-[#f7d8df] opacity-70" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#eef0ff] opacity-70" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 right-16 h-56 w-56 rotate-45 rounded-[34px] bg-gradient-to-b from-[#dfe3ff] to-transparent opacity-80"
          />
          <div className="pointer-events-none absolute bottom-6 right-10 z-0 opacity-35">
            <img
              src="https://media.erg.edu.vn/logo/erg.png"
              alt=""
              className="h-auto w-[88px] object-contain"
              aria-hidden="true"
            />
          </div>

          <div className="relative z-10 -mx-3 mt-0 border border-[#3d43a8] bg-[#000088] px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] sm:-mx-4 sm:px-6">
            <div className="hidden">
              <span>{`Câu ${currentIndex + 1} / ${questions.length}`}</span>
              <span className="text-[#c6ced8]">|</span>
              <span>{questionLabel(readyQuestion)}</span>
            </div>
            <h2 className="quiz-player-question-title leading-snug text-white" style={{ fontSize: "var(--quiz-question-title-size)" }}>
              {attemptCompleted && !reviewingSubmittedAttempt ? resultDisplay[readyAttempt.passed ? "passMessage" : "failMessage"] : readyQuestion.title}
            </h2>
          </div>

          <div ref={questionBodyRef} className="quiz-player-question-body relative z-10 min-h-[460px] overflow-auto px-4 pb-36 pt-5 sm:px-7 sm:pr-32 sm:pt-6 lg:min-h-0 lg:flex-1">
            {attemptCompleted && !reviewingSubmittedAttempt ? (
              <FinalResultScreen
                attempt={readyAttempt}
                resultDisplay={resultDisplay}
                onReview={handleReviewQuiz}
              />
            ) : null}

            {attemptCompleted && !reviewingSubmittedAttempt ? null : (
              <>{questionBody}</>
            )}
          </div>

          {lastResult && !(attemptCompleted && !reviewingSubmittedAttempt) ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-5 z-30 flex justify-center px-3 sm:inset-x-8">
              <QuestionFeedbackPanel result={lastResult} floating />
            </div>
          ) : null}
        </div>

        <div className="flex min-h-10 flex-col gap-2 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
              {isTrainingMode ? "Học theo từng câu" : "Chế độ kiểm tra"}
            </span>
            <span className="line-clamp-1 text-xs font-medium text-slate-600">
              {footerMessage}
            </span>
          </div>

          {attemptCompleted && !reviewingSubmittedAttempt ? (
            <div className="ml-auto flex flex-wrap items-center gap-2 rounded-full border border-[rgba(0,0,136,0.10)] bg-white/70 p-1 shadow-[0_12px_28px_rgba(0,0,136,0.08)] backdrop-blur-xl">
              {resultDisplay.showReviewButton ? (
                <button className={navButtonClass} style={accentButtonStyle} type="button" onClick={handleReviewQuiz}>
                  {resultDisplay.reviewButtonLabel}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ml-auto flex flex-wrap items-center gap-2 rounded-full border border-[rgba(0,0,136,0.10)] bg-white/70 p-1 shadow-[0_12px_28px_rgba(0,0,136,0.08)] backdrop-blur-xl">
              {isTrainingMode ? (
                <button
                  className={`${navButtonClass} min-w-[132px]`}
                  style={accentButtonStyle}
                  type="button"
                  disabled={submitting || submitted || !currentAnswerComplete}
                  onClick={() => void submitCurrentTrainingQuestion()}
                >
                  {submitted ? "ĐÃ NỘP" : submitting ? "ĐANG NỘP..." : "NỘP BÀI"}
                </button>
              ) : (
                <>
              <button
                className={secondaryButtonClass}
                style={secondaryButtonStyle}
                type="button"
                disabled={isFirstQuestion || submitting}
                onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              >
                QUAY LẠI
              </button>
              <button
                className={navButtonClass}
                style={accentButtonStyle}
                type="button"
                disabled={isLastQuestion || submitting}
                onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              >
                TIẾP THEO
              </button>
              {(allQuestionsAnswered || submitFailed) && !attemptCompleted ? (
                <button
                  className={navButtonClass}
                  style={accentButtonStyle}
                  type="button"
                  disabled={submitting}
                  onClick={handleRequestSubmit}
                >
                  {submitting ? "ĐANG NỘP..." : submitFailed ? "THỬ NỘP LẠI" : "NỘP BÀI"}
                </button>
              ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {renderSidebar()}

      {submitDialogMode ? (
        <SubmitConfirmDialog
          mode={submitDialogMode}
          resultDisplay={resultDisplay}
          submitting={submitting}
          onCancel={() => setSubmitDialogMode(null)}
          onConfirm={() => void handleFinalizeAttempt()}
        />
      ) : null}
    </QuizThemeSurface>
  );
}
