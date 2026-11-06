import { useEffect, useRef } from "react";

import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { PlayerSaveIndicator, PlayerTimerText } from "@/components/quiz/player-status";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuizWelcomeScreen } from "@/components/quiz/quiz-welcome-screen";
import { buildSubmitSummary } from "@/components/quiz/submit-summary";
import { LiveSubmitDialog, PlayerQuestionBody } from "./player-ready-parts";
import { defaultResultDisplay } from "@/components/quiz/player-shell-runtime-model";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { PlayerQuestionAside } from "@/components/quiz/player-shell-runtime/player-question-aside";
import { buildFooterMessage, buildTakingCells, pickChoiceAnswer } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import {
  buildPlayerStyles,
  navButtonClass,
  playerGridClass,
  playerViewportClass,
} from "@/components/quiz/player-shell-runtime/player-shell-styles";
import { TimeUpOverlay } from "@/components/quiz/time-up-overlay";
import { isAnswerComplete } from "@/domain/quiz/quiz";
import type { QuizResultDisplay } from "@/domain/quiz/types";
import type { PlayerShellProps } from "./player-shell-props";
import { usePlayerReadyHandlers, type PlayerReady } from "./use-player-ready-handlers";
import type { PlayerRuntime } from "./use-player-runtime";

export function PlayerReadyView({
  rt,
  ready,
  portableOffline = false,
  welcomeMeta,
  renderResultActions,
}: Pick<PlayerShellProps, "portableOffline" | "welcomeMeta" | "renderResultActions"> & {
  rt: PlayerRuntime;
  ready: PlayerReady;
}) {
  const {
    activeSession, allQuestionsAnswered, attemptCompleted, currentAnswerComplete, currentIndex, deadlineAt, draftAnswer,
    draftSync, drafts, isFirstQuestion, isLastQuestion, isMobile, isTestingMode, isTrainingMode, lastResult, loadState, network,
    questionBodyRef, questions, retryTimeUpSubmit, reviewingAttempt, reviewingSubmittedAttempt,
    setCurrentIndex, setSubmitDialogMode, setTimeUp, shortcutsRef, started,
    submitCurrentTrainingQuestion, submitDialogMode, submitError, submitFailed, submitted, submitting, timeUpPhase,
  } = rt;
  const readyQuiz = ready.quiz;
  const readyAttempt = ready.attempt;
  const readyPackage = ready.quizPackage;
  const readyQuestion = ready.question;
  const readySession = ready.session;
  const {
    handleBackToList, handleFinalizeAttempt, handleJumpToQuestion, handleRequestSubmit,
    handleReviewQuestion, handleReviewQuiz, handleStartQuiz, handleToggleBookmark, handleDraftChange, retryHandler,
  } = usePlayerReadyHandlers(rt, ready);
  const goToInputRef = useRef<HTMLInputElement | null>(null);
  // Same gates as the on-screen option: a checked practice question or a finished attempt is read-only.
  useEffect(() => {
    shortcutsRef.current = {
      pickOption: (index) => {
        if (submitted || attemptCompleted || reviewingSubmittedAttempt) return;
        const next = pickChoiceAnswer(readyQuestion, draftAnswer, index);
        if (next) handleDraftChange(next);
      },
      toggleFlag: () => void handleToggleBookmark(),
      focusGoTo: () => goToInputRef.current?.focus(),
    };
  });
  const resultDisplay: QuizResultDisplay = { ...defaultResultDisplay, ...(readyQuiz.result ?? {}) };
  const restoredDraft = loadState.status === "ready" && loadState.restored;
  const bookmarkedQuestionIds = readySession.bookmarkedQuestionIds;
  const isCurrentQuestionBookmarked = bookmarkedQuestionIds.includes(readyQuestion.id);
  const answeredIndexes = new Set(questions.flatMap((question, index) => (isAnswerComplete(question, drafts[question.id]) ? [index] : [])));
  const flaggedIndexes = new Set(questions.flatMap((question, index) => (bookmarkedQuestionIds.includes(question.id) ? [index] : [])));
  const answeredCount = answeredIndexes.size;
  // -1 before the quiz starts: no question is current on the welcome page.
  const cells = buildTakingCells(questions.length, answeredIndexes, flaggedIndexes, started ? currentIndex : -1);

  const { playerCardStyle, canvasStyle, headerStyle, accentButtonStyle, modeBadgeStyle } =
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


  const saveIndicator = <PlayerSaveIndicator online={network.online} sync={draftSync} />;
  const footerMessage = buildFooterMessage({ reviewingAttempt, submitFailed, allQuestionsAnswered, isTrainingMode });

  const questionBody = (
    <PlayerQuestionBody
      online={network.online} question={readyQuestion} value={draftAnswer} onChange={handleDraftChange}
      isTrainingMode={isTrainingMode} submitted={submitted} result={lastResult} submitError={submitError}
    />
  );
  const submitDialog = submitDialogMode ? (
    <LiveSubmitDialog
      countdown={countdownProps}
      summary={buildSubmitSummary(questions.length, answeredIndexes, flaggedIndexes)}
      // The attempt limit is not part of the player runtime yet; null drops the "bạn còn n lần làm lại" clause.
      attemptsLeft={null}
      submitting={submitting}
      onJump={handleJumpToQuestion}
      onCancel={() => setSubmitDialogMode(null)}
      onConfirm={() => void handleFinalizeAttempt()}
    />
  ) : null;

  const mobileShellProps = {
    allQuestionsAnswered, answeredCount, attemptCompleted, cells, footerMessage,
    isBookmarked: isCurrentQuestionBookmarked, isFirstQuestion, isLastQuestion, isTestingMode, isTrainingMode,
    currentAnswerComplete, currentQuestionSubmitted: submitted, playerCardStyle, canvasStyle, headerStyle,
    accentButtonStyle, modeBadgeStyle, question: readyQuestion, questions, quiz: readyQuiz,
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
      <QuizThemeSurface quiz={readyQuiz} className={`quiz-player-shell ${playerGridClass}`}>
        <QuizWelcomeScreen
          accentButtonStyle={accentButtonStyle} answeredCount={answeredCount} canvasStyle={canvasStyle}
          isTestingMode={isTestingMode} isTrainingMode={isTrainingMode} modeBadgeStyle={modeBadgeStyle}
          navButtonClass={navButtonClass} onStart={handleStartQuiz} playerCardStyle={playerCardStyle}
          playerViewportClass={playerViewportClass} questions={questions} quiz={readyQuiz}
          restoredDraft={restoredDraft} welcomeMeta={welcomeMeta}
        />

        <PlayerQuestionAside cells={cells} onSelect={handleJumpToQuestion} />
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
    <QuizThemeSurface quiz={readyQuiz} className="quiz-player-shell">
      <PlayerDesktopLayout
        allQuestionsAnswered={allQuestionsAnswered}
        answeredCount={answeredCount} attemptCompleted={attemptCompleted} canvasStyle={canvasStyle}
        cells={cells} countdownProps={countdownProps} currentAnswerComplete={currentAnswerComplete} currentIndex={currentIndex}
        footerMessage={footerMessage} goToInputRef={goToInputRef} isCurrentQuestionBookmarked={isCurrentQuestionBookmarked}
        isFirstQuestion={isFirstQuestion} isLastQuestion={isLastQuestion} isTestingMode={isTestingMode}
        isTrainingMode={isTrainingMode} lastResult={lastResult} modeBadgeStyle={modeBadgeStyle}
        playerCardStyle={playerCardStyle} questionBody={questionBody} questionBodyRef={questionBodyRef}
        questions={questions} readyAttempt={readyAttempt} readyQuestion={readyQuestion} resultDisplay={resultDisplay}
        reviewingSubmittedAttempt={reviewingSubmittedAttempt} saveIndicator={saveIndicator}
        submitFailed={submitFailed} submitted={submitted}
        submitting={submitting} handleRequestSubmit={handleRequestSubmit} handleReviewQuiz={handleReviewQuiz}
        onBackToList={handleBackToList} onJumpToQuestion={handleJumpToQuestion} onRetry={retryHandler} handleToggleBookmark={handleToggleBookmark}
        setCurrentIndex={setCurrentIndex} submitCurrentTrainingQuestion={submitCurrentTrainingQuestion}
      />

      {submitDialog}
      <TimeUpOverlay phase={timeUpPhase} onRetry={retryTimeUpSubmit} />
    </QuizThemeSurface>
  );
}