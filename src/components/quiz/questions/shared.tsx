import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { ReactNode } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** Answers line up with the question text (design WL2): drop the legacy shell indent of the answer regions. */
export const flushAnswerRegionSx = { "& .quiz-answer-region, & .quiz-answer-region-wide, &.quiz-answer-region, &.quiz-answer-region-wide": { pl: 0 } } as const;

export function QuestionBodyWithImage({
  question,
  children,
}: {
  question: Question;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 }, ...flushAnswerRegionSx }}>
      {question.contentImage ? <QuestionContentImage question={question} /> : null}
      {children}
    </Box>
  );
}

export function QuestionContentImage({
  question,
  className = "",
}: {
  question: Question;
  className?: string;
}) {
  const isMobile = useIsMobile();

  if (!question.contentImage) {
    return null;
  }

  return (
    <Box
      className={className}
      sx={{
        bgcolor: "background.paper",
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.card}px`,
        overflow: "hidden",
      }}
    >
      <Box
        component="img"
        src={question.contentImage.url}
        alt={question.contentImage.alt ?? question.title}
        sx={{ display: "block", height: "auto", maxHeight: isMobile ? 180 : 420, objectFit: "contain", width: "100%" }}
      />
    </Box>
  );
}

/** Look of a blank inside running text: dashed while empty, solid once filled, green/red in review. */
export function blankSx(state: "empty" | "active" | "filled" | "correct" | "wrong") {
  const look = {
    empty: { bg: tokens.color.surfaceMuted, border: tokens.color.borderStrong, color: tokens.color.textMuted, style: "dashed" },
    active: { bg: tokens.color.primarySofter, border: tokens.color.primary, color: tokens.statusTint.info.color, style: "solid" },
    filled: { bg: tokens.color.surface, border: tokens.color.primarySoft, color: tokens.statusTint.info.color, style: "solid" },
    correct: { bg: tokens.statusTint.success.bg, border: tokens.color.success, color: tokens.statusTint.success.color, style: "solid" },
    wrong: { bg: tokens.statusTint.error.bg, border: tokens.color.danger, color: tokens.statusTint.error.color, style: "solid" },
  }[state];
  return {
    typography: "subtitle1",
    alignItems: "center",
    bgcolor: look.bg,
    border: `1.5px ${look.style} ${look.border}`,
    borderRadius: `${tokens.radius.sm}px`,
    color: look.color,
    display: "inline-flex",
    fontWeight: "fontWeightBold",
    lineHeight: 1.3,
    minHeight: 34,
    minWidth: 84,
    m: 0.25,
    px: 1.25,
    verticalAlign: "middle",
  } as const;
}

function inlineLabel(t: ReturnType<typeof useI18n>["t"], option: string) {
  return option === "yes" ? t("player.yes") : option === "no" ? t("player.no") : option;
}

export function InlineChoiceSelect({
  blank,
  correctValue,
  reviewMode = false,
  submitted,
  value,
  onChange,
  onRevealCorrectAnswer,
}: {
  blank: NonNullable<Question["inlineBlanks"]>[number];
  correctValue?: string;
  reviewMode?: boolean;
  submitted: boolean;
  value: AnswerPayload;
  onChange: (next: AnswerPayload) => void;
  onRevealCorrectAnswer?: () => void;
}) {
  const { t } = useI18n();
  const selectedValue = value.inlineSelections?.[blank.id] ?? "";
  const isAnswered = Boolean(selectedValue);
  const isCorrect = reviewMode && isAnswered && selectedValue === correctValue;
  const isWrong = reviewMode && isAnswered && selectedValue !== correctValue;
  const state = isCorrect ? "correct" : isWrong ? "wrong" : isAnswered ? "filled" : "empty";

  return (
    <Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5, verticalAlign: "middle" }}>
      <Select
        aria-label={blank.statement}
        data-quiz-player-select="true"
        disabled={submitted}
        displayEmpty
        value={selectedValue}
        input={<InputBase />}
        IconComponent={ExpandMoreRoundedIcon}
        renderValue={(selected) => (selected ? inlineLabel(t, selected) : t("player.selectPlaceholder"))}
        onChange={(event) =>
          onChange({
            inlineSelections: {
              ...(value.inlineSelections ?? {}),
              [blank.id]: event.target.value,
            },
          })
        }
        sx={{
          ...blankSx(state),
          ...(isWrong ? { textDecoration: "line-through" } : null),
          transition: `border-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}, background-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
          "&.Mui-focused": { borderColor: "primary.main", boxShadow: tokens.shadow.focus },
          "& .MuiSelect-select": { minHeight: 0, py: 0.5, pl: 0, pr: "24px !important" },
          "& .MuiSelect-icon": { color: "inherit", fontSize: tokens.size.iconSm, right: 6 },
          "&.Mui-disabled .MuiSelect-select": { WebkitTextFillColor: "currentColor" },
        }}
      >
        <MenuItem value=""><em>{t("player.selectPlaceholder")}</em></MenuItem>
        {blank.options.map((option) => (
          <MenuItem key={option} value={option}>
            {inlineLabel(t, option)}
          </MenuItem>
        ))}
      </Select>
      {isWrong ? (
        <IconButton
          type="button"
          aria-label="Xem đáp án đúng"
          onClick={onRevealCorrectAnswer}
          size="small"
          sx={{
            typography: "caption",
            border: "1px solid",
            borderColor: "error.main",
            color: "error.main",
            fontWeight: "fontWeightBold",
            height: 26,
            width: 26,
            "&:hover": { bgcolor: tokens.statusTint.error.bg },
          }}
        >
          ?
        </IconButton>
      ) : null}
    </Box>
  );
}

