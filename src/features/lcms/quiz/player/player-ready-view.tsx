import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { MobilePlayerShell } from "@/components/quiz/mobile-player-shell";
import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import { PlayerSaveIndicator, PlayerTimerText } from "@/components/quiz/player-status";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { QuizWelcomeScreen } from "@/components/quiz/quiz-welcome-screen";
import { PlayerQuestionBody, PlayerSidebar } from "./player-ready-parts";
import { defaultResultDisplay } from "@/components/quiz/player-shell-runtime-model";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { buildFooterMessage } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import {
  buildPlayerStyles,
  navButtonClass,
  playerViewportClass,
} from "@/components/quiz/player-shell-runtime/player-shell-styles";
import { TimeUpOverlay } from "@/components/quiz/time-up-overlay";
import { isAnswerComplete } from "@/lib/quiz";
import type { QuizResultDisplay } from "@/lib/types";
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
    setCurrentIndex, setStarted, setSidebarQuery, setSubmitDialogMode, setTimeUp, sidebarQuery, started,
    submitCurrentTrainingQuestion, submitDialogMode, submitError, submitFailed, submitted, submitting, timeUpPhase,
  } = rt;
  const readyQuiz = ready.quiz;
  const readyAttempt = ready.attempt;
  const readyPackage = ready.quizPackage;
  const readyQuestion = ready.question;
  const readySession = ready.session;
  const {
    handleBackToList, handleFinalizeAttempt, handleGoToUnanswered, handleJumpToQuestion, handleRequestSubmit,
    handleReviewQuestion, handleReviewQuiz, handleStartQuiz, handleToggleBookmark, handleDraftChange, retryHandler,
  } = usePlayerReadyHandlers(rt, ready);
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


  const saveIndicator = <PlayerSaveIndicator online={network.online} sync={draftSync} />;
  const footerMessage = buildFooterMessage({ reviewingAttempt, submitFailed, allQuestionsAnswered, isTrainingMode });

  const questionBody = (
    <PlayerQuestionBody
      online={network.online} question={readyQuestion} value={draftAnswer} onChange={handleDraftChange}
      submitted={submitted} result={lastResult} submitError={submitError}
    />
  );
  const sidebar = (
    <PlayerSidebar
      answeredQuestionIds={answeredQuestionIds} bookmarkedQuestionIds={bookmarkedQuestionIds} currentIndex={currentIndex}
      quiz={readyQuiz} query={sidebarQuery} questions={questions} started={started} style={playerCardStyle}
      onIntroClick={() => setStarted(false)} onJumpToQuestion={handleJumpToQuestion} onQueryChange={setSidebarQuery}
    />
  );


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
          accentButtonStyle={accentButtonStyle} answeredCount={answeredCount} canvasStyle={canvasStyle}
          isTestingMode={isTestingMode} isTrainingMode={isTrainingMode} modeBadgeStyle={modeBadgeStyle}
          navButtonClass={navButtonClass} onStart={handleStartQuiz} playerCardStyle={playerCardStyle}
          playerViewportClass={playerViewportClass} questions={questions} quiz={readyQuiz}
          restoredDraft={restoredDraft} welcomeMeta={welcomeMeta}
        />

        {sidebar}
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
        accentButtonStyle={accentButtonStyle} allQuestionsAnswered={allQuestionsAnswered}
        answeredCount={answeredCount} attemptCompleted={attemptCompleted} canvasStyle={canvasStyle}
        countdownProps={countdownProps} currentAnswerComplete={currentAnswerComplete} currentIndex={currentIndex}
        footerMessage={footerMessage} isCurrentQuestionBookmarked={isCurrentQuestionBookmarked}
        isFirstQuestion={isFirstQuestion} isLastQuestion={isLastQuestion} isTestingMode={isTestingMode}
        isTrainingMode={isTrainingMode} lastResult={lastResult} modeBadgeStyle={modeBadgeStyle}
        playerCardStyle={playerCardStyle} questionBody={questionBody} questionBodyRef={questionBodyRef}
        questions={questions} readyAttempt={readyAttempt} readyQuestion={readyQuestion} resultDisplay={resultDisplay}
        reviewingSubmittedAttempt={reviewingSubmittedAttempt} saveIndicator={saveIndicator}
        secondaryButtonStyle={secondaryButtonStyle} submitFailed={submitFailed} submitted={submitted}
        submitting={submitting} handleRequestSubmit={handleRequestSubmit} handleReviewQuiz={handleReviewQuiz}
        onBackToList={handleBackToList} onRetry={retryHandler} handleToggleBookmark={handleToggleBookmark}
        setCurrentIndex={setCurrentIndex} submitCurrentTrainingQuestion={submitCurrentTrainingQuestion}
      />

      {sidebar}

      {submitDialog}
      <TimeUpOverlay phase={timeUpPhase} onRetry={retryTimeUpSubmit} />
    </QuizThemeSurface>
  );
}