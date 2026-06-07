import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CalculateIcon from "@mui/icons-material/Calculate";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PreviewIcon from "@mui/icons-material/Preview";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import StarIcon from "@mui/icons-material/Star";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import TuneIcon from "@mui/icons-material/Tune";

import { resolveQuizFontStack } from "@/config/fonts";
import { ChoiceEditorTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/choice-editor-table";
import { DragDropMatchTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/drag-drop-match-table";
import { FeedbackBranchingTable } from "@/features/lcms/quiz/quiz-editor/components/form-view/feedback-branching-table";
import { InstructionDescriptionPanel } from "@/features/lcms/quiz/quiz-editor/components/form-view/instruction-description-panel";
import { LearnerQuestionAuthoringPreview } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview";
import { MediaAttachmentPanel } from "@/features/lcms/quiz/quiz-editor/components/form-view/media-attachment-panel";
import { ResultTabs } from "@/features/lcms/quiz/quiz-editor/components/form-view/result-tabs";
import { FinalSlideOptionsSection } from "@/features/lcms/quiz/quiz-editor/components/options-panels/final-slide-options-section";
import { InstructionOptionsSection } from "@/features/lcms/quiz/quiz-editor/components/options-panels/instruction-options-section";
import { QuestionOptionsSection } from "@/features/lcms/quiz/quiz-editor/components/options-panels/question-options-section";
import {
  defaultQuizTextStyle,
  quizEditorFontOptions,
  quizEditorFontSizeOptions,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorSlide,
  QuizEditorTextStyle,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getSlideKindLabelKey } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

type QuestionEditorDialogProps = {
  open: boolean;
  slide: QuizEditorSlide | null;
  groupTitle: string | null;
  entries: Array<{ groupId: string; slideId: string; title: string }>;
  onClose: () => void;
  onSave: (slide: QuizEditorSlide) => void;
  onNavigate: (groupId: string, slideId: string) => void;
  onPreview: (slide: QuizEditorSlide) => void;
};

export function QuestionEditorDialog({
  open,
  slide,
  groupTitle,
  entries,
  onClose,
  onSave,
  onNavigate,
  onPreview,
}: QuestionEditorDialogProps) {
  const { t } = useI18n();
  const [draftSlide, setDraftSlide] = useState<QuizEditorSlide | null>(slide ? cloneSlide(slide) : null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const currentIndex = useMemo(
    () => (draftSlide ? entries.findIndex((entry) => entry.slideId === draftSlide.id) : -1),
    [draftSlide, entries],
  );

  if (!open || !draftSlide) {
    return null;
  }

  const resolvedTextStyle = { ...defaultQuizTextStyle, ...draftSlide.textStyle };
  const feedbackValue =
    draftSlide.options?.feedback === t("common.byResult")
      ? "By Result"
      : draftSlide.options?.feedback === t("quiz.byQuestion")
        ? "By Question"
        : draftSlide.options?.feedback ?? "By Question";
  const branchingValue =
    draftSlide.options?.branching === t("common.byResult")
      ? "By Result"
      : draftSlide.options?.branching === t("common.none")
        ? "None"
        : draftSlide.options?.branching ?? "None";

  function updateTextStyle(patch: Partial<QuizEditorTextStyle>) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            textStyle: { ...defaultQuizTextStyle, ...current.textStyle, ...patch },
          }
        : current,
    );
  }

  function updateOptions(patch: Partial<NonNullable<QuizEditorSlide["options"]>>) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            options: { ...current.options, ...patch },
          }
        : current,
    );
  }

  function updateCorrectScore(score: number) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            feedbackRows:
              current.feedbackRows?.map((row) =>
                row.kind === "correct" ? { ...row, score } : row,
              ) ?? current.feedbackRows,
          }
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
    mediaInputRef.current?.click();
  }

  function handleMediaInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;

      setDraftSlide((current) =>
        current
          ? {
              ...current,
              media: {
                type: "image",
                src: result,
                alt: current.media?.alt || file.name.replace(/\.[^/.]+$/, ""),
                name: file.name,
              },
            }
          : current,
      );
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
    setDraftSlide((current) => (current ? { ...current, title: value } : current));
  }

  function updateDescription(value: string) {
    setDraftSlide((current) => (current ? { ...current, description: value } : current));
  }

  function updateInstructions(items: string[]) {
    setDraftSlide((current) => (current ? { ...current, instructions: items } : current));
  }

  function updateChoices(choices: QuizEditorChoice[]) {
    setDraftSlide((current) => (current ? { ...current, choices } : current));
  }

  function updateItems(items: QuizEditorDragDropItem[]) {
    setDraftSlide((current) => (current ? { ...current, dragDropItems: items } : current));
  }

  function updateFeedbackRows(rows: QuizEditorFeedbackRow[]) {
    setDraftSlide((current) => (current ? { ...current, feedbackRows: rows } : current));
  }

  function updateResultTab(tab: "passed" | "failed") {
    setDraftSlide((current) => (current ? { ...current, activeResultTab: tab } : current));
  }

  return (
    <div className="classic-editor__dialog-backdrop" onClick={onClose}>
      <div
        className={cn("classic-editor__dialog", "classic-editor__question-editor-dialog")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="classic-editor__dialog-titlebar">
          <div className="classic-editor__dialog-title">
            <TextFieldsIcon className="h-4 w-4 text-[#41688f]" fontSize="inherit" />
            <span>{t("quiz.questionEditor")}</span>
            <small>
              {groupTitle ?? t("quiz.ungrouped")} / {t(getSlideKindLabelKey(draftSlide.kind))}
            </small>
          </div>
          <button type="button" className="classic-editor__dialog-close" onClick={onClose}>
            <CloseIcon className="h-4 w-4" fontSize="inherit" />
          </button>
        </div>

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleMediaInputChange}
        />

        <div className="classic-editor__question-editor-toolbar is-modern-ribbon">
          <div className="classic-editor__question-editor-group is-clipboard">
            <div className="classic-editor__question-editor-clipboard">
              <QuestionEditorRibbonButton
                icon={<ContentCutIcon className="h-3.5 w-3.5" fontSize="inherit" />}
                label={t("common.cut")}
                onClick={() => void handleClipboardCommand("cut")}
              />
              <QuestionEditorRibbonButton
                icon={<ContentCopyIcon className="h-3.5 w-3.5" fontSize="inherit" />}
                label={t("common.copy")}
                onClick={() => void handleClipboardCommand("copy")}
              />
              <QuestionEditorRibbonButton
                icon={<ContentPasteIcon className="h-3.5 w-3.5" fontSize="inherit" />}
                label={t("common.paste")}
                onClick={() => void handleClipboardCommand("paste")}
              />
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.clipboard")}</span>
          </div>

          <div className="classic-editor__question-editor-group is-text-format">
            <div className="classic-editor__question-editor-controls">
              <div className="classic-editor__question-editor-font-row">
                <AppSelect
                  value={resolvedTextStyle.fontFamily}
                  onChange={(event) => updateTextStyle({ fontFamily: event.target.value })}
                  className="classic-editor__question-editor-select is-font"
                  style={{ fontFamily: resolveQuizFontStack(resolvedTextStyle.fontFamily) }}
                >
                  {quizEditorFontOptions.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: resolveQuizFontStack(font) }}>
                      {font}
                    </option>
                  ))}
                </AppSelect>
                <AppSelect
                  value={resolvedTextStyle.fontSize}
                  onChange={(event) => updateTextStyle({ fontSize: Number(event.target.value) })}
                  className="classic-editor__question-editor-select is-size"
                >
                  {quizEditorFontSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </AppSelect>
              </div>
              <div className="classic-editor__question-editor-format-row">
                <button
                  type="button"
                  className={cn("classic-editor__question-editor-icon", resolvedTextStyle.bold && "is-active")}
                  onClick={() => updateTextStyle({ bold: !resolvedTextStyle.bold })}
                  title={t("common.font")}
                >
                  <FormatBoldIcon className="h-4 w-4" fontSize="inherit" />
                </button>
                <button
                  type="button"
                  className={cn("classic-editor__question-editor-icon", resolvedTextStyle.italic && "is-active")}
                  onClick={() => updateTextStyle({ italic: !resolvedTextStyle.italic })}
                  title={t("common.font")}
                >
                  <FormatItalicIcon className="h-4 w-4" fontSize="inherit" />
                </button>
                <button
                  type="button"
                  className={cn("classic-editor__question-editor-icon", resolvedTextStyle.underline && "is-active")}
                  onClick={() => updateTextStyle({ underline: !resolvedTextStyle.underline })}
                  title={t("common.font")}
                >
                  <FormatUnderlinedIcon className="h-4 w-4" fontSize="inherit" />
                </button>
              </div>
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.font")}</span>
          </div>

          <div className="classic-editor__question-editor-group is-score">
            <div className="classic-editor__question-editor-stack">
              <label className="classic-editor__question-editor-row-label">
                <StarIcon className="h-4 w-4 text-[#f4a300]" fontSize="inherit" />
                <span>{t("common.score")}</span>
                <input
                  type="number"
                  min={0}
                  value={extractCorrectScore(draftSlide)}
                  onChange={(event) => updateCorrectScore(Number(event.target.value))}
                  className="classic-editor__question-editor-number is-score"
                  aria-label={t("common.score")}
                />
              </label>
              <label className="classic-editor__question-editor-row-label">
                <TuneIcon className="h-4 w-4 text-[#54769f]" fontSize="inherit" />
                <span>{t("common.attempts")}</span>
                <input
                  type="number"
                  min={1}
                  value={draftSlide.options?.attempts ?? 1}
                  onChange={(event) => updateOptions({ attempts: Number(event.target.value) })}
                  className="classic-editor__question-editor-number is-spin"
                />
              </label>
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.score")}</span>
          </div>

          <div className="classic-editor__question-editor-group is-feedback">
            <div className="classic-editor__question-editor-stack">
              <label className="classic-editor__question-editor-row-label">
                <RateReviewOutlinedIcon className="h-4 w-4 text-[#54769f]" fontSize="inherit" />
                <span>{t("common.feedback")}</span>
                <AppSelect
                  value={feedbackValue}
                  onChange={(event) => updateOptions({ feedback: event.target.value })}
                  className="classic-editor__question-editor-select"
                >
                  <option value="By Question">{t("quiz.byQuestion")}</option>
                  <option value="By Result">{t("common.byResult")}</option>
                </AppSelect>
              </label>
              <label className="classic-editor__question-editor-row-label">
                <AltRouteIcon className="h-4 w-4 text-[#54769f]" fontSize="inherit" />
                <span>{t("common.branching")}</span>
                <AppSelect
                  value={branchingValue}
                  onChange={(event) => updateOptions({ branching: event.target.value })}
                  className="classic-editor__question-editor-select"
                >
                  <option value="None">{t("common.none")}</option>
                  <option value="By Result">{t("common.byResult")}</option>
                  <option value="Next Question">{t("quiz.nextQuestion")}</option>
                </AppSelect>
              </label>
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.feedback")}</span>
          </div>

          <div className="classic-editor__question-editor-group is-insert">
            <div className="classic-editor__question-editor-insert-row">
              <QuestionEditorRibbonButton
                icon={<AddPhotoAlternateIcon className="h-5 w-5" fontSize="inherit" />}
                label={draftSlide.media ? t("quiz.replaceImage") : t("common.picture")}
                onClick={handlePickMedia}
                variant="tile"
              />
              <QuestionEditorRibbonButton
                icon={<StickyNote2Icon className="h-5 w-5" fontSize="inherit" />}
                label={t("player.notes")}
                disabled
                variant="tile"
              />
              <QuestionEditorRibbonButton
                icon={<CalculateIcon className="h-5 w-5" fontSize="inherit" />}
                label={t("common.equation")}
                disabled
                variant="tile"
              />
              <QuestionEditorRibbonButton
                icon={<AudiotrackIcon className="h-5 w-5" fontSize="inherit" />}
                label={t("common.audio")}
                disabled
                variant="tile"
              />
              <QuestionEditorRibbonButton
                icon={<OndemandVideoIcon className="h-5 w-5" fontSize="inherit" />}
                label={t("common.video")}
                disabled
                variant="tile"
              />
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.insert")}</span>
          </div>

          <div className="classic-editor__question-editor-group is-review">
            <div className="classic-editor__question-editor-review-row">
              <QuestionEditorRibbonButton
                icon={<SpellcheckIcon className="h-6 w-6" fontSize="inherit" />}
                label="Spell"
                variant="large"
                disabled
              />
              <button
                type="button"
                className="classic-editor__question-editor-tool is-large"
                onClick={() => onPreview(draftSlide)}
              >
                <PreviewIcon className="h-7 w-7" fontSize="inherit" />
                <span>{t("common.preview")}</span>
              </button>
            </div>
            <span className="classic-editor__question-editor-group-label">{t("common.preview")}</span>
          </div>
        </div>

        <div className="classic-editor__question-editor-body">
          <div className="classic-editor__question-editor-shell is-visual">
            <div className="classic-editor__question-editor-main">
              <VisualQuestionCanvas
                draftSlide={draftSlide}
                onUpdateTitle={updateTitle}
                onUpdateInstructions={updateInstructions}
                onUpdateChoices={updateChoices}
                onUpdateItems={updateItems}
                onUpdateFeedbackRows={updateFeedbackRows}
              />
            </div>

            <aside className="classic-editor__question-editor-sidebar">
              <QuestionEditorInspector
                draftSlide={draftSlide}
                onUpdateDescription={updateDescription}
                onUpdateInstructions={updateInstructions}
                onUpdateChoices={updateChoices}
                onUpdateItems={updateItems}
                onUpdateFeedbackRows={updateFeedbackRows}
                onUpdateResultTab={updateResultTab}
                onPickMedia={handlePickMedia}
                onRemoveMedia={handleRemoveMedia}
                onUpdateMediaAlt={handleUpdateMediaAlt}
                onUpdateOptions={updateSlideOptions}
                onUpdateFinalSlideOptions={updateFinalSlideOptions}
              />
            </aside>
          </div>
        </div>

        <div className="classic-editor__dialog-actions classic-editor__question-editor-actions">
          <div className="classic-editor__dialog-action-group">
            <button
              type="button"
              className="classic-editor__dialog-secondary"
              onClick={() => handleNavigate(-1)}
              disabled={currentIndex <= 0}
            >
              {t("quiz.previousQuestion")}
            </button>
            <button
              type="button"
              className="classic-editor__dialog-secondary"
              onClick={() => handleNavigate(1)}
              disabled={currentIndex < 0 || currentIndex >= entries.length - 1}
            >
              {t("quiz.nextQuestion")}
            </button>
          </div>

          <div className="classic-editor__dialog-action-group">
            <button
              type="button"
              className="classic-editor__dialog-primary"
              onClick={() => {
                onSave(draftSlide);
                onClose();
              }}
            >
              {t("common.save")}
            </button>
            <button type="button" className="classic-editor__dialog-secondary" onClick={onClose}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionEditorRibbonButton({
  icon,
  label,
  variant = "compact",
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  variant?: "compact" | "large" | "tile";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "classic-editor__question-editor-tool",
        variant === "large" && "is-large",
        variant === "tile" && "is-tile",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

async function handleClipboardCommand(command: "cut" | "copy" | "paste") {
  const editable = getActiveEditableElement();

  if (editable) {
    const start = editable.selectionStart ?? 0;
    const end = editable.selectionEnd ?? start;

    if (command === "paste") {
      const text = await navigator.clipboard?.readText().catch(() => "");
      if (text) {
        replaceEditableSelection(editable, text, start, end);
        return;
      }
    }

    const selectedText = editable.value.slice(start, end);
    if (selectedText) {
      await navigator.clipboard?.writeText(selectedText).catch(() => undefined);

      if (command === "cut") {
        replaceEditableSelection(editable, "", start, end);
      }

      return;
    }
  }

  document.execCommand(command);
}

function getActiveEditableElement() {
  const element = document.activeElement;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element;
  }

  return null;
}

function replaceEditableSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  start: number,
  end: number,
) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  const nextValue = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;

  valueSetter?.call(element, nextValue);
  element.selectionStart = start + text.length;
  element.selectionEnd = start + text.length;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function VisualQuestionCanvas({
  draftSlide,
  onUpdateTitle,
  onUpdateInstructions,
  onUpdateChoices,
  onUpdateItems,
  onUpdateFeedbackRows,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateTitle: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateChoices: (items: QuizEditorChoice[]) => void;
  onUpdateItems: (items: QuizEditorDragDropItem[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
}) {
  const { t } = useI18n();
  const [renderMode, setRenderMode] = useState<"question" | "correct" | "incorrect">("question");
  const hasFeedbackLayer =
    draftSlide.kind !== "result-slide" &&
    draftSlide.kind !== "instruction-slide" &&
    draftSlide.kind !== "intro-slide" &&
    draftSlide.kind !== "info-slide" &&
    Boolean(draftSlide.feedbackRows?.length);
  const visibleRenderMode = hasFeedbackLayer ? renderMode : "question";

  return (
    <section className="classic-editor__visual-editor">
      <div className="classic-editor__visual-header">
        <div>
          <div className="classic-editor__visual-kicker">{t("quiz.learnerViewEditor")}</div>
          <h2>{draftSlide.title}</h2>
          <p>{t("quiz.learnerViewEditorCopy")}</p>
        </div>

        <div className="classic-editor__visual-tabs">
          <button
            type="button"
            className={cn("classic-editor__visual-tab", visibleRenderMode === "question" && "is-active")}
            onClick={() => setRenderMode("question")}
          >
            {t("quiz.questionScreen")}
          </button>
          {hasFeedbackLayer ? (
            <>
              <button
                type="button"
                className={cn("classic-editor__visual-tab", visibleRenderMode === "correct" && "is-active")}
                onClick={() => setRenderMode("correct")}
              >
                {t("quiz.correctFeedbackScreen")}
              </button>
              <button
                type="button"
                className={cn("classic-editor__visual-tab", visibleRenderMode === "incorrect" && "is-active")}
                onClick={() => setRenderMode("incorrect")}
              >
                {t("quiz.incorrectFeedbackScreen")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="classic-editor__visual-stage">
        <LearnerQuestionAuthoringPreview
          slide={draftSlide}
          previewMode={visibleRenderMode}
          onUpdateTitle={onUpdateTitle}
          onUpdateInstructions={onUpdateInstructions}
          onUpdateChoices={onUpdateChoices}
          onUpdateDragDropItems={onUpdateItems}
          onUpdateFeedbackRows={onUpdateFeedbackRows}
        />
      </div>

      <div className="classic-editor__visual-hint">
        {t("quiz.directEditHint")}
      </div>
    </section>
  );
}

function QuestionEditorInspector({
  draftSlide,
  onUpdateDescription,
  onUpdateInstructions,
  onUpdateChoices,
  onUpdateItems,
  onUpdateFeedbackRows,
  onUpdateResultTab,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
  onUpdateOptions,
  onUpdateFinalSlideOptions,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateDescription: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateChoices: (choices: QuizEditorChoice[]) => void;
  onUpdateItems: (items: QuizEditorDragDropItem[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onUpdateResultTab: (tab: "passed" | "failed") => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
  onUpdateOptions: (patch: Partial<NonNullable<QuizEditorSlide["options"]>>) => void;
  onUpdateFinalSlideOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <section className="classic-editor__question-editor-sidebar-card">
        <div className="classic-editor__inspector-title">{t("quiz.mediaSettings")}</div>
        <MediaAttachmentPanel
          media={draftSlide.media}
          onPickMedia={onPickMedia}
          onRemoveMedia={onRemoveMedia}
          onChangeAlt={onUpdateMediaAlt}
        />
      </section>

      <section className="classic-editor__question-editor-sidebar-card">
        <div className="classic-editor__inspector-title">{t("quiz.answerInspector")}</div>
        {draftSlide.kind === "instruction-slide" ? (
          <InstructionDescriptionPanel slide={draftSlide} onChange={onUpdateInstructions} />
        ) : draftSlide.kind === "drag-and-drop" ? (
          <DragDropMatchTable items={draftSlide.dragDropItems ?? []} onChange={onUpdateItems} />
        ) : isChoiceSlide(draftSlide) ? (
          <ChoiceEditorTable
            choices={draftSlide.choices ?? []}
            controlType={draftSlide.choiceControlType ?? "checkbox"}
            onChange={onUpdateChoices}
          />
        ) : draftSlide.kind === "result-slide" ? (
          <ResultTabs activeTab={draftSlide.activeResultTab ?? "passed"} onChange={onUpdateResultTab} />
        ) : (
          <textarea
            value={draftSlide.description ?? ""}
            onChange={(event) => onUpdateDescription(event.target.value)}
            className="classic-editor__textarea classic-editor__textarea--manager"
            rows={8}
          />
        )}
      </section>

      {draftSlide.feedbackRows?.length ? (
        <section className="classic-editor__question-editor-sidebar-card">
          <div className="classic-editor__inspector-title">{t("quiz.feedbackAndScoring")}</div>
          <FeedbackBranchingTable rows={draftSlide.feedbackRows} onChange={onUpdateFeedbackRows} />
        </section>
      ) : null}

      <section className="classic-editor__question-editor-sidebar-card">
        {draftSlide.kind === "instruction-slide" ? (
          <InstructionOptionsSection slide={draftSlide} onUpdateOptions={onUpdateOptions} />
        ) : draftSlide.kind === "result-slide" ? (
          <FinalSlideOptionsSection slide={draftSlide} onUpdateOptions={onUpdateFinalSlideOptions} />
        ) : (
          <QuestionOptionsSection slide={draftSlide} onUpdateOptions={onUpdateOptions} />
        )}
      </section>
    </>
  );
}

function isChoiceSlide(slide: QuizEditorSlide) {
  return (
    slide.kind === "multiple-choice" ||
    slide.kind === "multiple-response" ||
    slide.kind === "true-false"
  );
}

function extractCorrectScore(slide: QuizEditorSlide) {
  return (
    slide.feedbackRows?.find((row) => row.kind === "correct")?.score ??
    slide.feedbackRows?.find((row) => row.kind === "answered")?.score ??
    0
  );
}

function cloneSlide(slide: QuizEditorSlide) {
  return JSON.parse(JSON.stringify(slide)) as QuizEditorSlide;
}
