import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ColorLensOutlinedIcon from "@mui/icons-material/ColorLensOutlined";
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
import TextFieldsIcon from "@mui/icons-material/TextFields";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Switch,
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
  resolveSlideTextStyle,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { syncQuizEditorSlideFromRuntimeQuestion } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
import { useI18n } from "@/platform/i18n";
import type { Question } from "@/lib/types";
import type {
  QuizEditorFeedbackBranching,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorSlideOptions,
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

type InlineMediaTarget =
  | { kind: "choice"; id: string }
  | { kind: "drag-item"; id: string; field: "label" | "target" }
  | { kind: "slide" };

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
  const activeFormats = [
    resolvedTextStyle.bold ? "bold" : null,
    resolvedTextStyle.italic ? "italic" : null,
    resolvedTextStyle.underline ? "underline" : null,
  ].filter(Boolean) as string[];
  const questionThemeColor = draftSlide.options?.themeColor ?? "#0f6cbd";

  function handleFontChange(event: { target: { value: unknown } }) {
    updateTextStyle({ fontFamily: String(event.target.value) });
  }

  function handleFontSizeChange(event: { target: { value: unknown } }) {
    updateTextStyle({ fontSize: Number(event.target.value) });
  }

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
            <label className="classic-editor__question-theme-color-control">
              <ColorLensOutlinedIcon fontSize="small" />
              <span>Màu câu</span>
              <i style={{ backgroundColor: questionThemeColor }} />
              <input
                type="color"
                value={questionThemeColor}
                onInput={(event) => updateSlideOptions({ themeColor: event.currentTarget.value })}
                onChange={(event) => updateSlideOptions({ themeColor: event.target.value })}
                aria-label="Màu câu"
              />
            </label>
            <QuestionEditorRibbonButton
              icon={<ColorLensOutlinedIcon fontSize="small" />}
              label="Giao diện"
              onClick={onOpenPlayerTemplate}
            />
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

function updateSlideTextStyleTarget(
  slide: QuizEditorSlide,
  target: QuizEditorTextStyleTarget,
  patch: Partial<QuizEditorTextStyle>,
): QuizEditorSlide {
  const currentStyle = resolveSlideTextStyle(slide, target);
  const nextStyle = { ...defaultQuizTextStyle, ...currentStyle, ...patch };

  return {
    ...slide,
    textStyle: target === "question" ? nextStyle : slide.textStyle,
    textStyles: {
      ...slide.textStyles,
      [target]: nextStyle,
    },
  };
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
  const [activeTab, setActiveTab] = useState<"settings" | "feedback" | "media">("settings");

  const hasFeedback = Boolean(draftSlide.feedbackRows && draftSlide.feedbackRows.length > 0);
  const hasCustomFeedback = draftSlide.feedbackRows?.some((r) => r.feedback?.trim());
  const hasMedia = Boolean(draftSlide.media?.src);

  const currentTab = !hasFeedback && activeTab === "feedback" ? "settings" : activeTab;

  return (
    <Box
      className="classic-editor__mui-inspector"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        height: "100%",
      }}
    >
      {/* Top Segmented Tabs */}
      <Box
        sx={{
          display: "flex",
          p: "4px",
          borderRadius: "10px",
          bgcolor: "#F1F5F9",
          border: "1px solid #E2E8F0",
          gap: "4px",
        }}
      >
        <ButtonBase
          onClick={() => setActiveTab("settings")}
          sx={{
            flex: 1,
            py: "7px",
            px: "8px",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            bgcolor: currentTab === "settings" ? "#FFFFFF" : "transparent",
            color: currentTab === "settings" ? "#0F6CBD" : "#64748B",
            boxShadow: currentTab === "settings" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            "&:hover": {
              color: "#0F6CBD",
            },
          }}
        >
          <TuneRoundedIcon sx={{ fontSize: 16 }} />
          <span>{t("quiz.questionSettings") || "Cài đặt"}</span>
        </ButtonBase>

        {hasFeedback ? (
          <ButtonBase
            onClick={() => setActiveTab("feedback")}
            sx={{
              flex: 1,
              py: "7px",
              px: "8px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              bgcolor: currentTab === "feedback" ? "#FFFFFF" : "transparent",
              color: currentTab === "feedback" ? "#0F6CBD" : "#64748B",
              boxShadow: currentTab === "feedback" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#0F6CBD",
              },
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />
            <span>{t("quiz.feedbackAndScoring") || "Phản hồi"}</span>
            {hasCustomFeedback ? (
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#0F6CBD" }} />
            ) : null}
          </ButtonBase>
        ) : null}

        <ButtonBase
          onClick={() => setActiveTab("media")}
          sx={{
            flex: 1,
            py: "7px",
            px: "8px",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            bgcolor: currentTab === "media" ? "#FFFFFF" : "transparent",
            color: currentTab === "media" ? "#0F6CBD" : "#64748B",
            boxShadow: currentTab === "media" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            "&:hover": {
              color: "#0F6CBD",
            },
          }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 16 }} />
          <span>{t("common.picture") || "Hình ảnh"}</span>
          {hasMedia ? (
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />
          ) : null}
        </ButtonBase>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, overflowY: "auto", pr: 0.5 }}>
        {currentTab === "settings" && (
          draftSlide.kind === "result-slide" ? (
            <MuiFinalSlideSettings slide={draftSlide} onUpdateOptions={onUpdateFinalSlideOptions} />
          ) : (
            <MuiQuestionSettings slide={draftSlide} onUpdateOptions={onUpdateOptions} />
          )
        )}

        {currentTab === "feedback" && hasFeedback && (
          <MuiFeedbackAndScoring rows={draftSlide.feedbackRows!} onChange={onUpdateFeedbackRows} />
        )}

        {currentTab === "media" && (
          <MuiMediaSettings
            slide={draftSlide}
            onPickMedia={onPickMedia}
            onRemoveMedia={onRemoveMedia}
            onUpdateMediaAlt={onUpdateMediaAlt}
          />
        )}
      </Box>
    </Box>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {media?.src ? (
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            bgcolor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
              {t("common.picture") || "Hình ảnh câu hỏi"}
            </Typography>
            <IconButton size="small" color="error" onClick={onRemoveMedia} title={t("common.remove")}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              width: "100%",
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <img
              src={media.src}
              alt={media.alt || t("common.picture")}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            fullWidth
            startIcon={<AddPhotoAlternateIcon fontSize="small" />}
            onClick={onPickMedia}
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            Thay ảnh khác
          </Button>

          <TextField
            size="small"
            fullWidth
            label={t("quiz.imageAltText") || "Văn bản thay thế (Alt text)"}
            value={media.alt ?? ""}
            onChange={(event) => onUpdateMediaAlt(event.target.value)}
            placeholder={t("quiz.imageAltPlaceholder") || "Mô tả hình ảnh cho học sinh khiếm thị..."}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "13px",
              },
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            bgcolor: "#FFFFFF",
            border: "1.5px dashed #CBD5E1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 1,
            py: 4,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#F0F7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 0.5,
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 26, color: "#0F6CBD" }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "14px" }}>
            Chưa có hình ảnh
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", maxWidth: 220, mb: 1 }}>
            Thêm hình ảnh minh họa để câu hỏi trực quan và sinh động hơn
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddPhotoAlternateIcon fontSize="small" />}
            onClick={onPickMedia}
            sx={{
              borderRadius: "8px",
              fontWeight: 700,
              bgcolor: "#0F6CBD",
              "&:hover": { bgcolor: "#0D5CA0" },
            }}
          >
            {t("quiz.addImage") || "Tải ảnh lên"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

const branchingOptions: QuizEditorFeedbackBranching[] = ["By Result", "Next Question", "Finish Quiz"];
const questionTypeOptions = ["Graded", "Survey", "Practice"] as const;
const feedbackOptions = ["By Result", "None", "By choice"] as const;

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map((row) => {
        const isCorrect = row.kind === "correct";
        const isIncorrect = row.kind === "incorrect";
        const label = isCorrect
          ? "Khi trả lời Đúng"
          : isIncorrect
            ? "Khi trả lời Sai"
            : t("common.answered");

        const icon = isCorrect ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#16A34A" }} />
        ) : isIncorrect ? (
          <ErrorOutlineIcon sx={{ fontSize: 16, color: "#DC2626" }} />
        ) : (
          <RateReviewOutlinedIcon sx={{ fontSize: 16, color: "#0F6CBD" }} />
        );

        const borderCol = isCorrect
          ? "rgba(34, 197, 94, 0.35)"
          : isIncorrect
            ? "rgba(239, 68, 68, 0.3)"
            : "#E2E8F0";

        const bgCol = isCorrect
          ? "#F0FDF4"
          : isIncorrect
            ? "#FEF2F2"
            : "#FFFFFF";

        return (
          <Box
            key={row.id}
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: bgCol,
              border: `1px solid ${borderCol}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {icon}
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: isCorrect ? "#15803D" : isIncorrect ? "#B91C1C" : "#0F172A",
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Box>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder={
                isCorrect
                  ? "Nhập lời khen hoặc giải thích khi thí sinh làm đúng..."
                  : isIncorrect
                    ? "Nhập giải thích đáp án đúng hoặc gợi ý khi làm sai..."
                    : t("common.feedback")
              }
              value={row.feedback}
              onChange={(event) => updateRow(row.id, { feedback: event.target.value })}
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  borderRadius: "8px",
                },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>
                Điều hướng:
              </Typography>
              <Box className="classic-editor__native-select-wrap" sx={{ flex: 1 }}>
                <select
                  className="classic-editor__native-select"
                  aria-label={t("common.feedbackAndBranching")}
                  value={row.branching ?? "By Result"}
                  onChange={(event) =>
                    updateRow(row.id, { branching: event.currentTarget.value as QuizEditorFeedbackBranching })
                  }
                >
                  {branchingOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatBranchingLabel(option, t)}
                    </option>
                  ))}
                </select>
                <ExpandMoreIcon fontSize="small" aria-hidden="true" />
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
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

  const timePresets = [
    { label: "30s", value: "00:30" },
    { label: "1m", value: "01:00" },
    { label: "2m", value: "02:00" },
    { label: "5m", value: "05:00" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Card 1: Question Behavior */}
      <Box
        sx={{
          p: 2,
          borderRadius: "12px",
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
          Hành vi làm bài
        </Typography>

        {/* Shuffle Answers */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ pr: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
              {t("quiz.shuffleAnswers")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
              Tự động xáo trộn thứ tự các đáp án cho mỗi lượt làm
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={options.shuffleAnswers ?? false}
            onChange={(event) => onUpdateOptions({ shuffleAnswers: event.target.checked })}
            color="primary"
          />
        </Box>

        <Divider sx={{ borderColor: "#F1F5F9" }} />

        {/* Time Limit */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ pr: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                {t("quiz.limitTimeToAnswer")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
                Tự động kết thúc và nộp câu hỏi khi hết giờ
              </Typography>
            </Box>
            <Switch
              size="small"
              checked={options.limitTime ?? false}
              onChange={(event) => onUpdateOptions({ limitTime: event.target.checked })}
              color="primary"
            />
          </Box>

          {options.limitTime ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.5, pt: 0.5 }}>
              <TextField
                size="small"
                value={options.timeLimit ?? "01:00"}
                onChange={(event) => onUpdateOptions({ timeLimit: event.target.value })}
                placeholder="mm:ss"
                sx={{
                  width: 90,
                  "& input": { textAlign: "center", fontWeight: 700, fontSize: "13px", py: "6px" },
                }}
              />
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {timePresets.map((preset) => (
                  <Chip
                    key={preset.value}
                    label={preset.label}
                    size="small"
                    variant={options.timeLimit === preset.value ? "filled" : "outlined"}
                    color={options.timeLimit === preset.value ? "primary" : "default"}
                    onClick={() => onUpdateOptions({ timeLimit: preset.value })}
                    sx={{ fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                  />
                ))}
              </Box>
            </Box>
          ) : null}
        </Box>

        <Divider sx={{ borderColor: "#F1F5F9" }} />

        {/* Accept Partial */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ pr: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
              {t("quiz.acceptPartial")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
              Cộng điểm theo tỷ lệ các phương án đúng đã chọn
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={options.acceptPartial ?? false}
            onChange={(event) => onUpdateOptions({ acceptPartial: event.target.checked })}
            color="primary"
          />
        </Box>

        {/* Multiple-response Limit Responses */}
        {slide.kind === "multiple-response" ? (
          <>
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ pr: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                    {t("quiz.limitResponses")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
                    Khóa ô chọn khi học sinh đạt số lựa chọn tối đa
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={options.limitResponses ?? false}
                  onChange={(event) => onUpdateOptions({ limitResponses: event.target.checked })}
                  color="primary"
                />
              </Box>
              {options.limitResponses ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                    Số lựa chọn:
                  </Typography>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Chip
                      key={num}
                      label={num}
                      size="small"
                      variant={options.limitResponsesValue === num ? "filled" : "outlined"}
                      color={options.limitResponsesValue === num ? "primary" : "default"}
                      onClick={() => onUpdateOptions({ limitResponsesValue: num })}
                      sx={{ minWidth: 28, fontWeight: 700, cursor: "pointer" }}
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
          </>
        ) : null}
      </Box>

      {/* Card 2: Question Type & Feedback Mode */}
      <Box
        sx={{
          p: 2,
          borderRadius: "12px",
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
          {t("quiz.feedbackAndScoring")}
        </Typography>

        <LabeledSelect
          label={t("common.questionType")}
          value={options.questionType ?? "Graded"}
          options={questionTypeOptions.map((value) => ({
            value,
            label: formatQuestionTypeLabel(value, t),
            description:
              value === "Graded"
                ? t("common.feedback")
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
      </Box>
    </Box>
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
    <Box
      sx={{
        p: 2,
        borderRadius: "12px",
        bgcolor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
        Cài đặt trang kết thúc
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.showUsersScore")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Hiển thị điểm tổng kết và tỷ lệ đúng sau khi nộp bài
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.showUserScore ?? false}
          onChange={(event) => onUpdateOptions({ showUserScore: event.target.checked })}
          color="primary"
        />
      </Box>

      <Divider sx={{ borderColor: "#F1F5F9" }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.allowUserReviewQuiz")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Cho phép xem lại từng câu hỏi và đáp án chi tiết
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.allowReview ?? false}
          onChange={(event) => onUpdateOptions({ allowReview: event.target.checked })}
          color="primary"
        />
      </Box>

      <Divider sx={{ borderColor: "#F1F5F9" }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.allowUserRetryQuiz")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Cho phép học sinh nhấn làm lại bài kiểm tra
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.allowRetry ?? false}
          onChange={(event) => onUpdateOptions({ allowRetry: event.target.checked })}
          color="primary"
        />
      </Box>
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
      <Box className="classic-editor__native-select-wrap">
        <select
          className="classic-editor__native-select"
          aria-label={label || "Select"}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.description ? `${option.label} - ${option.description}` : option.label}
            </option>
          ))}
        </select>
        <ExpandMoreIcon fontSize="small" aria-hidden="true" />
      </Box>
    </Box>
  );
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
