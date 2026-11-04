import { useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import {
  PlayerOfflineBanner,
  PlayerSaveIndicator,
  PlayerTimerText,
  type DraftSyncState,
} from "@/components/quiz/player-status";
import { QuestionNavigator } from "@/components/quiz/question-navigator";
import {
  areAnswerPayloadsEqual,
  firstUnansweredIndex,
} from "@/components/quiz/player-shell-utils";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuizWelcomeScreen, type QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { AnswerKeyCard } from "@/components/quiz/player-shell-parts";
import {
  defaultResultDisplay,
  type PlayerLoadState,
  type SubmitDialogMode,
} from "@/components/quiz/player-shell-runtime-model";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { PlayerErrorView, PlayerLoadingView } from "@/components/quiz/player-shell-runtime/player-load-views";
import { buildFooterMessage } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import {
  buildPlayerStyles,
  navButtonClass,
  playerViewportClass,
} from "@/components/quiz/player-shell-runtime/player-shell-styles";
import { usePlayerDerivedState } from "@/components/quiz/player-shell-runtime/use-player-derived-state";
import { usePlayerActions } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-actions";
import { usePlayerKeyboard } from "@/components/quiz/player-shell-runtime/use-player-keyboard";
import { usePlayerLoadEffect } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-load-effect";
import { usePlayerSyncEffects } from "@/features/lcms/quiz/player/player-shell-runtime/use-player-sync-effects";
import { TimeUpOverlay } from "@/components/quiz/time-up-overlay";
import { useTimeUpSubmit } from "@/features/lcms/quiz/player/player-shell-runtime/use-time-up-submit";
import { useTrainingAdvanceEffects } from "@/components/quiz/player-shell-runtime/use-training-advance-effects";
import {
  createRuntimeKey,
  localQuizAttemptStore,
  useSaveAttemptAnswerMutation,
  useSaveAttemptDraftMutation,
  useSyncAttemptMutation,
  useQuizPackageQuery,
} from "@/features/lcms/quiz/quiz-runtime";
import { isAnswerComplete } from "@/lib/quiz";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/lib/quiz-runtime-types";
import type { AnswerPayload, Attempt, Question, Quiz, QuizPackage, QuizResultDisplay } from "@/lib/types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";

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
  /** Portable exams: opaque account id (class + student code) used as the attempt scope. */
  identityAccountId?: string;
  /** Portable exams: extra result-screen actions (export). Receives the finished attempt. */
  renderResultActions?: (context: { attempt: Attempt; session: LocalQuizAttemptSession; quizPackage: QuizPackage }) => ReactNode;
};