/** Có always before Không, whatever order the package shuffled them into. */
function segmentOrder(options: string[]) {
  return options.length === 2 && options.includes("yes") && options.includes("no") ? ["yes", "no"] : options;
}

/** Two-option blank (e.g. Có / Không, Đúng / Sai) as a segmented control on the statement's row. */
export function InlineChoiceSegment({
  blank,
  correctValue,
  reviewMode = false,
  submitted,
  value,
  onChange,
}: {
  blank: NonNullable<Question["inlineBlanks"]>[number];
  correctValue?: string;
  reviewMode?: boolean;
  submitted: boolean;
  value: AnswerPayload;
  onChange: (next: AnswerPayload) => void;
}) {
  const { t } = useI18n();
  const selectedValue = value.inlineSelections?.[blank.id] ?? "";

  return (
    <Box
      role="radiogroup"
      aria-label={blank.statement}
      sx={{ bgcolor: tokens.color.divider, borderRadius: `${tokens.radius.control}px`, display: "flex", flex: "none", gap: 0.25, p: "3px", width: { xs: 112, sm: 160 } }}
    >
      {segmentOrder(blank.options).map((option, index) => {
        const checked = selectedValue === option;
        const isRight = reviewMode && option === correctValue;
        const isWrongPick = reviewMode && checked && option !== correctValue;
        // While answering, "yes" (or the first option) reads green and "no" (or the second) red, like the design's Đúng / Sai.
        const pickedColor = option === "no" || (option !== "yes" && index > 0) ? "error.main" : "success.main";
        return (
          <ButtonBase
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={submitted}
            onClick={() => onChange({ inlineSelections: { ...(value.inlineSelections ?? {}), [blank.id]: option } })}
            sx={{
              typography: "subtitle2",
              bgcolor: isWrongPick ? tokens.statusTint.error.bg : isRight ? tokens.statusTint.success.bg : checked ? "background.paper" : "transparent",
              border: "1.5px solid",
              borderColor: isWrongPick ? "error.main" : isRight ? "success.main" : "transparent",
              borderRadius: `${tokens.radius.sm}px`,
              boxShadow: checked && !reviewMode ? tokens.shadow.xs : "none",
              color: reviewMode ? (isWrongPick ? "error.dark" : isRight ? "success.dark" : "text.secondary") : checked ? pickedColor : "text.secondary",
              flex: 1,
              height: 36,
              minWidth: 0,
              px: 0.5,
              whiteSpace: "nowrap",
              "&.Mui-focusVisible": { boxShadow: tokens.shadow.focus },
              "&.Mui-disabled": { cursor: "default" },
            }}
          >
            {inlineLabel(t, option)}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
