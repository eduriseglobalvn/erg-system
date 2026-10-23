import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { buildPreviewTitleStyle, toRenderableDragItems } from "./quiz-editor-slide-render-utils";
import type { QuizEditorSlideAuthoring } from "./quiz-editor-slide-render-types";
import { AttachedMediaPreview, InlineSlideTextArea, SelectableImage } from "./quiz-editor-slide-media";
import { buildSlideLayoutStyles } from "./quiz-editor-slide-layout";

export function DragDropPreview({
  slide,
  showResultTargets,
  size,
  authoring,
  selectedImageId,
  onSelectImage,
  onMoveImage,
}: {
  slide: QuizEditorSlide;
  showResultTargets: boolean;
  size: "stage" | "thumbnail" | "mini";
  authoring?: QuizEditorSlideAuthoring;
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
}) {
  const items = toRenderableDragItems(slide.dragDropItems);
  const layoutStyles = buildSlideLayoutStyles(slide.options?.layoutPreset ?? "title-and-content", false);

  return (
    <div className="classic-slide__layout-stage">
      <div
        className="classic-slide__layout-zone classic-slide__layout-zone--title"
        style={layoutStyles.title}
      >
        {size === "stage" && authoring?.onUpdateTitle ? (
          <InlineSlideTextArea
            value={slide.title}
            className="classic-slide__drag-title classic-slide__inline-editor is-title"
            style={buildPreviewTitleStyle(slide, 26)}
            ariaLabel="Question title"
            onChange={authoring.onUpdateTitle}
          />
        ) : (
          <div className="classic-slide__drag-title" style={buildPreviewTitleStyle(slide, 26)}>
            {slide.title}
          </div>
        )}
      </div>
      <div
        className="classic-slide__layout-zone classic-slide__layout-zone--media"
        style={layoutStyles.mediaArea}
      >
        {slide.media?.src ? (
          <AttachedMediaPreview
            slide={slide}
            elementId="question-media"
            title={slide.media.alt || slide.media.name || "Question media"}
            size={size}
            selectedImageId={selectedImageId}
            onSelectImage={onSelectImage}
            offset={slide.options?.elementOffsets?.["question-media"]}
            onMoveImage={onMoveImage}
            className="classic-slide__drag-media"
          />
        ) : null}
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
            className="classic-slide__food-item"
          >
            <span>{item.emoji}</span>
          </SelectableImage>
        ))}
      </div>

      {showResultTargets ? (
        <div className="classic-slide__result-targets">
          <span className="classic-slide__result-target classic-slide__result-target--correct"><CheckIcon className="h-4 w-4" sx={{ fontSize: "1em" }} /></span>
          <span className="classic-slide__result-target classic-slide__result-target--wrong"><CloseIcon className="h-4 w-4" sx={{ fontSize: "1em" }} /></span>
        </div>
      ) : null}
    </div>
  );
}

