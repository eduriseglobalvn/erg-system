import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  FieldLabel,
  FormViewSection,
  SlideTitleToolbar,
} from "@/features/lcms/quiz/quiz-editor/components/form-view/authoring-frame";
import { ChoiceEditorTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/choice-editor-table";
import { FeedbackBranchingTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/feedback-branching-table";
import { MediaAttachmentPanel } from "@/features/lcms/quiz/quiz-editor/components/form-view/media-attachment-panel";
import type {
  QuizEditorChoice,
  QuizEditorFeedbackRow,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function ChoiceQuestionForm({
  slide,
  onUpdateTitle,
  onUpdateChoices,
  onUpdateFeedbackRows,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
}: {
  slide: QuizEditorSlide;
  onUpdateTitle: (value: string) => void;
  onUpdateChoices: (choices: QuizEditorChoice[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
}) {
  const { t } = useI18n();
  const title =
    slide.kind === "multiple-choice"
      ? t("quiz.multipleChoiceQuestion")
      : slide.kind === "true-false"
        ? t("quiz.trueFalse")
        : t("quiz.multipleResponseQuestion");

  return (
    <FormViewSection title={title}>
      <SlideTitleToolbar slide={slide} value={slide.title} onChange={onUpdateTitle} />

      <MediaAttachmentPanel
        media={slide.media}
        onPickMedia={onPickMedia}
        onRemoveMedia={onRemoveMedia}
        onChangeAlt={onUpdateMediaAlt}
      />

      <FieldLabel label={t("quiz.choices")} />
      <ChoiceEditorTable
        choices={slide.choices ?? []}
        controlType={slide.choiceControlType ?? "checkbox"}
        onChange={onUpdateChoices}
      />

      <FieldLabel label={t("common.feedbackAndBranching")} />
      <FeedbackBranchingTable rows={slide.feedbackRows ?? []} onChange={onUpdateFeedbackRows} />
    </FormViewSection>
  );
}
