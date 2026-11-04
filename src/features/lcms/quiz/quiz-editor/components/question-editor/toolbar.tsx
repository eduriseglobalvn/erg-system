import type { ReactNode } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ColorLensOutlinedIcon from "@mui/icons-material/ColorLensOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PreviewIcon from "@mui/icons-material/Preview";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";

import { resolveQuizFontStack } from "@/config/fonts";
import { handleClipboardCommand } from "@/features/lcms/quiz/quiz-editor/components/question-editor/clipboard";
import {
  quizEditorFontOptions,
  quizEditorFontSizeOptions,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide, QuizEditorTextStyle } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type QuestionEditorToolbarProps = {
  resolvedTextStyle: QuizEditorTextStyle;
  questionThemeColor: string;
  onUpdateTextStyle: (patch: Partial<QuizEditorTextStyle>) => void;
  onUpdateSlideOptions: (patch: Partial<NonNullable<QuizEditorSlide["options"]>>) => void;
  onPickMedia: () => void;
  onOpenPlayerTemplate: () => void;
  onPreview: () => void;
};

export function QuestionEditorToolbar({
  resolvedTextStyle,
  questionThemeColor,
  onUpdateTextStyle: updateTextStyle,
  onUpdateSlideOptions: updateSlideOptions,
  onPickMedia: handlePickMedia,
  onOpenPlayerTemplate,
  onPreview,
}: QuestionEditorToolbarProps) {
  const { t } = useI18n();
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

  return (
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
            onClick={() => onPreview()}
            className="classic-editor__mui-preview-button"
          >
            {t("common.preview")}
          </Button>
        </Box>
      </Box>
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
