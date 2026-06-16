import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check as CheckIcon } from "@/components/mui-icon-shim";
import { X as CloseIcon } from "@/components/mui-icon-shim";
import { ChevronDown as ExpandMoreIcon } from "@/components/mui-icon-shim";

import {
  getQuizEditorLayoutTemplate,
  toNormalizedStyle,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-layouts";
import { cn } from "@/utils/cn";
import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorElementOffset,
  QuizEditorLayoutPreset,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getQuizThemeDeckStyle } from "@/features/lcms/quiz/quiz-theme";
import {
  buildElementOffsetStyle,
  buildPreviewTextStyle,
  buildPreviewTitleStyle,
  clampOffset,
  getFeedbackRow,
  toRenderableDragItems,
  togglePreviewChoice,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-slide-render-utils";

export type QuizEditorSlideRenderMode = "question" | "correct" | "incorrect";

type SlideRenderProps = {
  slide: QuizEditorSlide;
  size?: "stage" | "thumbnail" | "mini";
  showResultTargets?: boolean;
  themeId?: string;
  renderMode?: QuizEditorSlideRenderMode;
  authoring?: QuizEditorSlideAuthoring;
  selectedImageId?: string | null;
  onSelectImage?: (elementId: string) => void;
  onClearSelection?: () => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
};

export type QuizEditorSlideAuthoring = {
  onUpdateTitle?: (value: string) => void;
  onUpdateInstructions?: (items: string[]) => void;
  onUpdateChoices?: (choices: QuizEditorChoice[]) => void;
};


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

function IntroPreview({
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

function ChoicePreview({
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

function TrueFalsePreview({
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

function DragDropPreview({
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
          <span className="classic-slide__result-target classic-slide__result-target--correct"><CheckIcon className="h-4 w-4" size="1em" /></span>
          <span className="classic-slide__result-target classic-slide__result-target--wrong"><CloseIcon className="h-4 w-4" size="1em" /></span>
        </div>
      ) : null}
    </div>
  );
}

function buildSlideLayoutStyles(layoutPreset: QuizEditorLayoutPreset, compactAnswers: boolean) {
  const template = getQuizEditorLayoutTemplate(layoutPreset);

  return {
    title: toNormalizedStyle(template.zones.title),
    answerArea: toNormalizedStyle(compactAnswers ? narrowAnswerZone(template.zones.answerArea) : template.zones.answerArea),
    mediaArea: toNormalizedStyle(template.zones.mediaArea),
  };
}

function narrowAnswerZone(zone: {
  x: number;
  y: number;
  w: number;
  h: number;
  textAlign?: CSSProperties["textAlign"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
}) {
  const nextWidth = Math.min(zone.w, 0.26);
  return {
    ...zone,
    w: nextWidth,
  };
}

function FeedbackLayerPreview({
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
            <span className="classic-slide__feedback-card-caret"><ExpandMoreIcon className="h-4 w-4" size="1em" /></span>
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
          <span className="classic-slide__feedback-card-caret"><ExpandMoreIcon className="h-4 w-4" size="1em" /></span>
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

function FeedbackItemGroup({
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

function ResultPreview({ slide }: { slide: QuizEditorSlide }) {
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
        {isPassed ? <CheckIcon className="h-8 w-8" size="1em" /> : <CloseIcon className="h-8 w-8" size="1em" />}
      </div>
      <div className="classic-slide__result-copy" style={buildPreviewTextStyle(slide, "feedback", 16)}>
        {isPassed ? passMessage : failMessage}
      </div>
    </div>
  );
}

function AttachedMediaPreview({
  slide,
  elementId,
  title,
  size,
  selectedImageId,
  onSelectImage,
  offset,
  onMoveImage,
  className,
}: {
  slide: QuizEditorSlide;
  elementId: string;
  title: string;
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  offset?: QuizEditorElementOffset;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
  className: string;
}) {
  if (!slide.media?.src) {
    return null;
  }

  return (
    <SelectableImage
      elementId={elementId}
      title={title}
      size={size}
      selectedImageId={selectedImageId}
      onSelectImage={onSelectImage}
      offset={offset}
      onMoveImage={onMoveImage}
      className={className}
    >
      <img
        src={slide.media.src}
        alt={slide.media.alt || slide.title}
        className="classic-slide__attached-media-image"
      />
    </SelectableImage>
  );
}

function SelectableImage({
  elementId,
  title,
  size,
  selectedImageId,
  onSelectImage,
  offset,
  onMoveImage,
  className,
  children,
}: {
  elementId: string;
  title: string;
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  offset?: QuizEditorElementOffset;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
  className: string;
  children: ReactNode;
}) {
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    parentWidth: number;
    parentHeight: number;
    moved: boolean;
  } | null>(null);

  if (size !== "stage" || !onSelectImage) {
    return (
      <div className={className} style={buildElementOffsetStyle(offset)}>
        {children}
      </div>
    );
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectImage(elementId);

    if (!onMoveImage) {
      return;
    }

    const parent = event.currentTarget.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    if (!parentRect) return;

    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offset?.x ?? 0,
      startOffsetY: offset?.y ?? 0,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      moved: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const nextX = clampOffset(state.startOffsetX + (moveEvent.clientX - state.startClientX) / state.parentWidth);
      const nextY = clampOffset(state.startOffsetY + (moveEvent.clientY - state.startClientY) / state.parentHeight);
      state.moved = true;
      onMoveImage(elementId, { x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <button
      type="button"
      title={title}
      onPointerDown={handlePointerDown}
      style={buildElementOffsetStyle(offset)}
      className={cn(className, "classic-slide__selectable-image", selectedImageId === elementId && "is-selected")}
    >
      {children}
    </button>
  );
}

function LayoutGuideOverlay({ layoutPreset }: { layoutPreset: QuizEditorLayoutPreset }) {
  const template = getQuizEditorLayoutTemplate(layoutPreset);

  return (
    <div className="classic-slide__layout-guides" aria-hidden="true">
      <div className="classic-slide__layout-guide is-title" style={toNormalizedStyle(template.zones.title)}>
        <span>Title</span>
      </div>
      <div className="classic-slide__layout-guide is-content" style={toNormalizedStyle(template.zones.answerArea)}>
        <span>Content</span>
      </div>
      <div className="classic-slide__layout-guide is-media" style={toNormalizedStyle(template.zones.mediaArea)}>
        <span>Picture</span>
      </div>
    </div>
  );
}

function InlineSlideTextArea({
  value,
  className,
  style,
  ariaLabel,
  onChange,
}: {
  value: string;
  className: string;
  style?: CSSProperties;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={2}
      aria-label={ariaLabel}
      className={className}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function InlineSlideInput({
  value,
  className,
  style,
  ariaLabel,
  onChange,
}: {
  value: string;
  className: string;
  style?: CSSProperties;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      className={className}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
