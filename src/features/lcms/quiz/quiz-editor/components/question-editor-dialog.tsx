import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import ErrorOutlineIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PreviewIcon from "@mui/icons-material/Preview";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import StarIcon from "@mui/icons-material/Star";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import {
  Box,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import { resolveQuizFontStack } from "@/config/fonts";
import { LearnerQuestionAuthoringPreview } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview";
import {
  defaultQuizTextStyle,
  quizEditorFontOptions,
  quizEditorFontSizeOptions,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorFeedbackBranching,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorHotspotArea,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorSlideOptions,
  QuizEditorTextStyle,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getSlideKindLabelKey } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";


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

type InlineMediaTarget =
  | { kind: "choice"; id: string }
  | { kind: "drag-item"; id: string; field: "label" | "target" }
  | { kind: "slide" };

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
  const pendingMediaTargetRef = useRef<InlineMediaTarget | null>(null);

  const currentIndex = useMemo(
    () => (draftSlide ? entries.findIndex((entry) => entry.slideId === draftSlide.id) : -1),
    [draftSlide, entries],
  );

  if (!open || !draftSlide) {
    return null;
  }

  const resolvedTextStyle = { ...defaultQuizTextStyle, ...draftSlide.textStyle };
  const activeFormats = [
    resolvedTextStyle.bold ? "bold" : null,
    resolvedTextStyle.italic ? "italic" : null,
    resolvedTextStyle.underline ? "underline" : null,
  ].filter(Boolean) as string[];

  function handleFontChange(event: { target: { value: unknown } }) {
    updateTextStyle({ fontFamily: String(event.target.value) });
  }

  function handleFontSizeChange(event: { target: { value: unknown } }) {
    updateTextStyle({ fontSize: Number(event.target.value) });
  }

  function updateTextStyle(patch: Partial<QuizEditorTextStyle>) {
    setDraftSlide((current) =>
      current
        ? {
            ...current,
            textStyle: { ...defaultQuizTextStyle, ...current.textStyle, ...patch },
            textStyles: {
              ...current.textStyles,
              question: { ...defaultQuizTextStyle, ...current.textStyle, ...current.textStyles?.question, ...patch },
              answer: { ...defaultQuizTextStyle, ...current.textStyles?.answer, ...patch },
              textBox: { ...defaultQuizTextStyle, ...current.textStyles?.textBox, ...patch },
              feedback: { ...defaultQuizTextStyle, ...current.textStyles?.feedback, ...patch },
            },
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
      const nextMedia = {
        type: "image" as const,
        src: result,
        alt: file.name.replace(/\.[^/.]+$/, ""),
        name: file.name,
      };
      const target = pendingMediaTargetRef.current ?? { kind: "slide" as const };

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
    setDraftSlide((current) => (current ? { ...current, title: value } : current));
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

  function updateHotspotAreas(items: QuizEditorHotspotArea[]) {
    setDraftSlide((current) => (current ? { ...current, hotspotAreas: items } : current));
  }

  function updateFeedbackRows(rows: QuizEditorFeedbackRow[]) {
    setDraftSlide((current) => (current ? { ...current, feedbackRows: rows } : current));
  }

  return (
    <div className="classic-editor__dialog-backdrop" onClick={onClose}>
      <div
        className={cn("classic-editor__dialog", "classic-editor__question-editor-dialog")}
        onClick={(event) => event.stopPropagation()}
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

        <Box className="classic-editor__question-editor-toolbar is-modern-ribbon is-mui-editor">
          <Box className="classic-editor__mui-editor-group is-clipboard">
            <Tooltip title={t("common.cut")} arrow>
              <IconButton
                size="small"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void handleClipboardCommand("cut")}
                aria-label={t("common.cut")}
              >
                <ContentCutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common.copy")} arrow>
              <IconButton
                size="small"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void handleClipboardCommand("copy")}
                aria-label={t("common.copy")}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common.paste")} arrow>
              <IconButton
                size="small"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void handleClipboardCommand("paste")}
                aria-label={t("common.paste")}
              >
                <ContentPasteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box className="classic-editor__mui-editor-group is-font">
            <Select
              size="small"
              value={resolvedTextStyle.fontFamily}
              onChange={handleFontChange}
              className="classic-editor__mui-editor-select is-font"
              sx={{ fontFamily: resolveQuizFontStack(resolvedTextStyle.fontFamily) }}
              MenuProps={{ disablePortal: true }}
            >
              {quizEditorFontOptions.map((font) => (
                <MenuItem key={font} value={font} sx={{ fontFamily: resolveQuizFontStack(font) }}>
                  {font}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={resolvedTextStyle.fontSize}
              onChange={handleFontSizeChange}
              className="classic-editor__mui-editor-select is-size"
              MenuProps={{ disablePortal: true }}
            >
              {quizEditorFontSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>

            <ToggleButtonGroup
              size="small"
              value={activeFormats}
              onChange={(_, value: string[]) =>
                updateTextStyle({
                  bold: value.includes("bold"),
                  italic: value.includes("italic"),
                  underline: value.includes("underline"),
                })
              }
              aria-label={t("common.font")}
              className="classic-editor__mui-format-group"
            >
              <ToggleButton value="bold" aria-label="Bold">
                <FormatBoldIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="italic" aria-label="Italic">
                <FormatItalicIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="underline" aria-label="Underline">
                <FormatUnderlinedIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box className="classic-editor__mui-editor-group is-score">
            <TextField
              size="small"
              type="number"
              label={t("common.score")}
              value={extractCorrectScore(draftSlide)}
              onChange={(event) => updateCorrectScore(Number(event.target.value))}
              slotProps={{ input: { startAdornment: <StarIcon fontSize="small" color="warning" /> } }}
              className="classic-editor__mui-number-field"
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box className="classic-editor__mui-editor-group is-insert">
            <QuestionEditorRibbonButton
              icon={<AddPhotoAlternateIcon fontSize="small" />}
              label={t("quiz.addImage")}
              onClick={handlePickMedia}
            />
            <QuestionEditorRibbonButton icon={<OndemandVideoIcon fontSize="small" />} label={t("common.video")} disabled />
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box className="classic-editor__mui-editor-group is-review">
            <Button
              type="button"
              size="small"
              variant="contained"
              startIcon={<PreviewIcon fontSize="small" />}
              onClick={() => onPreview(draftSlide)}
              className="classic-editor__mui-preview-button"
            >
              {t("common.preview")}
            </Button>
          </Box>
        </Box>

        <div className="classic-editor__question-editor-body">
          <div className="classic-editor__question-editor-shell is-visual">
            <div className="classic-editor__question-editor-main">
              <VisualQuestionCanvas
                draftSlide={draftSlide}
                onUpdateTitle={updateTitle}
                onUpdateInstructions={updateInstructions}
                onUpdateChoices={updateChoices}
                onUpdateItems={updateItems}
                onUpdateHotspotAreas={updateHotspotAreas}
                onUpdateFeedbackRows={updateFeedbackRows}
                onPickMedia={handlePickMedia}
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

function QuestionEditorRibbonButton({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      size="small"
      variant="text"
      startIcon={icon}
      className="classic-editor__mui-tool-button"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

async function handleClipboardCommand(command: "cut" | "copy" | "paste") {
  const editable = getActiveEditableElement();

  if (editable) {
    const start = editable.selectionStart ?? 0;
    const end = editable.selectionEnd ?? start;

    if (command === "paste") {
      const text = await navigator.clipboard?.readText().catch(() => "") || localTextClipboard;
      if (text) {
        replaceEditableSelection(editable, text, start, end);
        return;
      }
    }

    const selectedText = editable.value.slice(start, end);
    if (selectedText) {
      localTextClipboard = selectedText;
      await navigator.clipboard?.writeText(selectedText).catch(() => undefined);

      if (command === "cut") {
        replaceEditableSelection(editable, "", start, end);
      }

      return;
    }
  }

  document.execCommand(command);
}

let localTextClipboard = "";

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
  onUpdateHotspotAreas,
  onUpdateFeedbackRows,
  onPickMedia,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateTitle: (value: string) => void;
  onUpdateInstructions: (items: string[]) => void;
  onUpdateChoices: (items: QuizEditorChoice[]) => void;
  onUpdateItems: (items: QuizEditorDragDropItem[]) => void;
  onUpdateHotspotAreas: (items: QuizEditorHotspotArea[]) => void;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onPickMedia: () => void;
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
          onUpdateHotspotAreas={onUpdateHotspotAreas}
          onUpdateFeedbackRows={onUpdateFeedbackRows}
          onPickMedia={onPickMedia}
        />
      </div>

    </section>
  );
}

function QuestionEditorInspector({
  draftSlide,
  onUpdateFeedbackRows,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
  onUpdateOptions,
  onUpdateFinalSlideOptions,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
  onUpdateOptions: (patch: Partial<NonNullable<QuizEditorSlide["options"]>>) => void;
  onUpdateFinalSlideOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();

  return (
    <Box className="classic-editor__mui-inspector">
      <InspectorSection title={t("quiz.mediaSettings")} defaultExpanded>
        <MuiMediaSettings
          slide={draftSlide}
          onPickMedia={onPickMedia}
          onRemoveMedia={onRemoveMedia}
          onUpdateMediaAlt={onUpdateMediaAlt}
        />
      </InspectorSection>

      {draftSlide.feedbackRows?.length ? (
        <InspectorSection title={t("quiz.feedbackAndScoring")} defaultExpanded>
          <MuiFeedbackAndScoring rows={draftSlide.feedbackRows} onChange={onUpdateFeedbackRows} />
        </InspectorSection>
      ) : null}

      <InspectorSection title={t("quiz.questionSettings")} defaultExpanded>
        {draftSlide.kind === "result-slide" ? (
          <MuiFinalSlideSettings slide={draftSlide} onUpdateOptions={onUpdateFinalSlideOptions} />
        ) : (
          <MuiQuestionSettings slide={draftSlide} onUpdateOptions={onUpdateOptions} />
        )}
      </InspectorSection>
    </Box>
  );
}

function InspectorSection({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion disableGutters defaultExpanded={defaultExpanded} className="classic-editor__mui-inspector-section">
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
        <Typography component="h3" variant="subtitle2">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

function MuiMediaSettings({
  slide,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
}: {
  slide: QuizEditorSlide;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
}) {
  const { t } = useI18n();
  const media = slide.media;

  return (
    <StackPanel>
      <Box className="classic-editor__mui-media-head">
        <Box>
          <Typography variant="overline">{t("common.picture")}</Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddPhotoAlternateIcon fontSize="small" />}
          onClick={onPickMedia}
        >
          {t("quiz.addImage")}
        </Button>
      </Box>

      <Box className={cn("classic-editor__mui-media-preview", media?.src ? "has-media" : "is-empty")}>
        {media?.src ? (
          <>
            <img src={media.src} alt={media.alt || t("common.picture")} />
            <IconButton size="small" color="error" onClick={onRemoveMedia} aria-label={t("common.remove")}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <Box component="button" type="button" className="classic-editor__mui-media-empty" onClick={onPickMedia}>
            <AddPhotoAlternateIcon fontSize="small" />
            <Typography variant="body2">{t("quiz.addImage")}</Typography>
          </Box>
        )}
      </Box>

      <TextField
        size="small"
        fullWidth
        label={t("quiz.imageAltText")}
        value={media?.alt ?? ""}
        onChange={(event) => onUpdateMediaAlt(event.target.value)}
        placeholder={t("quiz.imageAltPlaceholder")}
        disabled={!media}
      />
    </StackPanel>
  );
}

const branchingOptions: QuizEditorFeedbackBranching[] = ["By Result", "Next Question", "Finish Quiz"];
const questionTypeOptions = ["Graded", "Survey", "Practice"] as const;
const feedbackOptions = ["By Result", "None", "By choice"] as const;
const scoreOptions = ["By Result", "Custom"] as const;
function MuiFeedbackAndScoring({
  rows,
  onChange,
}: {
  rows: QuizEditorFeedbackRow[];
  onChange: (rows: QuizEditorFeedbackRow[]) => void;
}) {
  const { t } = useI18n();

  function updateRow(rowId: string, patch: Partial<QuizEditorFeedbackRow>) {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  return (
    <StackPanel>
      {rows.map((row) => {
        const isCorrect = row.kind === "correct";
        const isIncorrect = row.kind === "incorrect";
        const label = isCorrect ? t("common.correct") : isIncorrect ? t("common.incorrect") : t("common.answered");
        const icon = isCorrect ? (
          <CheckCircleOutlineIcon fontSize="small" />
        ) : isIncorrect ? (
          <ErrorOutlineIcon fontSize="small" />
        ) : (
          <RateReviewOutlinedIcon fontSize="small" />
        );

        return (
          <Box key={row.id} className="classic-editor__mui-feedback-row" data-state={row.kind}>
            <Box className="classic-editor__mui-feedback-title">
              <Chip
                size="small"
                variant="outlined"
                icon={icon}
                label={label}
                color={isCorrect ? "success" : isIncorrect ? "error" : "primary"}
              />
            </Box>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder={t("common.feedback")}
              aria-label={t("common.feedback")}
              value={row.feedback}
              onChange={(event) => updateRow(row.id, { feedback: event.target.value })}
              className="classic-editor__mui-feedback-input"
            />

            <Box className="classic-editor__mui-feedback-meta">
              <Select
                size="small"
                fullWidth
                value={row.branching ?? "By Result"}
                onChange={(event) => updateRow(row.id, { branching: event.target.value as QuizEditorFeedbackBranching })}
                startAdornment={<InputAdornment position="start"><AltRouteIcon fontSize="small" /></InputAdornment>}
                className="classic-editor__mui-feedback-branch"
                MenuProps={{
                  disablePortal: true,
                  slotProps: { paper: { className: "classic-editor__mui-select-menu classic-editor__mui-feedback-menu" } },
                }}
              >
                {branchingOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatBranchingLabel(option, t)}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                type="number"
                placeholder={t("common.score")}
                aria-label={t("common.score")}
                value={row.score}
                onChange={(event) => updateRow(row.id, { score: Number(event.target.value) })}
                onFocus={(event) => event.currentTarget.select()}
                className="classic-editor__mui-feedback-score"
              />
            </Box>
          </Box>
        );
      })}
    </StackPanel>
  );
}

function MuiQuestionSettings({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const options = slide.options ?? {};

  return (
    <StackPanel>
      <Box className="classic-editor__mui-settings-grid">
        <LabeledSelect
          label={t("common.questionType")}
          value={options.questionType ?? "Graded"}
          options={questionTypeOptions.map((value) => ({
            value,
            label: formatQuestionTypeLabel(value, t),
            description:
              value === "Graded"
                ? `${t("common.score")} + ${t("common.feedback")}`
                : value === "Survey"
                  ? t("quiz.optionByChoice")
                  : t("quiz.optionPractice"),
          }))}
          onChange={(value) => onUpdateOptions({ questionType: value })}
        />
        <LabeledSelect
          label={t("common.feedback")}
          value={options.feedback ?? "By Result"}
          options={feedbackOptions.map((value) => ({
            value,
            label: formatFeedbackOptionLabel(value, t),
            description: value === "None" ? t("common.none") : t("common.feedbackAndBranching"),
          }))}
          onChange={(value) => onUpdateOptions({ feedback: value })}
        />
        <LabeledSelect
          label={t("common.score")}
          value={options.score ?? "By Result"}
          options={scoreOptions.map((value) => ({
            value,
            label: value === "By Result" ? t("common.byResult") : t("quiz.optionCustom"),
            description: value === "By Result" ? t("common.feedbackAndBranching") : t("common.score"),
          }))}
          onChange={(value) => onUpdateOptions({ score: value })}
        />
      </Box>

      <Box className="classic-editor__mui-check-list">
        <FormControlLabel
          control={<Checkbox size="small" checked={options.limitTime ?? false} onChange={(event) => onUpdateOptions({ limitTime: event.target.checked })} />}
          label={t("quiz.limitTimeToAnswer")}
        />
        <TextField
          size="small"
          value={options.timeLimit ?? "01:00"}
          onChange={(event) => onUpdateOptions({ timeLimit: event.target.value })}
          disabled={!options.limitTime}
          className="classic-editor__mui-time-field"
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={options.shuffleAnswers ?? false} onChange={(event) => onUpdateOptions({ shuffleAnswers: event.target.checked })} />}
          label={t("quiz.shuffleAnswers")}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={options.acceptPartial ?? false} onChange={(event) => onUpdateOptions({ acceptPartial: event.target.checked })} />}
          label={t("quiz.acceptPartial")}
        />
      </Box>

      {slide.kind === "multiple-response" ? (
        <Box className="classic-editor__mui-inline-setting">
          <FormControlLabel
            control={<Checkbox size="small" checked={options.limitResponses ?? false} onChange={(event) => onUpdateOptions({ limitResponses: event.target.checked })} />}
            label={t("quiz.limitResponses")}
          />
          <LabeledSelect
            label=""
            value={String(options.limitResponsesValue ?? 1)}
            options={[1, 2, 3, 4].map((value) => ({ value: String(value), label: String(value) }))}
            onChange={(value) => onUpdateOptions({ limitResponsesValue: Number(value) })}
          />
        </Box>
      ) : null}

    </StackPanel>
  );
}

function MuiFinalSlideSettings({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const options = slide.options?.finalSlide;

  return (
    <Box className="classic-editor__mui-check-list">
      <FormControlLabel
        control={<Checkbox size="small" checked={options?.showUserScore ?? false} onChange={(event) => onUpdateOptions({ showUserScore: event.target.checked })} />}
        label={t("quiz.showUsersScore")}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={options?.allowReview ?? false} onChange={(event) => onUpdateOptions({ allowReview: event.target.checked })} />}
        label={t("quiz.allowUserReviewQuiz")}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={options?.allowRetry ?? false} onChange={(event) => onUpdateOptions({ allowRetry: event.target.checked })} />}
        label={t("quiz.allowUserRetryQuiz")}
      />
    </Box>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Box className="classic-editor__mui-labeled-select">
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <Select
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        renderValue={(selected) => options.find((option) => option.value === selected)?.label ?? String(selected)}
        MenuProps={{
          disablePortal: true,
          slotProps: { paper: { className: "classic-editor__mui-select-menu" } },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Box className="classic-editor__mui-select-option">
              <Typography variant="body2">{option.label}</Typography>
              {option.description ? <Typography variant="caption">{option.description}</Typography> : null}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

function StackPanel({ children }: { children: ReactNode }) {
  return <Box className="classic-editor__mui-stack-panel">{children}</Box>;
}

function formatBranchingLabel(option: QuizEditorFeedbackBranching, t: ReturnType<typeof useI18n>["t"]) {
  if (option === "By Result") return t("common.byResult");
  if (option === "Next Question") return t("quiz.nextQuestion");
  return t("player.finish");
}

function formatQuestionTypeLabel(option: (typeof questionTypeOptions)[number], t: ReturnType<typeof useI18n>["t"]) {
  if (option === "Graded") return t("common.graded");
  if (option === "Survey") return t("quiz.optionSurvey");
  return t("quiz.optionPractice");
}

function formatFeedbackOptionLabel(option: (typeof feedbackOptions)[number], t: ReturnType<typeof useI18n>["t"]) {
  if (option === "By Result") return t("common.byResult");
  if (option === "None") return t("common.none");
  return t("quiz.optionByChoice");
}

function extractCorrectScore(slide: QuizEditorSlide) {
  return (
    slide.feedbackRows?.find((row) => row.kind === "correct")?.score ??
    slide.feedbackRows?.find((row) => row.kind === "answered")?.score ??
    0
  );
}

function getActiveInlineMediaTarget(): InlineMediaTarget {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return { kind: "slide" };
  }

  const targetElement = activeElement.closest<HTMLElement>("[data-media-target-kind]");
  const kind = targetElement?.dataset.mediaTargetKind;
  const id = targetElement?.dataset.mediaTargetId;
  const field = targetElement?.dataset.mediaTargetField;

  if (kind === "choice" && id) {
    return { kind, id };
  }

  if (kind === "drag-item" && id) {
    return { kind, id, field: field === "target" ? "target" : "label" };
  }

  return { kind: "slide" };
}

function applyInlineMedia(
  slide: QuizEditorSlide,
  target: InlineMediaTarget,
  media: QuizEditorSlideMedia,
): QuizEditorSlide {
  if (target.kind === "choice") {
    return {
      ...slide,
      choices: slide.choices?.map((choice) =>
        choice.id === target.id ? { ...choice, media } : choice,
      ),
    };
  }

  if (target.kind === "drag-item") {
    return {
      ...slide,
      dragDropItems: slide.dragDropItems?.map((item) =>
        item.id === target.id
          ? target.field === "target"
            ? { ...item, targetMedia: media }
            : { ...item, media }
          : item,
      ),
    };
  }

  return { ...slide, media };
}

function cloneSlide(slide: QuizEditorSlide) {
  return JSON.parse(JSON.stringify(slide)) as QuizEditorSlide;
}
