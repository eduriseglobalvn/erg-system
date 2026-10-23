import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { defaultQuizTheme } from "@/features/lcms/quiz/quiz-theme";
import {
  buildQuizTextStyle,
  resolveSlideTextStyle,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { buildPreviewTitleStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-slide-render-utils";
import { useI18n } from "@/platform/i18n";
import { createInitialAnswer } from "@/lib/quiz";
import type { AnswerPayload, Question } from "@/lib/types";
import type {
  QuizEditorChoice,
  QuizEditorFeedbackRow,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

type PreviewMode = "question" | "correct" | "incorrect";

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

const previewTheme = {
  themeId: defaultQuizTheme.id,
  theme: defaultQuizTheme.theme,
};

const ergLogoUrl = "https://media.erg.edu.vn/logo/erg.png";

const hotspotPlaceholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23dbeafe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Ccircle cx='880' cy='250' r='130' fill='%23bfdbfe'/%3E%3Crect x='210' y='200' width='520' height='270' rx='32' fill='%23ffffff' stroke='%2393c5fd' stroke-width='8'/%3E%3Cpath d='M300 410l120-120 98 90 92-72 90 102z' fill='%2393c5fd'/%3E%3Ccircle cx='360' cy='275' r='36' fill='%23f97316'/%3E%3C/svg%3E";

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

function buildPreviewQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  if (slide.runtimeQuestion) {
    return {
      ...slide.runtimeQuestion,
      title: slide.title,
      instructions: slide.description ?? slide.runtimeQuestion.instructions,
      contentImage: slide.media
        ? undefined
        : slide.runtimeQuestion.contentImage,
    };
  }

  return buildLearnerQuestion(slide, t);
}

function LearnerPreviewShell({
  slide,
  themeId,
  readOnly,
  onUpdateTitle,
  onUpdateSlideMedia,
  onTextTargetFocus,
  children,
}: {
  slide: QuizEditorSlide;
  themeId?: string;
  readOnly: boolean;
  onUpdateTitle: (value: string) => void;
  onUpdateSlideMedia?: (media: QuizEditorSlideMedia) => void;
  onTextTargetFocus?: (target: QuizEditorTextStyleTarget) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const previewQuizTheme = {
    themeId: themeId ?? previewTheme.themeId,
    theme: themeId ? null : previewTheme.theme,
  };
  const titleTextStyle = buildAuthoringTitleStyle(slide);
  const questionThemeStyle = {
    ...buildQuestionThemeStyle(slide.options?.themeColor),
    ...buildAuthoringTextVariables(slide),
  } as CSSProperties;

  return (
    <QuizThemeSurface quiz={previewQuizTheme} className="classic-editor__learner-surface" style={questionThemeStyle}>
      <section className="classic-editor__learner-player">
        <div className="classic-editor__learner-player-top">
          <span>ERG E-LEARNING</span>
          <span>{t("quiz.learnerViewEditor")}</span>
        </div>

        <div className="classic-editor__learner-canvas">
          <div className="classic-editor__learner-title-band">
            {readOnly ? (
              <h2 className="classic-editor__learner-title-readonly">{slide.title}</h2>
            ) : (
              <BufferedTextarea
                value={slide.title}
                rows={2}
                className="classic-editor__learner-title-input"
                style={titleTextStyle}
                onCommit={onUpdateTitle}
                onFocusTarget={() => onTextTargetFocus?.("question")}
                aria-label={t("common.questionTitle")}
              />
            )}
          </div>

          <span className="classic-editor__learner-shape classic-editor__learner-shape--mountain" aria-hidden="true" />
          <img className="classic-editor__learner-logo" src={ergLogoUrl} alt="" aria-hidden="true" />
          <div className={cn("classic-editor__learner-content", slide.media && slide.kind !== "hotspot" && "has-floating-media")}>
            {slide.media && slide.kind !== "hotspot" ? (
              <DraggableSlideMedia
                media={slide.media}
                readOnly={readOnly}
                onChange={(media) => onUpdateSlideMedia?.(media)}
              />
            ) : null}
            {children}
          </div>
        </div>

        <div className="classic-editor__learner-footer">
          <button type="button" className="classic-editor__learner-secondary" disabled>
            {t("quiz.previousQuestion")}
          </button>
          <button type="button" className="classic-editor__learner-primary" disabled>
            {t("quiz.nextQuestion")}
          </button>
        </div>
      </section>
    </QuizThemeSurface>
  );
}

function buildQuestionThemeStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined;

  return {
    ["--quiz-header-bg" as string]: color,
    ["--quiz-header-text" as string]: "#ffffff",
    ["--quiz-accent-start" as string]: color,
    ["--quiz-accent-end" as string]: color,
    ["--quiz-option-selected-bg" as string]: `${color}14`,
    ["--quiz-sidebar-active-bg" as string]: color,
    ["--quiz-sidebar-active-text" as string]: "#ffffff",
    ["--classic-slide-accent-gradient" as string]: color,
    ["--classic-slide-accent-soft" as string]: color,
    ["--classic-slide-accent-strong" as string]: color,
  };
}

function buildAuthoringTitleStyle(slide: QuizEditorSlide): CSSProperties {
  const questionStyle = buildQuizTextStyle(resolveSlideTextStyle(slide, "question"));
  return {
    ...buildPreviewTitleStyle(slide, 34),
    ...questionStyle,
    color: "#ffffff",
    caretColor: "#ffffff",
    fontWeight: resolveSlideTextStyle(slide, "question").bold ? 900 : 760,
    letterSpacing: "0",
    textShadow: "0 2px 0 rgba(0, 0, 0, 0.1)",
    textAlign: "left",
  };
}

function buildAuthoringTextVariables(slide: QuizEditorSlide): CSSProperties {
  const answer = resolveSlideTextStyle(slide, "answer");
  const answerStyle = buildQuizTextStyle(answer);
  const answerSize = Math.max(18, Number.parseFloat(String(answerStyle.fontSize)) || answer.fontSize);

  return {
    ["--quiz-author-answer-font" as string]: answerStyle.fontFamily,
    ["--quiz-author-answer-size" as string]: `${answerSize}px`,
    ["--quiz-author-answer-weight" as string]: String(answerStyle.fontWeight),
    ["--quiz-author-answer-style" as string]: String(answerStyle.fontStyle),
    ["--quiz-author-answer-decoration" as string]: String(answerStyle.textDecoration),
    ["--quiz-readable-size" as string]: `${answerSize}px`,
    ["--quiz-readable-size-lg" as string]: `${answerSize + 2}px`,
  };
}

function DraggableSlideMedia({
  media,
  readOnly,
  onChange,
}: {
  media: QuizEditorSlideMedia;
  readOnly: boolean;
  onChange: (media: QuizEditorSlideMedia) => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const position = {
    x: clampUnit(media.x ?? 0.74),
    y: clampUnit(media.y ?? 0.48),
    width: Math.min(0.5, Math.max(0.2, media.width ?? 0.34)),
  };

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    if ((event.target as HTMLElement).closest("[data-media-resize]")) return;
    const parent = frameRef.current?.parentElement;
    if (!parent) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = parent.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = position;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextX = clampUnit(start.x + (moveEvent.clientX - startX) / rect.width);
      const nextY = clampUnit(start.y + (moveEvent.clientY - startY) / rect.height);
      onChange({ ...media, x: nextX, y: nextY, width: start.width });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    const parent = frameRef.current?.parentElement;
    if (!parent) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = parent.getBoundingClientRect();
    const startX = event.clientX;
    const startWidth = position.width;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(0.5, Math.max(0.2, startWidth + (moveEvent.clientX - startX) / rect.width));
      onChange({ ...media, x: position.x, y: position.y, width: nextWidth });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <div
      ref={frameRef}
      className={cn("classic-editor__learner-floating-media", !readOnly && "is-draggable")}
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        width: `${position.width * 100}%`,
      }}
      onPointerDown={handlePointerDown}
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      aria-label="Kéo để đổi vị trí ảnh"
    >
      <img src={media.src} alt={media.alt} draggable={false} />
      {!readOnly ? <span>Kéo ảnh</span> : null}
      {!readOnly ? (
        <button
          type="button"
          data-media-resize
          className="classic-editor__learner-floating-media-resize"
          onPointerDown={handleResizePointerDown}
          aria-label="Kéo để đổi kích thước ảnh"
        />
      ) : null}
    </div>
  );
}

