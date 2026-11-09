import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
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
  /** Number key that picks this option in the player; shown as a key hint on wide screens. */
  shortcutKey?: string;
  showCorrect?: boolean;
  showWrong?: boolean;
};

const REVIEW_TAGS: Record<ChoiceReviewTag, { color: "success.dark" | "error.dark"; label: string; tone: "success" | "error" }> = {
  correct: { color: "success.dark", label: "Đáp án đúng", tone: "success" },
  picked: { color: "success.dark", label: "Đáp án đúng · Bạn chọn", tone: "success" },
  pickedWrong: { color: "error.dark", label: "Bạn chọn", tone: "error" },
};

/** Review label for a checked choice: right answer unpicked, right pick, or wrong pick; none while still answering. */
export function choiceReviewTag(reviewMode: boolean, selected: boolean, correct: boolean): ChoiceReviewTag | undefined {
  if (!reviewMode) return undefined;
  if (correct) return selected ? "picked" : "correct";
  return selected ? "pickedWrong" : undefined;
}

function legacyTag({ reviewMode, selected, showCorrect, showWrong }: ChoiceOptionProps): ChoiceReviewTag | undefined {
  if (!reviewMode) return undefined;
  if (showWrong) return "pickedWrong";
  if (showCorrect) return selected ? "picked" : "correct";
  return undefined;
}

/** Keyboard key cap, e.g. the number that picks an option. */
export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <Box
      component="kbd"
      aria-hidden
      sx={{
        typography: "caption",
        alignItems: "center",
        bgcolor: "background.paper",
        border: `1px solid ${ergEnterpriseTokens.color.borderStrong}`,
        borderBottomWidth: 2,
        borderRadius: `${ergEnterpriseTokens.radius.xs}px`,
        color: "text.secondary",
        display: "inline-flex",
        flex: "none",
        fontFamily: "inherit",
        fontVariantNumeric: "tabular-nums",
        fontWeight: "fontWeightBold",
        height: 22,
        justifyContent: "center",
        minWidth: 22,
        px: 0.75,
        }}
    >
      {children}
    </Box>
  );
}

export function ChoiceOption(props: ChoiceOptionProps) {
  const { children, disabled = false, image, letter, mode, onClick, selected, shortcutKey } = props;
  const reviewTag = props.reviewTag ?? legacyTag(props);
  const tag = reviewTag ? REVIEW_TAGS[reviewTag] : null;
  const tone = tag?.tone ?? "primary";
  const keyFilled = selected || reviewTag === "correct";
  // The teacher's template colours the plain (not review) selection; the vars are unset otherwise and the fallbacks apply.
  const themed = tone === "primary";
  const showCheck = mode === "multiple" && selected;

  return (
    <ButtonBase
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => { if (!disabled) onClick(); }}
      sx={(theme) => ({
        alignItems: "center",
        // A review option takes the status tint: the teacher highlight may be dark, and the tag/label text is dark.
        bgcolor: tag ? ergEnterpriseTokens.statusTint[tag.tone].bg : !selected ? "background.paper" : `var(--quiz-highlight, ${ergEnterpriseTokens.color.primarySofter})`,
        border: "1.5px solid",
        borderColor: tag ? theme.palette[tone].main : selected ? `var(--quiz-accent, ${theme.palette.primary.main})` : ergEnterpriseTokens.color.border,
        borderRadius: `var(--quiz-radius, ${ergEnterpriseTokens.radius.card}px)`,
        display: "flex",
        gap: 1.5,
        justifyContent: "flex-start",
        minHeight: 56,
        px: 1.75,
        py: 1.5,
        textAlign: "left",
        transition: theme.transitions.create(["background-color", "border-color"], { duration: ergEnterpriseTokens.motion.duration.fast }),
        width: "100%",
        // A selected option keeps its (possibly dark) highlight on hover; the label colour is chosen for that fill.
        ...(selected || tag ? {} : { "&:hover": { bgcolor: ergEnterpriseTokens.color.surfaceMuted, borderColor: ergEnterpriseTokens.color.borderStrong } }),
        "&:focus-visible": { borderColor: "primary.main", boxShadow: ergEnterpriseTokens.shadow.focus, outline: "none" },
        "&.Mui-focusVisible": { borderColor: "primary.main", boxShadow: ergEnterpriseTokens.shadow.focus },
        "&:disabled": { cursor: "default", pointerEvents: "none" },
      })}
    >
      <Box
        component="span"
        sx={(theme) => ({
          typography: "caption",
          alignItems: "center",
          bgcolor: keyFilled ? (themed ? `var(--quiz-accent, ${theme.palette.primary.main})` : theme.palette[tone].main) : "background.paper",
          border: "1.5px solid",
          borderColor: keyFilled ? (themed ? `var(--quiz-accent, ${theme.palette.primary.main})` : theme.palette[tone].main) : ergEnterpriseTokens.color.borderStrong,
          borderRadius: `${mode === "multiple" ? ergEnterpriseTokens.radius.xs : ergEnterpriseTokens.radius.chip}px`,
          color: keyFilled ? (themed ? `var(--quiz-accent-contrast, ${theme.palette.getContrastText(theme.palette.primary.main)})` : theme.palette.getContrastText(theme.palette[tone].main)) : "text.secondary",
          display: "inline-flex",
          flex: "none",
          fontVariantNumeric: "tabular-nums",
          fontWeight: "fontWeightBold",
          height: 30,
          justifyContent: "center",
          width: 30,
        })}
      >
        {showCheck ? <CheckRoundedIcon data-testid="choice-check-badge" aria-hidden sx={{ fontSize: ergEnterpriseTokens.size.iconMd }} /> : letter}
      </Box>

      <Box component="span" sx={{ typography: "h6", color: selected && themed ? "var(--quiz-highlight-contrast, inherit)" : "text.primary", flex: 1, fontWeight: "fontWeightMedium", lineHeight: 1.45, minWidth: 0, overflowWrap: "anywhere" }}>
        {image ? <Box component="img" src={image.url} alt={image.alt ?? ""} sx={{ borderRadius: `${ergEnterpriseTokens.radius.xs}px`, display: "block", maxHeight: 160, maxWidth: "100%", mb: 1, objectFit: "contain" }} /> : null}
        {children}
      </Box>
      {tag ? <Box component="span" sx={{ typography: "caption", color: tag.color, flex: "none", fontWeight: "fontWeightBold", ml: "auto" }}>{tag.label}</Box> : null}
      {shortcutKey && !tag && !disabled ? <Box component="span" sx={{ display: { xs: "none", md: "inline-flex" }, flex: "none" }}><KeyHint>{shortcutKey}</KeyHint></Box> : null}
    </ButtonBase>
  );
}
