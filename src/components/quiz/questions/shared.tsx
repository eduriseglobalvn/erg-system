import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { ReactNode } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import type { AnswerPayload, Question } from "@/lib/types";
import { useI18n } from "@/platform/i18n";

export function QuestionBodyWithImage({
  question,
  children,
}: {
  question: Question;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 1.5 : 2.5 }}>
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
        bgcolor: "common.white",
        border: "1px solid var(--quiz-canvas-border)",
        borderRadius: isMobile ? 0.75 : 1,
        boxShadow: 1,
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
  const isMobile = useIsMobile();
  const selectedValue = value.inlineSelections?.[blank.id] ?? "";
  const isAnswered = Boolean(selectedValue);
  const isCorrect = reviewMode && isAnswered && selectedValue === correctValue;
  const isWrong = reviewMode && isAnswered && selectedValue !== correctValue;
  const successColor = "#118D57";
  const dangerColor = "#e82828";

  return (
    <Box sx={{ flex: "none", position: "relative" }}>
      <FormControl size="small" sx={{ minWidth: isMobile ? 104 : 220 }}>
        <Select
          aria-label={blank.statement}
          data-quiz-player-select="true"
          disabled={submitted}
          displayEmpty
          value={selectedValue}
          onChange={(event) =>
            onChange({
              inlineSelections: {
                ...(value.inlineSelections ?? {}),
                [blank.id]: event.target.value,
              },
            })
          }
          sx={{
            bgcolor: isCorrect ? "rgba(34,197,94,0.08)" : isWrong ? "rgba(232,40,40,0.055)" : "var(--quiz-input-bg)",
            color: isCorrect ? successColor : isWrong ? dangerColor : "var(--quiz-option-text)",
            transition: "border-color 160ms ease, background-color 160ms ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isCorrect ? "rgba(17,141,87,0.62)" : isWrong ? "rgba(232,40,40,0.62)" : "var(--quiz-canvas-border)",
            },
          }}
        >
          <MenuItem value=""><em>{t("player.selectPlaceholder")}</em></MenuItem>
          {blank.options.map((option) => (
            <MenuItem key={option} value={option}>
              {option === "yes" ? t("player.yes") : option === "no" ? t("player.no") : option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {isWrong ? (
        <IconButton
          type="button"
          aria-label="Xem đáp án đúng"
          onClick={onRevealCorrectAnswer}
          size="small"
          sx={{
            border: "1px solid rgba(232,40,40,0.45)",
            color: dangerColor,
            fontSize: isMobile ? 14 : 16,
            fontWeight: 600,
            height: isMobile ? 24 : 28,
            position: "absolute",
            right: isMobile ? 6 : 8,
            top: "50%",
            transform: "translateY(-50%)",
            transition: "background-color 160ms ease",
            width: isMobile ? 24 : 28,
            "&:hover": { bgcolor: "rgba(232,40,40,0.08)" },
          }}
        >
          ?
        </IconButton>
      ) : null}
    </Box>
  );
}
