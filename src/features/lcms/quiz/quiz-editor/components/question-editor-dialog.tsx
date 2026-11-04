import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import CloseIcon from "@mui/icons-material/Close";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { Box, Button, IconButton, Typography } from "@mui/material";

import { LearnerQuestionAuthoringPreview } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview";
import { QuestionEditorInspector } from "@/features/lcms/quiz/quiz-editor/components/question-editor/inspector";
import {
  applyInlineMedia,
  cloneSlide,
  getActiveInlineMediaTarget,
  updateSlideTextStyleTarget,
  type InlineMediaTarget,
} from "@/features/lcms/quiz/quiz-editor/components/question-editor/slide-edit-helpers";
import { QuestionEditorToolbar } from "@/features/lcms/quiz/quiz-editor/components/question-editor/toolbar";
import { resolveSlideTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { syncQuizEditorSlideFromRuntimeQuestion } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
import { useI18n } from "@/platform/i18n";
import type { Question } from "@/domain/quiz/types";
import type {
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorTextStyle,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getSlideKindLabelKey } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

type QuestionEditorDialogProps = {
  open: boolean;
  slide: QuizEditorSlide | null;
  groupTitle: string | null;
  entries: Array<{ groupId: string; slideId: string; title: string }>;
  selectedThemeId: string;
  onClose: () => void;
  onSave: (slide: QuizEditorSlide) => void;
  onNavigate: (groupId: string, slideId: string) => void;
  onOpenPlayerTemplate: () => void;
  onPreview: (slide: QuizEditorSlide) => void;
};

export function QuestionEditorDialog({
  open,
  slide,
  groupTitle,
  entries,
  selectedThemeId,
  onClose,
  onSave,
  onNavigate,
  onOpenPlayerTemplate,
  onPreview,
}: QuestionEditorDialogProps) {
  const { t } = useI18n();
  const [draftSlide, setDraftSlide] = useState<QuizEditorSlide | null>(slide ? cloneSlide(slide) : null);
  const [activeTextTarget, setActiveTextTarget] = useState<QuizEditorTextStyleTarget>("question");
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const pendingMediaTargetRef = useRef<InlineMediaTarget | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const currentIndex = useMemo(
    () => (draftSlide ? entries.findIndex((entry) => entry.slideId === draftSlide.id) : -1),
    [draftSlide, entries],
  );

  if (!open || !draftSlide) {
    return null;
  }


  const resolvedTextStyle = resolveSlideTextStyle(draftSlide, activeTextTarget);
  const questionThemeColor = draftSlide.options?.themeColor ?? "#0f6cbd";

  function updateTextStyle(patch: Partial<QuizEditorTextStyle>) {
    setDraftSlide((current) =>
      current
        ? updateSlideTextStyleTarget(current, activeTextTarget, patch)
        : current,
    );
  }

  function updateSlideOptions(patch: Partial<NonNullable<QuizEditorSlide["options"]>>) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            options: { ...current.options, ...patch },
          }
        : current,
    );
  }

  function updateFinalSlideOptions(
    patch: Partial<NonNullable<NonNullable<QuizEditorSlide["options"]>["finalSlide"]>>,
  ) {
    const defaultFinalSlideOptions: QuizEditorFinalSlideOptions = {
      whenQuizFinished: t("quiz.showSlideWithResults"),
      showUserScore: false,
      showPassingScore: false,
      allowReview: false,
      showCorrectAnswers: false,
      showDetailedReport: false,
      showResultsByGroup: false,
      showAnswerResults: false,
      allowPrintResults: false,
      allowRetry: false,
      retryLabel: t("quiz.retryOnce"),
    };

    setDraftSlide((current) =>
      current
        ? {
            ...current,
            options: {
              ...current.options,
              finalSlide: {
                ...defaultFinalSlideOptions,
                ...current.options?.finalSlide,
                ...patch,
              },
            },
          }
        : current,
    );
  }

  function handlePickMedia() {
    pendingMediaTargetRef.current = getActiveInlineMediaTarget();
    mediaInputRef.current?.click();
  }

  function handleMediaInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      const target = pendingMediaTargetRef.current ?? { kind: "slide" as const };
      const nextMedia = {
        type: "image" as const,
        src: result,
        alt: file.name.replace(/\.[^/.]+$/, ""),
        name: file.name,
        x: target.kind === "slide" ? 0.74 : undefined,
        y: target.kind === "slide" ? 0.48 : undefined,
        width: target.kind === "slide" ? 0.34 : undefined,
      };

      setDraftSlide((current) =>
        current ? applyInlineMedia(current, target, nextMedia)
          : current,
      );
      pendingMediaTargetRef.current = null;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleRemoveMedia() {
    setDraftSlide((current) => (current ? { ...current, media: null } : current));
  }

  function handleUpdateMediaAlt(value: string) {
    setDraftSlide((current) =>
      current && current.media
        ? {
            ...current,
            media: {
              ...current.media,
              alt: value,
            },
          }
        : current,
    );
  }

  function handleNavigate(step: -1 | 1) {
    if (!draftSlide) {
      return;
    }

    const nextEntry = entries[currentIndex + step];
    if (!nextEntry) {
      return;
    }

    onSave(draftSlide);
    onNavigate(nextEntry.groupId, nextEntry.slideId);
  }

  function updateTitle(value: string) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            title: value,
            runtimeQuestion: current.runtimeQuestion ? { ...current.runtimeQuestion, title: value } : current.runtimeQuestion,
          }
        : current,
    );
  }

  function handleUpdateSlideMedia(media: QuizEditorSlideMedia) {
    setDraftSlide((current) => (current ? { ...current, media } : current));
  }

  function updateRuntimeQuestion(question: Question) {
    setDraftSlide((current) => (current ? syncQuizEditorSlideFromRuntimeQuestion(current, question) : current));
  }

  function updateInstructions(items: string[]) {
    setDraftSlide((current) => (current ? { ...current, instructions: items } : current));
  }

  function updateFeedbackRows(rows: QuizEditorFeedbackRow[]) {
    setDraftSlide((current) => (current ? { ...current, feedbackRows: rows } : current));
  }

  return (
    <div className="classic-editor__dialog-backdrop">
      <div
        className={cn("classic-editor__dialog", "classic-editor__question-editor-dialog")}
      >
        <Box className="classic-editor__dialog-titlebar">
          <Box className="classic-editor__dialog-title">
            <TextFieldsIcon fontSize="small" color="primary" />
            <Typography component="span" variant="subtitle2">{t("quiz.questionEditor")}</Typography>
            <Typography component="small" variant="caption">
              {groupTitle ?? t("quiz.ungrouped")} / {t(getSlideKindLabelKey(draftSlide.kind))}
            </Typography>
          </Box>
          <IconButton size="small" className="classic-editor__dialog-close" onClick={onClose} aria-label={t("common.cancel")}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleMediaInputChange}
        />

        <QuestionEditorToolbar
          resolvedTextStyle={resolvedTextStyle}
          questionThemeColor={questionThemeColor}
          onUpdateTextStyle={updateTextStyle}
          onUpdateSlideOptions={updateSlideOptions}
          onPickMedia={handlePickMedia}
          onOpenPlayerTemplate={onOpenPlayerTemplate}
          onPreview={() => onPreview(draftSlide)}
        />

        <div className="classic-editor__question-editor-body">
          <div className="classic-editor__question-editor-shell is-visual">
            <div className="classic-editor__question-editor-main">
              <VisualQuestionCanvas
                draftSlide={draftSlide}
                onUpdateTitle={updateTitle}
                onUpdateInstructions={updateInstructions}
                onUpdateFeedbackRows={updateFeedbackRows}
                onUpdateRuntimeQuestion={updateRuntimeQuestion}
                onUpdateSlideMedia={handleUpdateSlideMedia}
                onTextTargetFocus={setActiveTextTarget}
                selectedThemeId={selectedThemeId}
              />
            </div>

            <aside className="classic-editor__question-editor-sidebar">
              <QuestionEditorInspector
                draftSlide={draftSlide}
                onUpdateFeedbackRows={updateFeedbackRows}
                onPickMedia={handlePickMedia}
                onRemoveMedia={handleRemoveMedia}
                onUpdateMediaAlt={handleUpdateMediaAlt}
                onUpdateOptions={updateSlideOptions}
                onUpdateFinalSlideOptions={updateFinalSlideOptions}
              />
            </aside>
          </div>
        </div>

        <Box className="classic-editor__dialog-actions classic-editor__question-editor-actions">
          <Box className="classic-editor__dialog-action-group">
            <Button
              type="button"
              size="small"
              variant="outlined"
              className="classic-editor__dialog-secondary"
              onClick={() => handleNavigate(-1)}
              disabled={currentIndex <= 0}
            >
              {t("quiz.previousQuestion")}
            </Button>
            <Button
              type="button"
              size="small"
              variant="outlined"
              className="classic-editor__dialog-secondary"
              onClick={() => handleNavigate(1)}
              disabled={currentIndex < 0 || currentIndex >= entries.length - 1}
            >
              {t("quiz.nextQuestion")}
            </Button>
          </Box>

          <Box className="classic-editor__dialog-action-group">
            <Button
              type="button"
              size="small"
              variant="contained"
              className="classic-editor__dialog-primary"
              onClick={() => {
                onSave(draftSlide);
                onClose();
              }}
            >
              {t("common.save")}
            </Button>
            <Button type="button" size="small" variant="outlined" className="classic-editor__dialog-secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </Box>
        </Box>
      </div>
    </div>
  );
}

function VisualQuestionCanvas({
  draftSlide,
  onUpdateTitle,
  onUpdateInstructions,
  onUpdateFeedbackRows,
  onUpdateRuntimeQuestion,
  onUpdateSlideMedia,
  onTextTargetFocus,
  selectedThemeId,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateTitle: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onUpdateRuntimeQuestion: (question: Question) => void;
  onUpdateSlideMedia: (media: QuizEditorSlideMedia) => void;
  onTextTargetFocus: (target: QuizEditorTextStyleTarget) => void;
  selectedThemeId: string;
}) {
  return (
    <section className="classic-editor__visual-editor">
      <div className="classic-editor__visual-stage">
        <LearnerQuestionAuthoringPreview
          slide={draftSlide}
          previewMode="question"
          onUpdateTitle={onUpdateTitle}
          onUpdateInstructions={onUpdateInstructions}
          onUpdateFeedbackRows={onUpdateFeedbackRows}
          onUpdateRuntimeQuestion={onUpdateRuntimeQuestion}
          onUpdateSlideMedia={onUpdateSlideMedia}
          onTextTargetFocus={onTextTargetFocus}
          themeId={selectedThemeId}
        />
      </div>

    </section>
  );
}
