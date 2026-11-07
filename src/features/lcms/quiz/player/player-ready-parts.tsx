import { useRemainingSeconds } from "@/components/quiz/player-countdown";
import { AnswerKeyCard, SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import { PracticeFeedbackPanel } from "@/components/quiz/practice-feedback-panel";
import { PlayerOfflineBanner } from "@/components/quiz/player-status";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { LocalRetryPlayer } from "@/components/quiz/review/local-retry-player";
import { ReviewLayout } from "@/components/quiz/review/review-layout";
import { attemptElapsedSeconds } from "@/components/quiz/review/review-model";
import type { Question } from "@/domain/quiz/types";
import type { ComponentProps } from "react";
import type { PlayerReady } from "./use-player-ready-handlers";
import type { PlayerRuntime } from "./use-player-runtime";

type RendererProps = ComponentProps<typeof QuestionRenderer>;

type QuestionBodyProps = {
  online: boolean;
  question: Question;
  value: RendererProps["value"];
  onChange: RendererProps["onChange"];
  isTrainingMode: boolean;
  submitted: boolean;
  result: RendererProps["result"];
  submitError: string | null;
};

export function PlayerQuestionBody({ online, question: readyQuestion, value, onChange, isTrainingMode, submitted, result, submitError }: QuestionBodyProps) {
  return (
    <>
      {online ? null : <PlayerOfflineBanner />}

      <QuestionRenderer
        key={readyQuestion.id}
        question={readyQuestion}
        value={value}
        onChange={onChange}
        submitted={submitted}
        reviewMode={submitted}
        result={result}
      />

      {submitted && readyQuestion.kind === "hotspot" ? <AnswerKeyCard question={readyQuestion} /> : null}

      {isTrainingMode && submitted && result ? <PracticeFeedbackPanel key={`${readyQuestion.id}-feedback`} result={result} /> : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

    </>
  );
}

type LiveSubmitDialogProps = Omit<ComponentProps<typeof SubmitConfirmDialog>, "remainingSeconds"> & {
  countdown: Parameters<typeof useRemainingSeconds>[0];
};

/** Own ticking clock so the player shell does not re-render every second while the dialog is open. */
export function LiveSubmitDialog({ countdown, ...dialogProps }: LiveSubmitDialogProps) {
  const remainingSeconds = useRemainingSeconds(countdown);
  return <SubmitConfirmDialog {...dialogProps} remainingSeconds={remainingSeconds} />;
}

/** After submit: the review screen (L08/L09/WL5) or, from its last button, the local retry (D12). */
export function PlayerReviewView({ rt, ready, flagged }: { rt: PlayerRuntime; ready: PlayerReady; flagged: ReadonlySet<number> }) {
  const { currentIndex, isMobile, localRetryIndices, questions, setCurrentIndex, setLocalRetryIndices, setReviewingSubmittedAttempt, startLocalRetry } = rt;
  const { session } = ready;
  return (
    <QuizThemeSurface quiz={ready.quiz} className="quiz-player-shell">
      {localRetryIndices ? (
        <LocalRetryPlayer questions={questions} indices={localRetryIndices} onExit={() => setLocalRetryIndices(null)} />
      ) : (
        <ReviewLayout
          attempt={ready.attempt} questions={questions} flagged={flagged} current={currentIndex}
          elapsedSeconds={attemptElapsedSeconds(session.serverStartedAt ?? session.startedAt, session.submittedAt)}
          surface={isMobile ? "phone" : "web"} onSelect={setCurrentIndex} onBack={() => setReviewingSubmittedAttempt(false)}
          startLocalRetry={startLocalRetry}
        />
      )}
    </QuizThemeSurface>
  );
}
