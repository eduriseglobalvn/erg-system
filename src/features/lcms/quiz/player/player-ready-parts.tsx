import { useRemainingSeconds } from "@/components/quiz/player-countdown";
import { AnswerKeyCard, SubmitConfirmDialog } from "@/components/quiz/player-shell-parts";
import { PracticeFeedbackPanel } from "@/components/quiz/practice-feedback-panel";
import { PlayerOfflineBanner } from "@/components/quiz/player-status";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import type { Question } from "@/domain/quiz/types";
import type { ComponentProps } from "react";

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

      {isTrainingMode && submitted && result ? <PracticeFeedbackPanel key={readyQuestion.id} result={result} /> : null}

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
