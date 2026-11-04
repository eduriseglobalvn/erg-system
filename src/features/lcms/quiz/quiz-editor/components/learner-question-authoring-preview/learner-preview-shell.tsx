import type { CSSProperties, ReactNode } from "react";

import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";
import { defaultQuizTheme } from "@/features/lcms/quiz/quiz-theme";
import {
  buildQuizTextStyle,
  resolveSlideTextStyle,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { buildPreviewTitleStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-slide-render-utils";
import { BufferedTextarea } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/buffered-textarea";
import { DraggableSlideMedia } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/draggable-slide-media";
import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

const previewTheme = {
  themeId: defaultQuizTheme.id,
  theme: defaultQuizTheme.theme,
};

const ergLogoUrl = "https://media.erg.edu.vn/logo/erg.png";

export function LearnerPreviewShell({
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
          <span>ERG STUDENT</span>
          <span>{t("quiz.learnerViewEditor")}</span>
        </div>

        <div className="classic-editor__learner-canvas">
          <div
            className="classic-editor__learner-title-band"
            onClick={(e) => {
              const textarea = e.currentTarget.querySelector("textarea");
              if (textarea) {
                textarea.focus();
                textarea.select();
              }
            }}
          >
            {readOnly ? (
              <h2 className="classic-editor__learner-title-readonly">{slide.title}</h2>
            ) : (
              <BufferedTextarea
                value={slide.title}
                rows={2}
                autoSelectOnFocus
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

export function buildQuestionThemeStyle(color?: string): CSSProperties | undefined {
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

export function buildAuthoringTitleStyle(slide: QuizEditorSlide): CSSProperties {
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

export function buildAuthoringTextVariables(slide: QuizEditorSlide): CSSProperties {
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
