import { getQuizThemeDeckStyle } from "@/features/lcms/quiz/quiz-theme";
import { cn } from "@/utils/cn";
import type { SlideRenderProps } from "./quiz-editor-slide-render-types";
import { IntroPreview } from "./quiz-editor-slide-intro-preview";
import { ChoicePreview, TrueFalsePreview } from "./quiz-editor-slide-choice-preview";
import { DragDropPreview } from "./quiz-editor-slide-drag-drop-preview";
import { FeedbackLayerPreview, ResultPreview } from "./quiz-editor-slide-feedback-preview";
import { LayoutGuideOverlay } from "./quiz-editor-slide-layout";

export type { QuizEditorSlideAuthoring, QuizEditorSlideRenderMode } from "./quiz-editor-slide-render-types";

export function QuizEditorSlideRender({
  slide,
  size = "stage",
  showResultTargets = false,
  themeId,
  renderMode = "question",
  authoring,
  selectedImageId = null,
  onSelectImage,
  onClearSelection,
  onMoveImage,
}: SlideRenderProps) {
  const isInteractive = size === "stage";
  const layoutPreset = slide.options?.layoutPreset ?? "title-and-content";
  const answerColumns = slide.options?.answerColumns ?? 1;
  const animationPreset = slide.options?.animationPreset ?? "none";
  const showLayoutGuides =
    size === "stage" &&
    renderMode === "question" &&
    (slide.kind === "multiple-response" ||
      slide.kind === "multiple-choice" ||
      slide.kind === "true-false" ||
      slide.kind === "drag-and-drop");

  return (
    <div
      className={cn(
        "classic-slide",
        `is-${size}`,
        `has-layout-${layoutPreset}`,
        answerColumns === 2 && "has-two-columns",
        animationPreset !== "none" && `has-animation-${animationPreset}`,
        showResultTargets && "has-result-targets",
      )}
      style={getQuizThemeDeckStyle(themeId)}
      onClick={isInteractive ? onClearSelection : undefined}
    >
      <div className="classic-slide__wash" />
      <div className="classic-slide__swirl classic-slide__swirl--top" />
      <div className="classic-slide__swirl classic-slide__swirl--bottom" />
      <div className="classic-slide__blob" />
      <div className="classic-slide__leaf classic-slide__leaf--a" />
      <div className="classic-slide__leaf classic-slide__leaf--b" />
      <div className="classic-slide__leaf classic-slide__leaf--c" />
      {showLayoutGuides ? (
        <LayoutGuideOverlay layoutPreset={layoutPreset} />
      ) : null}

      {renderMode !== "question" && slide.kind !== "result-slide" ? (
        <FeedbackLayerPreview
          slide={slide}
          mode={renderMode}
          size={size}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onMoveImage={onMoveImage}
        />
      ) : null}

      {renderMode === "question" && (slide.kind === "intro-slide" || slide.kind === "info-slide" || slide.kind === "instruction-slide") ? (
        <IntroPreview
          slide={slide}
          size={size}
          authoring={authoring}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onMoveImage={onMoveImage}
        />
      ) : null}

      {renderMode === "question" && (slide.kind === "multiple-response" || slide.kind === "multiple-choice") ? (
        <ChoicePreview
          slide={slide}
          size={size}
          authoring={authoring}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onMoveImage={onMoveImage}
        />
      ) : null}

      {renderMode === "question" && slide.kind === "true-false" ? (
        <TrueFalsePreview
          slide={slide}
          size={size}
          authoring={authoring}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onMoveImage={onMoveImage}
        />
      ) : null}

      {renderMode === "question" && slide.kind === "drag-and-drop" ? (
        <DragDropPreview
          slide={slide}
          showResultTargets={showResultTargets}
          size={size}
          authoring={authoring}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onMoveImage={onMoveImage}
        />
      ) : null}

      {slide.kind === "result-slide" ? <ResultPreview slide={slide} /> : null}
    </div>
  );
}