function clampUnit(value: number) {
  return Math.min(0.92, Math.max(0.08, value));
}

function LearnerInstructionScreen({
  slide,
  readOnly,
  onUpdateInstructions,
}: {
  slide: QuizEditorSlide;
  readOnly: boolean;
  onUpdateInstructions: (items: string[]) => void;
}) {
  const { t } = useI18n();
  const instructions = slide.instructions?.length ? slide.instructions : [slide.description ?? ""];

  function updateInstruction(index: number, value: string) {
    onUpdateInstructions(instructions.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addInstruction() {
    onUpdateInstructions([...instructions, ""]);
  }

  function removeInstruction(index: number) {
    onUpdateInstructions(instructions.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="classic-editor__learner-instruction">
      <div className="classic-editor__learner-intro-card">
        <strong>{t("quiz.quizInstructions")}</strong>
        <span>{t("quiz.learnerViewEditorCopy")}</span>
      </div>

      {slide.media ? (
        <img
          src={slide.media.src}
          alt={slide.media.alt}
          className="classic-editor__learner-instruction-image"
        />
      ) : null}

      <div className="classic-editor__learner-steps">
        {instructions.map((item, index) => (
          <div
            key={`${slide.id}-instruction-${index}`}
            className={cn("classic-editor__learner-step", readOnly && "is-readonly")}
          >
            <span>{index + 1}</span>
            {readOnly ? (
              <p>{item}</p>
            ) : (
              <>
                <BufferedTextarea
                  value={item}
                  rows={2}
                  onCommit={(value) => updateInstruction(index, value)}
                  aria-label={`${t("common.description")} ${index + 1}`}
                />
                <button type="button" onClick={() => removeInstruction(index)} aria-label={t("common.remove")}>
                  x
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {readOnly ? null : (
        <button type="button" className="classic-editor__learner-add-step" onClick={addInstruction}>
          + {t("common.description")}
        </button>
      )}
    </div>
  );
}

function LearnerInformationLandingScreen({ slide }: { slide: QuizEditorSlide }) {
  const page = slide.infoPage;
  if (!page) return null;

  const contributors = page.contributors.split(/\r?\n/).filter(Boolean);

  return (
    <div className={cn("classic-editor__learner-info-landing", `is-${page.theme}`)}>
      <div className="classic-editor__learner-info-top">
        <strong>{page.organization}</strong>
        <span>{page.version}</span>
      </div>
      <div className="classic-editor__learner-info-art" aria-hidden="true">
        <span className="is-line-a" />
        <span className="is-line-b" />
        <span className="is-circle-a" />
        <span className="is-person">
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="classic-editor__learner-info-copy">
        <strong>{page.courseTitle}</strong>
        <span>{page.lessonTitle}</span>
        <b>{page.testTitle}</b>
        <i />
        <p>
          <span>Lecturer:</span> {page.lecturer}
        </p>
        <ul>
          {contributors.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </div>
      <div className="classic-editor__learner-info-footer">
        <p>{slide.description}</p>
        <button type="button" disabled>
          {page.startButtonLabel}
        </button>
      </div>
    </div>
  );
}

function LearnerResultScreen({ slide }: { slide: QuizEditorSlide }) {
  const { t } = useI18n();
  const passMessage =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.greatYoureSharp");
  const failMessage =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.tryAgainMessage");

  return (
    <div className="classic-editor__learner-result">
      <div className="classic-editor__learner-result-card is-pass">
        <span>{t("common.correct")}</span>
        <strong>{passMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "88%" }} />
        </div>
      </div>
      <div className="classic-editor__learner-result-card is-fail">
        <span>{t("common.incorrect")}</span>
        <strong>{failMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "42%" }} />
        </div>
      </div>
    </div>
  );
}

type BufferedTextProps = {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  mediaTarget?: {
    kind: "choice" | "drag-item";
    id: string;
    field?: "label" | "target";
  };
  onFocusTarget?: () => void;
  "aria-label"?: string;
};

function BufferedTextarea({
  value,
  onCommit,
  className,
  style,
  rows,
  placeholder,
  mediaTarget,
  onFocusTarget,
  "aria-label": ariaLabel,
}: BufferedTextProps) {
  const { draft, handleBlur, handleChange, handleFocus } = useBufferedText(value, onCommit);
  const textAreaRef = useAutoResizeTextarea(draft);

  return (
    <textarea
      ref={textAreaRef}
      className={className}
      value={draft}
      rows={rows}
      style={style}
      data-media-target-kind={mediaTarget?.kind}
      data-media-target-id={mediaTarget?.id}
      data-media-target-field={mediaTarget?.field}
      placeholder={placeholder}
      onFocus={() => {
        onFocusTarget?.();
        handleFocus();
      }}
      onBlur={handleBlur}
      onChange={(event) => handleChange(event.target.value)}
      aria-label={ariaLabel}
    />
  );
}

function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return ref;
}

function useBufferedText(value: string, onCommit: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const commitRef = useRef(onCommit);
  const focusedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function commit(nextValue: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    commitRef.current(nextValue);
  }

  function handleChange(nextValue: string) {
    setDraft(nextValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => commitRef.current(nextValue), 90);
  }

  function handleFocus() {
    focusedRef.current = true;
  }

  function handleBlur() {
    focusedRef.current = false;
    commit(draft);
  }

  return { draft, handleBlur, handleChange, handleFocus };
}

function buildLearnerQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  const feedback = buildFeedback(slide, t);
  const points = extractCorrectScore(slide);
  const contentImage = slide.media
    ? undefined
    : undefined;
  const base = {
    id: slide.id,
    title: slide.title,
    instructions: slide.description,
    points,
    feedback,
    contentImage,
  };

  switch (slide.kind) {
    case "multiple-choice":
    case "true-false":
      return {
        ...base,
        kind: "single_choice",
        choices: normalizeChoices(slide.choices, t),
      };
    case "multiple-response":
      return {
        ...base,
        kind: "multiple_response",
        choices: normalizeChoices(slide.choices, t),
      };
    case "matching":
      return {
        ...base,
        kind: "matching",
        matching: buildMatchingPairs(slide, t),
      };
    case "drag-and-drop":
      return {
        ...base,
        kind: "drag_drop",
        dropTargets: buildDragDropTargets(slide),
        dragDropItems: buildDragDropItems(slide, t),
      };
    case "sequence":
      return {
        ...base,
        kind: "sequence",
        sequenceItems: normalizeChoices(slide.choices, t).map((choice) => ({
          id: choice.id,
          label: choice.label,
        })),
      };
    case "fill-in-the-blanks":
      return {
        ...base,
        kind: "fill_blank",
        textBlanks: buildTextBlanks(slide, t),
      };
    case "select-from-lists":
      return {
        ...base,
        kind: "select_from_lists",
        inlineBlanks: buildInlineBlanks(slide, t),
      };
    case "drag-the-words":
      return {
        ...base,
        kind: "drag_words",
        wordBank: buildWordBank(slide, t),
        wordSlots: buildWordSlots(slide, t),
      };
    case "short-answer":
      return {
        ...base,
        kind: "short_answer",
        textBlanks: buildTextBlanks(slide, t),
      };
    case "numeric":
      return {
        ...base,
        kind: "numeric",
        numericAnswer: buildNumericAnswer(slide),
      };
    case "essay":
      return {
        ...base,
        kind: "essay",
        essayRubric: buildEssayRubric(slide, t),
      };
    case "likert-scale":
      return {
        ...base,
        kind: "likert_scale",
        likertRows: buildLikertRows(slide, t),
        likertScale: buildLikertScale(),
      };
    case "hotspot":
      return {
        ...base,
        kind: "hotspot",
        hotspotImage: {
          url: slide.media?.src ?? hotspotPlaceholderImage,
          width: 1200,
          height: 675,
        },
        hotspotAreas: slide.hotspotAreas?.length
          ? slide.hotspotAreas
          : [
              {
                id: `${slide.id}-hotspot-1`,
                shape: "rect",
                x: 0.36,
                y: 0.3,
                width: 0.28,
                height: 0.28,
                correct: true,
              },
            ],
      };
    default:
      return null;
  }
}

function normalizeChoices(
  choices: QuizEditorChoice[] | undefined,
  t: ReturnType<typeof useI18n>["t"],
) {
  const source = choices?.length
    ? choices
    : [
        { id: "choice-a", label: `${t("common.option")} 1`, correct: true },
        { id: "choice-b", label: `${t("common.option")} 2`, correct: false },
      ];

  return source.map((choice, index) => ({
    id: choice.id || `choice-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
    correct: choice.correct,
  }));
}

function buildTextBlanks(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t)
    .filter((choice) => slide.kind !== "short-answer" || choice.correct)
    .map((choice, index) => ({
      id: choice.id || `${slide.id}-blank-${index + 1}`,
      label: slide.kind === "fill-in-the-blanks" ? `Blank ${index + 1}` : "Answer",
      placeholder: "......",
      correctAnswers: [choice.label || `${t("common.option")} ${index + 1}`],
    }));
}

function buildInlineBlanks(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id,
    statement: choice.label || `${t("common.option")} ${index + 1}`,
    options: ["yes", "no"],
    correctOptionId: choice.correct ? "yes" : "no",
    selectPosition: "after" as const,
  }));
}

function buildWordBank(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const choices = normalizeChoices(slide.choices, t);
  return choices.map((choice, index) => ({
    id: choice.id || `${slide.id}-word-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
  }));
}

function buildWordSlots(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const bank = buildWordBank(slide, t);
  const source = bank.length ? bank : [{ id: `${slide.id}-word-1`, label: t("common.option") }];

  return source.slice(0, Math.max(1, Math.min(2, source.length))).map((word, index) => ({
    id: `${slide.id}-slot-${index + 1}`,
    label: index === 0 ? "Fill the blank with" : "then choose",
    correctWordId: word.id,
  }));
}

function buildNumericAnswer(slide: QuizEditorSlide) {
  const rawValue = slide.choices?.find((choice) => choice.correct)?.label ?? slide.choices?.[0]?.label ?? "0";
  const parsedValue = Number.parseFloat(rawValue.replace(/[^\d.-]/g, ""));

  return {
    correctValue: Number.isFinite(parsedValue) ? parsedValue : 0,
    tolerance: 0,
    unit: "",
  };
}

function buildEssayRubric(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const choices = normalizeChoices(slide.choices, t);
  return choices.map((choice, index) => ({
    id: choice.id || `${slide.id}-rubric-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
    points: index === 0 ? Math.max(1, extractCorrectScore(slide)) : 1,
  }));
}

function buildLikertRows(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id || `${slide.id}-likert-row-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
  }));
}

function buildLikertScale() {
  return [
    { id: "scale-1", label: "Low", value: 1 },
    { id: "scale-2", label: "Medium", value: 2 },
    { id: "scale-3", label: "High", value: 3 },
  ];
}

function buildMatchingPairs(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (slide.dragDropItems?.length) {
    return slide.dragDropItems.map((item, index) => ({
      id: item.id || `match-${index + 1}`,
      prompt: item.target || t("common.dropTarget"),
      response: item.label || t("common.dragItem"),
      promptImage: item.targetMedia?.src
        ? {
            url: item.targetMedia.src,
            alt: item.targetMedia.alt || item.target,
          }
        : undefined,
      responseImage: item.media?.src
        ? {
            url: item.media.src,
            alt: item.media.alt || item.label,
          }
        : undefined,
    }));
  }

  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id || `match-${index + 1}`,
    prompt: choice.label,
    response: choice.correct ? t("common.correct") : t("common.incorrect"),
  }));
}

function buildDragDropTargets(slide: QuizEditorSlide) {
  const targetLabels = Array.from(
    new Set((slide.dragDropItems ?? []).map((item) => normalizeTargetLabel(item.target))),
  );
  const source = targetLabels.length ? targetLabels : ["Vùng thả 1"];

  return source.map((label, index) => ({
    id: createDragDropTargetId(label, index),
    label,
  }));
}

function buildDragDropItems(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const targets = buildDragDropTargets(slide);
  const targetIdByLabel = new Map(targets.map((target) => [target.label, target.id]));
  const source = slide.dragDropItems?.length
    ? slide.dragDropItems
    : [{ id: "drag-item-1", label: t("common.dragItem"), emoji: "", target: targets[0]?.label ?? "Vùng thả 1" }];

  return source.map((item, index) => {
    const targetLabel = normalizeTargetLabel(item.target);
    return {
      id: item.id || `drag-item-${index + 1}`,
      label: item.label || `${t("common.dragItem")} ${index + 1}`,
      correctTargetId: targetIdByLabel.get(targetLabel) ?? targets[0]?.id ?? "drop-target-1",
    };
  });
}

function normalizeTargetLabel(target: string | undefined) {
  return target?.trim() || "Vùng thả 1";
}

function createDragDropTargetId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `drop-target-${slug || index + 1}`;
}

function buildFeedback(slide: QuizEditorSlide, t: ReturnType<typeof useI18n>["t"]) {
  const correct =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.defaultCorrectFeedback");
  const incorrect =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.defaultIncorrectFeedback");

  return {
    correct,
    incorrect,
    partial: incorrect,
  };
}

function createPreviewAnswer(question: Question, previewMode: PreviewMode): AnswerPayload {
  if (previewMode === "question") {
    return createInitialAnswer(question);
  }

  const correct = previewMode === "correct";

  switch (question.kind) {
    case "single_choice": {
      const choice = correct
        ? question.choices?.find((item) => item.correct)
        : question.choices?.find((item) => !item.correct) ?? question.choices?.[0];
      return choice ? { choiceId: choice.id } : {};
    }
    case "multiple_response": {
      const choices = question.choices?.filter((item) => (correct ? item.correct : !item.correct)) ?? [];
      return { choiceIds: choices.map((choice) => choice.id) };
    }
    case "matching": {
      const order = question.matching?.map((pair) => pair.id) ?? [];
      return { matchingOrder: correct ? order : [...order].reverse(), matchingConnectedRows: order };
    }
    case "sequence": {
      const order = question.sequenceItems?.map((item) => item.id) ?? [];
      return { sequenceOrder: correct ? order : [...order].reverse() };
    }
    case "inline_choice":
      return {
        inlineSelections: Object.fromEntries(
          (question.inlineBlanks ?? []).map((blank) => [
            blank.id,
            correct ? blank.correctOptionId : blank.options.find((option) => option !== blank.correctOptionId) ?? "",
          ]),
        ),
      };
    case "hotspot": {
      const area = question.hotspotAreas?.find((item) => item.correct);
      return {
        hotspotPoint:
          correct && area
            ? { x: area.x + area.width / 2, y: area.y + area.height / 2 }
            : { x: 0.12, y: 0.16 },
      };
    }
    default:
      return {};
  }
}

function getFeedbackText(slide: QuizEditorSlide, previewMode: PreviewMode) {
  if (previewMode === "question") {
    return "";
  }

  return slide.feedbackRows?.find((row) =>
    previewMode === "correct" ? row.kind === "correct" : row.kind === "incorrect",
  )?.feedback;
}

function updateFeedbackText(
  rows: QuizEditorFeedbackRow[] | undefined,
  previewMode: PreviewMode,
  feedback: string,
) {
  const targetKind: QuizEditorFeedbackRow["kind"] = previewMode === "correct" ? "correct" : "incorrect";
  const sourceRows: QuizEditorFeedbackRow[] = rows?.length
    ? rows
    : [
        { id: "feedback-correct", kind: "correct" as const, feedback: "", score: 10, branching: "By Result" as const },
        { id: "feedback-incorrect", kind: "incorrect" as const, feedback: "", score: 0, branching: "By Result" as const },
      ];

  if (sourceRows.some((row) => row.kind === targetKind)) {
    return sourceRows.map((row) => (row.kind === targetKind ? { ...row, feedback } : row));
  }

  return [
    ...sourceRows,
    {
      id: `feedback-${targetKind}`,
      kind: targetKind,
      feedback,
      score: targetKind === "correct" ? 10 : 0,
      branching: "By Result" as const,
    },
  ];
}

function isInstructionLikeSlide(kind: QuizEditorSlide["kind"]) {
  return kind === "instruction-slide" || kind === "intro-slide" || kind === "info-slide" || kind === "user-info";
}

function extractCorrectScore(slide: QuizEditorSlide) {
  return (
    slide.feedbackRows?.find((row) => row.kind === "correct")?.score ??
    slide.feedbackRows?.find((row) => row.kind === "answered")?.score ??
    0
  );
}
