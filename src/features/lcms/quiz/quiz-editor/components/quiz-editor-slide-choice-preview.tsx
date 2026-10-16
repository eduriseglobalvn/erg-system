import { useI18n } from "@/platform/i18n";
import { cn } from "@/utils/cn";
import type { QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { buildPreviewTextStyle, buildPreviewTitleStyle, togglePreviewChoice } from "./quiz-editor-slide-render-utils";
import type { QuizEditorSlideAuthoring } from "./quiz-editor-slide-render-types";
import { AttachedMediaPreview, InlineSlideInput, InlineSlideTextArea } from "./quiz-editor-slide-media";
import { buildSlideLayoutStyles } from "./quiz-editor-slide-layout";

export function ChoicePreview({
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
  const markerClass =
    slide.choiceControlType === "radio"
      ? "classic-slide__choice-radio"
      : "classic-slide__choice-check";
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
            className="classic-slide__question-title classic-slide__inline-editor is-title"
            style={buildPreviewTitleStyle(slide, 26)}
            ariaLabel="Question title"
            onChange={authoring.onUpdateTitle}
          />
        ) : (
          <div className="classic-slide__question-title" style={buildPreviewTitleStyle(slide, 26)}>
            {slide.title}
          </div>
        )}
      </div>
      <div
        className="classic-slide__layout-zone classic-slide__layout-zone--answers"
        style={layoutStyles.answerArea}
      >
        {(slide.choices ?? []).map((choice, index) => (
          <div key={choice.id} className={cn("classic-slide__choice-row", size === "stage" && authoring?.onUpdateChoices && "is-authoring")}>
            {size === "stage" && authoring?.onUpdateChoices ? (
              <>
                <button
                  type="button"
                  className={cn("classic-slide__choice-correct-toggle", choice.correct && "is-correct")}
                  aria-label={`Correct answer ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    authoring.onUpdateChoices?.(togglePreviewChoice(slide.choices ?? [], choice.id, slide.choiceControlType ?? "checkbox"));
                  }}
                >
                  <span className={markerClass} />
                </button>
                <InlineSlideInput
                  value={choice.label}
                  className="classic-slide__inline-editor is-choice"
                  ariaLabel={`Answer ${index + 1}`}
                  style={{ ...buildPreviewTextStyle(slide, "answer", 14), flex: 1 }}
                  onChange={(value) => {
                    authoring.onUpdateChoices?.(
                      (slide.choices ?? []).map((entry) =>
                        entry.id === choice.id ? { ...entry, label: value } : entry,
                      ),
                    );
                  }}
                />
              </>
            ) : (
              <>
                <span className={markerClass} />
                <span style={{ ...buildPreviewTextStyle(slide, "answer", 14), flex: 1 }}>{choice.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
      {slide.media?.src ? (
        <div
          className="classic-slide__layout-zone classic-slide__layout-zone--media"
          style={layoutStyles.mediaArea}
        >
          <AttachedMediaPreview
            slide={slide}
            elementId="question-media"
            title={slide.media.alt || slide.media.name || "Question media"}
            size={size}
            selectedImageId={selectedImageId}
            onSelectImage={onSelectImage}
            offset={slide.options?.elementOffsets?.["question-media"]}
            onMoveImage={onMoveImage}
            className="classic-slide__attached-media"
          />
        </div>
      ) : null}
    </div>
  );
}

export function TrueFalsePreview({
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
  const layoutStyles = buildSlideLayoutStyles(slide.options?.layoutPreset ?? "title-and-content", true);

  return (
    <div className="classic-slide__layout-stage">
      <div
        className="classic-slide__layout-zone classic-slide__layout-zone--title"
        style={layoutStyles.title}
      >
        {size === "stage" && authoring?.onUpdateTitle ? (
          <InlineSlideTextArea
            value={slide.title}
            className="classic-slide__question-title classic-slide__inline-editor is-title"
            style={buildPreviewTitleStyle(slide, 26)}
            ariaLabel="Question title"
            onChange={authoring.onUpdateTitle}
          />
        ) : (
          <div className="classic-slide__question-title" style={buildPreviewTitleStyle(slide, 26)}>
            {slide.title}
          </div>
        )}
      </div>
      <div
        className="classic-slide__layout-zone classic-slide__layout-zone--answers is-compact"
        style={layoutStyles.answerArea}
      >
        {(slide.choices ?? []).length > 0
          ? (slide.choices ?? []).map((choice, index) => (
              <div key={choice.id} className={cn("classic-slide__choice-row", size === "stage" && authoring?.onUpdateChoices && "is-authoring")}>
                {size === "stage" && authoring?.onUpdateChoices ? (
                  <>
                    <button
                      type="button"
                      className={cn("classic-slide__choice-correct-toggle", choice.correct && "is-correct")}
                      aria-label={`Correct answer ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        authoring.onUpdateChoices?.(togglePreviewChoice(slide.choices ?? [], choice.id, "radio"));
                      }}
                    >
                      <span className="classic-slide__choice-radio" />
                    </button>
                    <InlineSlideInput
                      value={choice.label}
                      className="classic-slide__inline-editor is-choice"
                      ariaLabel={`Answer ${index + 1}`}
                      style={{ ...buildPreviewTextStyle(slide, "answer", 14), flex: 1 }}
                      onChange={(value) => {
                        authoring.onUpdateChoices?.(
                          (slide.choices ?? []).map((entry) =>
                            entry.id === choice.id ? { ...entry, label: value } : entry,
                          ),
                        );
                      }}
                    />
                  </>
                ) : (
                  <>
                    <span className="classic-slide__choice-radio" />
                    <span style={{ ...buildPreviewTextStyle(slide, "answer", 14), flex: 1 }}>{choice.label}</span>
                  </>
                )}
              </div>
            ))
          : [t("player.yes"), t("player.no")].map((choice) => (
              <div key={choice} className="classic-slide__choice-row">
                <span className="classic-slide__choice-radio" />
                <span style={{ ...buildPreviewTextStyle(slide, "answer", 14), flex: 1 }}>{choice}</span>
              </div>
            ))}
      </div>
      {slide.media?.src ? (
        <div
          className="classic-slide__layout-zone classic-slide__layout-zone--media"
          style={layoutStyles.mediaArea}
        >
          <AttachedMediaPreview
            slide={slide}
            elementId="question-media"
            title={slide.media.alt || slide.media.name || "Question media"}
            size={size}
            selectedImageId={selectedImageId}
            onSelectImage={onSelectImage}
            offset={slide.options?.elementOffsets?.["question-media"]}
            onMoveImage={onMoveImage}
            className="classic-slide__attached-media"
          />
        </div>
      ) : null}
    </div>
  );
}

