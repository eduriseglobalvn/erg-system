import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/utils/cn";
import type { QuizEditorDragDropItem, QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { buildPreviewTextStyle, buildPreviewTitleStyle, getFeedbackRow, toRenderableDragItems } from "./quiz-editor-slide-render-utils";
import { SelectableImage } from "./quiz-editor-slide-media";

export function FeedbackLayerPreview({
  slide,
  mode,
  size,
  selectedImageId,
  onSelectImage,
  onMoveImage,
}: {
  slide: QuizEditorSlide;
  mode: "correct" | "incorrect";
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
}) {
  const { t } = useI18n();
  const feedback = getFeedbackRow(slide.feedbackRows ?? [], mode);
  const heading = mode === "correct" ? t("common.correct") : t("common.incorrect");
  const healthyFoodsLabel = t("quiz.healthyFoodsAre");
  const unhealthyFoodsLabel = t("quiz.unhealthyFoodsAre");
  const correctAnswerLabel = mode === "correct" ? t("quiz.correctAnswer") : t("quiz.correctAnswers");

  if (slide.kind === "drag-and-drop") {
    const items = toRenderableDragItems(slide.dragDropItems);
    const grouped = items.reduce<Record<string, QuizEditorDragDropItem[]>>((acc, item) => {
      if (!acc[item.target]) {
        acc[item.target] = [];
      }

      acc[item.target].push(item);
      return acc;
    }, {});

    return (
      <div className="classic-slide__feedback-layer">
        <div className={cn("classic-slide__feedback-card", mode === "correct" ? "is-correct" : "is-incorrect")}>
          <div className="classic-slide__feedback-card-header">
            <span>{heading.replace(":", "")}</span>
            <span className="classic-slide__feedback-card-caret"><ExpandMoreIcon className="h-4 w-4" sx={{ fontSize: "1em" }} /></span>
          </div>
          <div className="classic-slide__feedback-card-body">
            <p className="classic-slide__feedback-copy" style={buildPreviewTextStyle(slide, "feedback", 15)}>
              {feedback?.feedback ?? slide.title}
            </p>

            <FeedbackItemGroup
              slide={slide}
              title={healthyFoodsLabel}
              items={grouped.healthy ?? []}
              size={size}
              selectedImageId={selectedImageId}
              onSelectImage={onSelectImage}
              onMoveImage={onMoveImage}
            />
            <FeedbackItemGroup
              slide={slide}
              title={unhealthyFoodsLabel}
              items={grouped.unhealthy ?? []}
              size={size}
              selectedImageId={selectedImageId}
              onSelectImage={onSelectImage}
              onMoveImage={onMoveImage}
            />
          </div>
        </div>
      </div>
    );
  }

  const correctChoices = (slide.choices ?? []).filter((choice) => choice.correct);

  return (
    <div className="classic-slide__feedback-layer">
      <div className={cn("classic-slide__feedback-card", mode === "correct" ? "is-correct" : "is-incorrect")}>
        <div className="classic-slide__feedback-card-header">
          <span>{heading.replace(":", "")}</span>
          <span className="classic-slide__feedback-card-caret"><ExpandMoreIcon className="h-4 w-4" sx={{ fontSize: "1em" }} /></span>
        </div>
        <div className="classic-slide__feedback-card-body">
          <div className="classic-slide__feedback-question" style={buildPreviewTitleStyle(slide, 18)}>
            {slide.title}
          </div>
          <p className="classic-slide__feedback-copy" style={buildPreviewTextStyle(slide, "feedback", 15)}>
            {feedback?.feedback ?? slide.title}
          </p>

          {correctChoices.length > 0 ? (
            <div className="classic-slide__feedback-answer-block">
              <div className="classic-slide__feedback-answer-label" style={buildPreviewTextStyle(slide, "answer", 12)}>
                {correctAnswerLabel}
              </div>
              <div className="classic-slide__feedback-answer-list">
                {correctChoices.map((choice) => (
                  <span
                    key={choice.id}
                    className="classic-slide__feedback-answer-chip"
                    style={buildPreviewTextStyle(slide, "answer", 13)}
                  >
                    {choice.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FeedbackItemGroup({
  slide,
  title,
  items,
  size,
  selectedImageId,
  onSelectImage,
  onMoveImage,
}: {
  slide: QuizEditorSlide;
  title: string;
  items: QuizEditorDragDropItem[];
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
}) {
  return (
    <div className="classic-slide__feedback-item-group">
      <div className="classic-slide__feedback-answer-label" style={buildPreviewTextStyle(slide, "answer", 12)}>
        {title}
      </div>
      <div className="classic-slide__feedback-item-row">
        {items.map((item) => (
          <SelectableImage
            key={item.id}
            elementId={item.id}
            title={item.label}
            size={size}
            selectedImageId={selectedImageId}
            onSelectImage={onSelectImage}
            offset={slide.options?.elementOffsets?.[item.id]}
            onMoveImage={onMoveImage}
            className="classic-slide__feedback-item"
          >
            <span>{item.emoji}</span>
          </SelectableImage>
        ))}
      </div>
    </div>
  );
}

export function ResultPreview({ slide }: { slide: QuizEditorSlide }) {
  const { t } = useI18n();
  const isPassed = slide.activeResultTab !== "failed";
  const passMessage =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.greatYoureSharp");
  const failMessage =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.tryAgainMessage");

  return (
    <div className="classic-slide__result">
      <div
        className={
          isPassed
            ? "classic-slide__result-icon is-pass"
            : "classic-slide__result-icon is-fail"
        }
      >
        {isPassed ? <CheckIcon className="h-8 w-8" sx={{ fontSize: "1em" }} /> : <CloseIcon className="h-8 w-8" sx={{ fontSize: "1em" }} />}
      </div>
      <div className="classic-slide__result-copy" style={buildPreviewTextStyle(slide, "feedback", 16)}>
        {isPassed ? passMessage : failMessage}
      </div>
    </div>
  );
}

