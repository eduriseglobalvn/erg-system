import type { ReactNode } from "react";

import { AlignCenter as FormatAlignCenterIcon } from "@/components/mui-icon-shim";
import { AlignJustify as FormatAlignJustifyIcon } from "@/components/mui-icon-shim";
import { AlignLeft as FormatAlignLeftIcon } from "@/components/mui-icon-shim";
import { AlignRight as FormatAlignRightIcon } from "@/components/mui-icon-shim";
import { Bold as FormatBoldIcon } from "@/components/mui-icon-shim";
import { Outdent as FormatIndentDecreaseIcon } from "@/components/mui-icon-shim";
import { Indent as FormatIndentIncreaseIcon } from "@/components/mui-icon-shim";
import { Italic as FormatItalicIcon } from "@/components/mui-icon-shim";
import { Heading as FormatLineSpacingIcon } from "@/components/mui-icon-shim";
import { List as FormatListBulletedIcon } from "@/components/mui-icon-shim";
import { ListOrdered as FormatListNumberedIcon } from "@/components/mui-icon-shim";
import { Type as FormatSizeIcon } from "@/components/mui-icon-shim";
import { Strikethrough as FormatStrikethroughIcon } from "@/components/mui-icon-shim";
import { Subscript as SubscriptIcon } from "@/components/mui-icon-shim";
import { Superscript as SuperscriptIcon } from "@/components/mui-icon-shim";
import { Underline as FormatUnderlinedIcon } from "@/components/mui-icon-shim";
import { Minus as HorizontalRuleIcon } from "@/components/mui-icon-shim";
import { Plus as AddIcon } from "@/components/mui-icon-shim";

import { resolveQuizFontStack } from "@/config/fonts";
import {
  quizEditorFontOptions,
  quizEditorFontSizeOptions,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorTextStyle } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

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
        <FormatSizeIcon className="h-6 w-6" size="1em" />
        <span>{t("quiz.textStyles")}</span>
      </button>

      <div className="classic-editor__shared-text-column">
        <div className="classic-editor__shared-text-control-row">
          <AppSelect
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
          </AppSelect>

          <AppSelect
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
          </AppSelect>
        </div>

        <div className="classic-editor__shared-text-format-row">
          <SharedTextIconButton
            icon={<FormatBoldIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.bold}
            disabled={disabled}
            onClick={() => onUpdate({ bold: !value.bold })}
          />
          <SharedTextIconButton
            icon={<FormatItalicIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.italic}
            disabled={disabled}
            onClick={() => onUpdate({ italic: !value.italic })}
          />
          <SharedTextIconButton
            icon={<FormatUnderlinedIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.underline}
            disabled={disabled}
            onClick={() => onUpdate({ underline: !value.underline })}
          />
          <SharedTextIconButton
            icon={<HorizontalRuleIcon className="h-3.5 w-3.5" size="1em" />}
            disabled={disabled}
            onClick={() => onUpdate({ fontSize: Math.max(8, value.fontSize - 1) })}
          />
          <SharedTextIconButton
            icon={<AddIcon className="h-3.5 w-3.5" size="1em" />}
            disabled={disabled}
            onClick={() => onUpdate({ fontSize: Math.min(40, value.fontSize + 1) })}
          />
          <SharedTextIconButton icon={<FormatStrikethroughIcon className="h-3.5 w-3.5" size="1em" />} disabled />
          <SharedTextIconButton icon={<SubscriptIcon className="h-3.5 w-3.5" size="1em" />} disabled />
          <SharedTextIconButton icon={<SuperscriptIcon className="h-3.5 w-3.5" size="1em" />} disabled />
        </div>

        <div className="classic-editor__shared-text-caption">Font</div>
      </div>

      <div className="classic-editor__shared-text-column is-paragraph">
        <div className="classic-editor__shared-paragraph-grid">
          <SharedTextIconButton
            icon={<FormatListBulletedIcon className="h-3.5 w-3.5" size="1em" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatListNumberedIcon className="h-3.5 w-3.5" size="1em" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatIndentDecreaseIcon className="h-3.5 w-3.5" size="1em" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatIndentIncreaseIcon className="h-3.5 w-3.5" size="1em" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatLineSpacingIcon className="h-3.5 w-3.5" size="1em" />}
            disabled
          />
          <SharedTextIconButton
            icon={<FormatAlignLeftIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.align === "left"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "left" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignCenterIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.align === "center"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "center" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignRightIcon className="h-3.5 w-3.5" size="1em" />}
            active={value.align === "right"}
            disabled={disabled}
            onClick={() => onUpdate({ align: "right" })}
          />
          <SharedTextIconButton
            icon={<FormatAlignJustifyIcon className="h-3.5 w-3.5" size="1em" />}
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
