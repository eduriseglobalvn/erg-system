import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  FieldLabel,
  FormViewSection,
  SlideTitleToolbar,
} from "@/features/lcms/quiz/quiz-editor/components/form-view/authoring-frame";
import { DragDropMatchTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/drag-drop-match-table";
import { FeedbackBranchingTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/feedback-branching-table";
import { MediaAttachmentPanel } from "@/features/lcms/quiz/quiz-editor/components/form-view/media-attachment-panel";
import type {
  QuizEditorDragDropItem,
  QuizEditorFeedbackRow,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function DragDropQuestionForm({
  slide,
  onUpdateTitle,
  onUpdateItems,
  onUpdateFeedbackRows,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
}: {
  slide: QuizEditorSlide;
  onUpdateTitle: (value: string) => void;
  onUpdateItems: (items: QuizEditorDragDropItem[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <FormViewSection title={t("quiz.dragDropQuestion")}>
      <SlideTitleToolbar slide={slide} value={slide.title} onChange={onUpdateTitle} />

      <MediaAttachmentPanel
        media={slide.media}
        onPickMedia={onPickMedia}
        onRemoveMedia={onRemoveMedia}
        onChangeAlt={onUpdateMediaAlt}
      />

      <FieldLabel label={t("common.correctMatches")} />
      <DragDropMatchTable items={slide.dragDropItems ?? []} onChange={onUpdateItems} />

      <FieldLabel label={t("common.feedbackAndBranching")} />
      <FeedbackBranchingTable rows={slide.feedbackRows ?? []} onChange={onUpdateFeedbackRows} />
    </FormViewSection>
  );
}
