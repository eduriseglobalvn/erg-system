import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";
import type { QuestionImage } from "@/domain/quiz/types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ReactNode } from "react";

export type ChoiceReviewTag = "correct" | "picked" | "pickedWrong";

type ChoiceOptionProps = {
  children: ReactNode;
  disabled?: boolean;
  image?: QuestionImage;
  /** Letter shown in the round key (A, B, C...). */
  letter?: string;
  mode: "single" | "multiple";
  onClick: () => void;
  /** Review label; when omitted it is derived from the legacy reviewMode/showCorrect/showWrong flags. */
  reviewTag?: ChoiceReviewTag;
  reviewMode?: boolean;
  selected: boolean;
  showCorrect?: boolean;
  showWrong?: boolean;
};

const REVIEW_TAGS: Record<ChoiceReviewTag, { color: "success.dark" | "error.dark"; label: string; tone: "success" | "error" }> = {
  correct: { color: "success.dark", label: "Đáp án đúng", tone: "success" },
  picked: { color: "success.dark", label: "Đáp án đúng · Bạn chọn", tone: "success" },
  pickedWrong: { color: "error.dark", label: "Bạn chọn", tone: "error" },
};

function legacyTag({ reviewMode, selected, showCorrect, showWrong }: ChoiceOptionProps): ChoiceReviewTag | undefined {
  if (!reviewMode) return undefined;
  if (showWrong) return "pickedWrong";
  if (showCorrect) return selected ? "picked" : "correct";
  return undefined;
}

export function ChoiceOption(props: ChoiceOptionProps) {
  const { children, disabled = false, image, letter, mode, onClick, selected } = props;
  const reviewTag = props.reviewTag ?? legacyTag(props);
  const tag = reviewTag ? REVIEW_TAGS[reviewTag] : null;
  const tone = tag?.tone ?? "primary";
  const keyFilled = selected || reviewTag === "correct";

  return (
    <ButtonBase
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => { if (!disabled) onClick(); }}
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "transparent",
        borderRadius: `${ergEnterpriseTokens.radius.control}px`,
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: { xs: "30px minmax(0,1fr)", sm: "34px minmax(0,1fr)" },
        justifyContent: "stretch",
        minHeight: "calc(var(--quiz-control-height) + 18px)",
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        textAlign: "left",
        transition: theme.transitions.create(["background-color", "border-color"], { duration: ergEnterpriseTokens.motion.duration.fast }),
        width: "100%",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06), borderColor: "divider" },
        "&:focus-visible": { borderColor: "primary.main", boxShadow: ergEnterpriseTokens.shadow.focus, outline: "none" },
        "&:disabled": { cursor: "default", pointerEvents: "none" },
      })}
    >
      <Box
        component="span"
        sx={(theme) => ({
          alignItems: "center",
          bgcolor: keyFilled ? theme.palette[tone].main : "background.paper",
          border: "1.5px solid",
          borderColor: selected || tag ? theme.palette[tone].main : "divider",
          borderRadius: `${ergEnterpriseTokens.radius.chip}px`,
          color: keyFilled ? theme.palette.getContrastText(theme.palette[tone].main) : "text.primary",
          position: "relative",
          display: "inline-flex",
          typography: "subtitle2",
          height: { xs: 28, sm: 32 },
          justifyContent: "center",
          justifySelf: "center",
          width: { xs: 28, sm: 32 },
        })}
      >
        {letter}
        {mode === "multiple" && selected ? (
          <Box component="span" data-testid="choice-check-badge" sx={(theme) => ({ alignItems: "center", bgcolor: "background.paper", border: "1px solid", borderColor: theme.palette[tone].main, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: theme.palette[tone].main, display: "inline-flex", height: 14, justifyContent: "center", position: "absolute", right: -4, top: -4, width: 14 })}>
            <CheckRoundedIcon sx={{ height: 10, width: 10 }} />
          </Box>
        ) : null}
      </Box>

      <Box component="span" sx={{ color: "text.primary", fontSize: "var(--quiz-readable-size-lg)", fontWeight: 600, lineHeight: 1.38, minWidth: 0 }}>
        {image ? <Box component="img" src={image.url} alt={image.alt ?? ""} sx={{ display: "block", maxHeight: 160, maxWidth: "100%", mb: 1, objectFit: "contain" }} /> : null}
        {children}
        {tag ? <Box component="span" sx={{ color: tag.color, display: "block", mt: 0.5, typography: "subtitle2" }}>{tag.label}</Box> : null}
      </Box>
    </ButtonBase>
  );
}