export function PlayerShellRuntime({
  assignmentId,
  quizId,
  portablePackage,
  portableOffline = false,
  startImmediately = false,
  runtimePortal = "elearning",
  welcomeMeta,
  identityAccountId,
  renderResultActions,
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
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [submitDialogMode, setSubmitDialogMode] = useState<SubmitDialogMode | null>(null);
  const [reviewingSubmittedAttempt, setReviewingSubmittedAttempt] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [recentTrainingSubmitQuestionId, setRecentTrainingSubmitQuestionId] = useState<string | null>(null);
  const questionBodyRef = useRef<HTMLDivElement | null>(null);
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
    setSidebarQuery,
    setSubmitDialogMode,
    setReviewingSubmittedAttempt,
    setTimeUp,
    setRecentTrainingSubmitQuestionId,
  });

  const {
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptExpired, currentAnswerComplete, deadlineAt, draftAnswer, isFirstQuestion, isLastQuestion, isTestingMode,
    isTrainingMode, lastResult, questions, reviewingAttempt, submitFailed, submitted,
  } = usePlayerDerivedState({ currentIndex, drafts, loadState, portableOffline, reviewingSubmittedAttempt, timeUp });

  const { beginAttempt, finalizeAttempt, requestSubmit, submitCurrentTrainingQuestion, submitReadyAttempt } = usePlayerActions({
    activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, allQuestionsAnswered, attemptCompleted,
    attemptExpired, attemptScope, drafts, isTrainingMode, portableOffline, queryClient, questions, runtimePortal,
    saveAttemptAnswerAsync, submitFailed, submitting,
    setCurrentIndex, setDrafts, setLoadState, setRecentTrainingSubmitQuestionId, setReviewingSubmittedAttempt,
    setStarted, setSubmitDialogMode, setSubmitError, setSubmitting, setTimeUp,
  });

  usePlayerSyncEffects({
    activePackage, activeSession, attemptCompleted, attemptScope, drafts, networkOnline: network.online,
    runtimePortal, saveAttemptDraftAsync, started, syncAttemptAsync, setDraftSync,
  });

  const { phase: timeUpPhase, retry: retryTimeUpSubmit } = useTimeUpSubmit({
    activeAttempt, activePackage, activeSession, attemptCompleted, attemptScope, isTestingMode, started,
    submitReadyAttempt, submitting, timeUp, setLoadState, setSubmitError, setSubmitting,
  });

  usePlayerKeyboard({
    allQuestionsAnswered, attemptExpired, attemptCompleted, beginAttempt, finalizeAttempt, isTestingMode,
    isTrainingMode, loadStatus: loadState.status, questionsLength: questions.length, requestSubmit,
    reviewingSubmittedAttempt, started, submitCurrentTrainingQuestion, submitDialogMode, submitFailed, submitting,
    setCurrentIndex,
  });

  useTrainingAdvanceEffects({
    activeQuestion, attemptCompleted, currentIndex, isLastQuestion, isTrainingMode, lastResult, paceStateUpdate,
    questionBodyRef, questionsLength: questions.length, recentTrainingSubmitQuestionId, started,
    setCurrentIndex, setRecentTrainingSubmitQuestionId,
  });

  if (loadState.status === "loading") {
    return <PlayerLoadingView />;
  }

  if (loadState.status === "error" || !activeQuiz || !activeAttempt || !activePackage || !activeSession || !activeQuestion) {
    return (
      <PlayerErrorView
        message={loadState.status === "error" ? loadState.message : "Không thể mở bài làm."}
        onRetry={() => void quizPackageQuery.refetch()}
      />
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

  const { playerCardStyle, canvasStyle, headerStyle, accentButtonStyle, secondaryButtonStyle, modeBadgeStyle } =
    buildPlayerStyles(isTrainingMode);

  const countdownProps = {
    active: started && isTestingMode && !attemptCompleted,
    deadlineAt,
    localClock: portableOffline,
    onExpiredChange: setTimeUp,
    session: activeSession,
  };
  const countdown = isTestingMode ? (
    <PlayerCountdown {...countdownProps}>{(seconds) => <PlayerTimerText seconds={seconds} />}</PlayerCountdown>
  ) : null;

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

  const saveIndicator = <PlayerSaveIndicator online={network.online} sync={draftSync} />;
  const footerMessage = buildFooterMessage({ reviewingAttempt, submitFailed, allQuestionsAnswered, isTrainingMode });

  const questionBody = (
    <>
      {network.online ? null : <PlayerOfflineBanner />}

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

  const submitDialog = submitDialogMode ? (
    <SubmitConfirmDialog
      mode={submitDialogMode}
      resultDisplay={resultDisplay}
      submitting={submitting}
      unansweredCount={questions.length - answeredCount}
      flaggedCount={bookmarkedQuestionIds.length}
      onGoToUnanswered={handleGoToUnanswered}
      onCancel={() => setSubmitDialogMode(null)}
      onConfirm={() => void handleFinalizeAttempt()}
    />
  ) : null;

  const mobileShellProps = {
    allQuestionsAnswered, answeredCount, answeredQuestionIds, attemptCompleted,
    bookmarkCount: bookmarkedQuestionIds.length, bookmarkedQuestionIds, currentIndex, footerMessage,
    isBookmarked: isCurrentQuestionBookmarked, isFirstQuestion, isLastQuestion, isTestingMode, isTrainingMode,
    currentAnswerComplete, currentQuestionSubmitted: submitted, playerCardStyle, canvasStyle, headerStyle,
    accentButtonStyle, secondaryButtonStyle, modeBadgeStyle, question: readyQuestion, questions, quiz: readyQuiz,
    resultDisplay, reviewingSubmittedAttempt, saveIndicator, started, submitting, submitFailed, timer: countdown,
    onJumpToQuestion: handleJumpToQuestion, onRequestSubmit: handleRequestSubmit, onReview: handleReviewQuiz,
    onStart: handleStartQuiz, body: questionBody,
    onNext: () => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1)),
    onPrev: () => setCurrentIndex((value) => Math.max(0, value - 1)),
    onSubmitCurrentQuestion: () => void submitCurrentTrainingQuestion(),
    onToggleBookmark: () => void handleToggleBookmark(),
    resultBody: (
      <FinalResultScreen
        attempt={readyAttempt} questions={questions} resultDisplay={resultDisplay} onReview={handleReviewQuiz}
        onReviewQuestion={handleReviewQuestion} onRetry={retryHandler} onBackToList={handleBackToList}
        extraActions={renderResultActions?.({ attempt: readyAttempt, session: readySession, quizPackage: readyPackage })}
      />
    ),
  };

  if (!started) {
    if (isMobile) {
      return (
        <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell">
          <MobilePlayerShell {...mobileShellProps} />
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
        <MobilePlayerShell {...mobileShellProps} />
        {submitDialog}
        <TimeUpOverlay phase={timeUpPhase} onRetry={retryTimeUpSubmit} />
      </QuizThemeSurface>
    );
  }

  return (
    <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell grid gap-3 lg:grid-cols-[minmax(0,1fr)_192px]">
      <PlayerDesktopLayout
        accentButtonStyle={accentButtonStyle}
        allQuestionsAnswered={allQuestionsAnswered}
        answeredCount={answeredCount}
        attemptCompleted={attemptCompleted}
        canvasStyle={canvasStyle}
        countdownProps={countdownProps}
        currentAnswerComplete={currentAnswerComplete}
        currentIndex={currentIndex}
        footerMessage={footerMessage}
        isCurrentQuestionBookmarked={isCurrentQuestionBookmarked}
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        isTestingMode={isTestingMode}
        isTrainingMode={isTrainingMode}
        lastResult={lastResult}
        modeBadgeStyle={modeBadgeStyle}
        playerCardStyle={playerCardStyle}
        questionBody={questionBody}
        questionBodyRef={questionBodyRef}
        questions={questions}
        readyAttempt={readyAttempt}
        readyQuestion={readyQuestion}
        resultDisplay={resultDisplay}
        reviewingSubmittedAttempt={reviewingSubmittedAttempt}
        saveIndicator={saveIndicator}
        secondaryButtonStyle={secondaryButtonStyle}
        submitFailed={submitFailed}
        submitted={submitted}
        submitting={submitting}
        handleRequestSubmit={handleRequestSubmit}
        handleReviewQuiz={handleReviewQuiz}
        onBackToList={handleBackToList}
        onRetry={retryHandler}
        handleToggleBookmark={handleToggleBookmark}
        setCurrentIndex={setCurrentIndex}
        submitCurrentTrainingQuestion={submitCurrentTrainingQuestion}
      />

      {renderSidebar()}

      {submitDialog}
      <TimeUpOverlay phase={timeUpPhase} onRetry={retryTimeUpSubmit} />
    </QuizThemeSurface>
  );
}
