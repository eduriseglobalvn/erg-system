import { useMemo, useState } from "react";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { BufferedTextarea } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/buffered-textarea";
import { LearnerPreviewShell } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/learner-preview-shell";
import {
  LearnerInformationLandingScreen,
  LearnerInstructionScreen,
  LearnerResultScreen,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/learner-preview-screens";
import {
  createPreviewAnswer,
  getFeedbackText,
  isInstructionLikeSlide,
  updateFeedbackText,
  type PreviewMode,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import { buildPreviewQuestion } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import { useI18n } from "@/platform/i18n";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import type {
  QuizEditorFeedbackRow,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type LearnerQuestionAuthoringPreviewProps = {
  slide: QuizEditorSlide;
  previewMode: PreviewMode;
  themeId?: string;
  readOnly?: boolean;
  onUpdateTitle: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateFeedbackRows?: (rows: QuizEditorFeedbackRow[]) => void;
  onUpdateRuntimeQuestion?: (question: Question) => void;
  onUpdateSlideMedia?: (media: QuizEditorSlideMedia) => void;
  onTextTargetFocus?: (target: QuizEditorTextStyleTarget) => void;
};

export function LearnerQuestionAuthoringPreview({
  slide,
  previewMode,
  themeId,
  readOnly = false,
  onUpdateTitle,
  onUpdateInstructions,
  onUpdateFeedbackRows,
  onUpdateRuntimeQuestion,
  onUpdateSlideMedia,
  onTextTargetFocus,
}: LearnerQuestionAuthoringPreviewProps) {
  const { t } = useI18n();
  const learnerQuestion = useMemo(() => buildPreviewQuestion(slide, t), [slide, t]);
  const answerKey = learnerQuestion
    ? `${learnerQuestion.id}:${learnerQuestion.kind}:${previewMode}:${slide.choices?.length ?? 0}:${slide.dragDropItems?.length ?? 0}`
    : "empty";
  const initialAnswer = learnerQuestion ? createPreviewAnswer(learnerQuestion, previewMode) : {};
  const [draftAnswerState, setDraftAnswerState] = useState<{ key: string; answer: AnswerPayload }>({
    key: answerKey,
    answer: initialAnswer,
  });
  const draftAnswer = draftAnswerState.key === answerKey ? draftAnswerState.answer : initialAnswer;

  if (slide.kind === "result-slide") {
    return (
      <LearnerPreviewShell
        slide={slide}
        themeId={themeId}
        readOnly={readOnly}
        onUpdateTitle={onUpdateTitle}
        onUpdateSlideMedia={onUpdateSlideMedia}
        onTextTargetFocus={onTextTargetFocus}
      >
        <LearnerResultScreen slide={slide} />
      </LearnerPreviewShell>
    );
  }

  if (isInstructionLikeSlide(slide.kind)) {
    return (
      <LearnerPreviewShell
        slide={slide}
        themeId={themeId}
        readOnly={readOnly}
        onUpdateTitle={onUpdateTitle}
        onUpdateSlideMedia={onUpdateSlideMedia}
        onTextTargetFocus={onTextTargetFocus}
      >
        {slide.kind === "info-slide" && slide.infoPage ? (
          <LearnerInformationLandingScreen slide={slide} />
        ) : (
          <LearnerInstructionScreen
            slide={slide}
            readOnly={readOnly}
            onUpdateInstructions={onUpdateInstructions}
          />
        )}
      </LearnerPreviewShell>
    );
  }

  if (!learnerQuestion) {
    return null;
  }

  const feedback = getFeedbackText(slide, previewMode);
  const submitted = previewMode !== "question";
  const directEditing = !readOnly && previewMode === "question";

  return (
    <LearnerPreviewShell
      slide={slide}
      themeId={themeId}
      readOnly={readOnly}
      onUpdateTitle={onUpdateTitle}
      onUpdateSlideMedia={onUpdateSlideMedia}
      onTextTargetFocus={onTextTargetFocus}
    >
      <div
        className="classic-editor__learner-question-body"
        onFocusCapture={(event) => {
          if (readOnly) return;
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          onTextTargetFocus?.(target.closest(".classic-editor__learner-title-band") ? "question" : "answer");
        }}
      >
        {directEditing ? (
          <QuestionRenderer
            question={learnerQuestion}
            value={draftAnswer}
            onChange={(answer) => setDraftAnswerState({ key: answerKey, answer })}
            submitted={false}
            reviewMode={false}
            editable
            onQuestionChange={(nextQuestion) => onUpdateRuntimeQuestion?.({ ...nextQuestion, title: slide.title })}
          />
        ) : (
          <QuestionRenderer
            question={learnerQuestion}
            value={draftAnswer}
            onChange={(answer) => setDraftAnswerState({ key: answerKey, answer })}
            submitted={submitted}
            reviewMode={submitted}
          />
        )}
      </div>

      {previewMode !== "question" ? (
        <div className="classic-editor__learner-feedback" data-state={previewMode}>
          <div className="classic-editor__learner-feedback-bar">
            {previewMode === "correct" ? t("common.correct") : t("common.incorrect")}
          </div>
          {!readOnly && onUpdateFeedbackRows ? (
            <BufferedTextarea
              className="classic-editor__learner-feedback-input"
              value={feedback ?? ""}
              onCommit={(value) =>
                onUpdateFeedbackRows(updateFeedbackText(slide.feedbackRows, previewMode, value))
              }
              aria-label={previewMode === "correct" ? t("quiz.correctFeedback") : t("quiz.incorrectFeedback")}
            />
          ) : (
            <p>{feedback}</p>
          )}
        </div>
      ) : null}
    </LearnerPreviewShell>
  );
}

