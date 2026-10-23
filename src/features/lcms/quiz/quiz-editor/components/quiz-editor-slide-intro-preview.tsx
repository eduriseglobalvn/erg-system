import { useI18n } from "@/platform/i18n";
import type { QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { buildPreviewTextStyle, buildPreviewTitleStyle } from "./quiz-editor-slide-render-utils";
import type { QuizEditorSlideAuthoring } from "./quiz-editor-slide-render-types";
import { AttachedMediaPreview, InlineSlideInput, InlineSlideTextArea, SelectableImage } from "./quiz-editor-slide-media";

export function IntroPreview({
  slide,
  size,
  authoring,
  selectedImageId,
  onSelectImage,
  onMoveImage,
}: {
  slide: QuizEditorSlide;
  size: "stage" | "thumbnail" | "mini";
  authoring?: QuizEditorSlideAuthoring;
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
}) {
  const { t } = useI18n();
  const instructionItems = slide.instructions?.length
    ? slide.instructions
    : [t("quiz.searchHintBullet1"), t("quiz.searchHintBullet2")];
  const canEdit = size === "stage" && Boolean(authoring);

  return (
    <div className="classic-slide__intro">
      <div className="classic-slide__intro-card">
        {canEdit && authoring?.onUpdateTitle ? (
          <InlineSlideTextArea
            value={slide.title}
            className="classic-slide__intro-title classic-slide__inline-editor is-title"
            style={buildPreviewTitleStyle(slide, 24)}
            ariaLabel={t("common.title")}
            onChange={authoring.onUpdateTitle}
          />
        ) : (
          <div className="classic-slide__intro-title" style={buildPreviewTitleStyle(slide, 24)}>
            {slide.title}
          </div>
        )}
        <div className="classic-slide__intro-copy" style={buildPreviewTextStyle(slide, "textBox", 12)}>
          {t("quiz.searchHintIntro")}
        </div>
        <ul className="classic-slide__intro-list" style={buildPreviewTextStyle(slide, "textBox", 11)}>
          {instructionItems.map((item, index) => (
            <li key={`instruction-${index}`}>
              {canEdit && authoring?.onUpdateInstructions ? (
                <InlineSlideInput
                  value={item}
                  ariaLabel={`${t("quiz.instructionsLabel")} ${index + 1}`}
                  className="classic-slide__inline-editor"
                  onChange={(value) => {
                    const nextItems = [...instructionItems];
                    nextItems[index] = value;
                    authoring.onUpdateInstructions?.(nextItems);
                  }}
                />
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      </div>
      {slide.media?.src ? (
        <AttachedMediaPreview
          slide={slide}
          elementId="intro-portrait"
          title={slide.media.alt || slide.media.name || "Intro media"}
          size={size}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          offset={slide.options?.elementOffsets?.["intro-portrait"]}
          onMoveImage={onMoveImage}
          className="classic-slide__portrait classic-slide__portrait--media"
        />
      ) : (
        <SelectableImage
          elementId="intro-portrait"
          title="Portrait"
          size={size}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          offset={slide.options?.elementOffsets?.["intro-portrait"]}
          onMoveImage={onMoveImage}
          className="classic-slide__portrait"
        >
          <div className="classic-slide__portrait-circle" />
          <div className="classic-slide__portrait-head" />
          <div className="classic-slide__portrait-body" />
        </SelectableImage>
      )}
    </div>
  );
}

