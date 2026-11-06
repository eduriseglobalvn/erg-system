import CheckIcon from "@mui/icons-material/Check";
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

const REVIEW_TAGS: Record<ChoiceReviewTag, { color: "success.main" | "error.main" | "primary.main"; label: string }> = {
  correct: { color: "success.main", label: "Đáp án đúng" },
  picked: { color: "primary.main", label: "Bạn chọn" },
  pickedWrong: { color: "error.main", label: "Bạn chọn" },
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
  const keyColor = reviewTag === "correct" ? "success.main" : reviewTag === "pickedWrong" ? "error.main" : "primary.main";
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
          bgcolor: keyFilled ? keyColor : "background.paper",
          border: "1.5px solid",
          borderColor: selected || tag ? keyColor : "divider",
          borderRadius: `${ergEnterpriseTokens.radius.chip}px`,
          color: keyFilled ? theme.palette.getContrastText(reviewTag === "correct" ? theme.palette.success.main : reviewTag === "pickedWrong" ? theme.palette.error.main : theme.palette.primary.main) : "text.primary",
          display: "inline-flex",
          typography: "subtitle2",
          height: { xs: 28, sm: 32 },
          justifyContent: "center",
          justifySelf: "center",
          width: { xs: 28, sm: 32 },
        })}
      >
        {mode === "multiple" && selected && !letter ? <CheckIcon sx={{ fontSize: ergEnterpriseTokens.size.iconSm }} /> : letter}
      </Box>

      <Box component="span" sx={{ color: "text.primary", fontSize: "var(--quiz-readable-size-lg)", fontWeight: 600, lineHeight: 1.38, minWidth: 0 }}>
        {image ? <Box component="img" src={image.url} alt={image.alt ?? ""} sx={{ display: "block", maxHeight: 160, maxWidth: "100%", mb: 1, objectFit: "contain" }} /> : null}
        {children}
        {tag ? <Box component="span" sx={{ color: tag.color, display: "block", mt: 0.5, typography: "subtitle2" }}>{tag.label}</Box> : null}
      </Box>
    </ButtonBase>
  );
}
