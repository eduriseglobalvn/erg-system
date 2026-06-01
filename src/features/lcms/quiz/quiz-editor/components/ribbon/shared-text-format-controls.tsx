import type { ReactNode } from "react";

import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatLineSpacingIcon from "@mui/icons-material/FormatLineSpacing";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import SubscriptIcon from "@mui/icons-material/Subscript";
import SuperscriptIcon from "@mui/icons-material/Superscript";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import AddIcon from "@mui/icons-material/Add";

import { resolveQuizFontStack } from "@/config/fonts";
import {
  quizEditorFontOptions,
  quizEditorFontSizeOptions,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorTextStyle } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

export function SharedTextFormatControls({
  value,
  disabled = false,
  onUpdate,
  onOpenTextStyles,
}: {
  value: QuizEditorTextStyle;
  disabled?: boolean;
  onUpdate: (patch: Partial<QuizEditorTextStyle>) => void;
  onOpenTextStyles?: () => void;
}) {
  const { t } = useI18n();

  return (
    <section className="classic-editor__shared-text-controls">
      <button
        type="button"
        disabled={!onOpenTextStyles}
        onClick={onOpenTextStyles}
        className={cn("classic-editor__shared-textstyles-tile", !onOpenTextStyles && "is-disabled")}
      >
        <FormatSizeIcon className="h-6 w-6" fontSize="inherit" />
        <span>{t("quiz.textStyles")}</span>
      </button>

      <div className="classic-editor__shared-text-column">
        <div className="classic-editor__shared-text-control-row">
          <select
            value={value.fontFamily}
            disabled={disabled}
            onChange={(event) => onUpdate({ fontFamily: event.target.value })}
            className="classic-editor__shared-native-select classic-editor__shared-native-select--font"
            style={{ fontFamily: resolveQuizFontStack(value.fontFamily) }}
          >
            {quizEditorFontOptions.map((font) => (
              <option key={font} value={font} style={{ fontFamily: resolveQuizFontStack(font) }}>
                {font}
              </option>
            ))}
          </select>

          <select
            value={value.fontSize}
            disabled={disabled}
            onChange={(event) => onUpdate({ fontSize: Number(event.target.value) })}
            className="classic-editor__shared-native-select classic-editor__shared-native-select--size"
          >
            {quizEditorFontSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="classic-editor__shared-text-format-row">
          <SharedTextIconButton
            icon={<FormatBoldIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.bold}
            disabled={disabled}
            onClick={() => onUpdate({ bold: !value.bold })}
          />
          <SharedTextIconButton
            icon={<FormatItalicIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.italic}
            disabled={disabled}
            onClick={() => onUpdate({ italic: !value.italic })}
          />
          <SharedTextIconButton
            icon={<FormatUnderlinedIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.underline}
            disabled={disabled}
            onClick={() => onUpdate({ underline: !value.underline })}
          />
          <SharedTextIconButton
            icon={<HorizontalRuleIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled={disabled}
            onClick={() => onUpdate({ fontSize: Math.max(8, value.fontSize - 1) })}
          />
          <SharedTextIconButton
            icon={<AddIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled={disabled}
            onClick={() => onUpdate({ fontSize: Math.min(40, value.fontSize + 1) })}
          />
          <SharedTextIconButton icon={<FormatStrikethroughIcon className="h-3.5 w-3.5" fontSize="inherit" />} disabled />
          <SharedTextIconButton icon={<SubscriptIcon className="h-3.5 w-3.5" fontSize="inherit" />} disabled />
          <SharedTextIconButton icon={<SuperscriptIcon className="h-3.5 w-3.5" fontSize="inherit" />} disabled />
        </div>

        <div className="classic-editor__shared-text-caption">Font</div>
      </div>

      <div className="classic-editor__shared-text-column is-paragraph">
        <div className="classic-editor__shared-paragraph-grid">
          <SharedTextIconButton
            icon={<FormatListBulletedIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatListNumberedIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatIndentDecreaseIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatIndentIncreaseIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatLineSpacingIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatAlignLeftIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.align === "left"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "left" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignCenterIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.align === "center"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "center" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignRightIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.align === "right"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "right" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignJustifyIcon className="h-3.5 w-3.5" fontSize="inherit" />}
            active={value.align === "justify"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "justify" })}
          />
        </div>

        <div className="classic-editor__shared-text-caption">Paragraph</div>
      </div>
    </section>
  );
}

function SharedTextIconButton({
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn("classic-editor__shared-text-icon-button", active && "is-active")}
    >
      {icon}
    </button>
  );
}
