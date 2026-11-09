import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";

import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type Props = {
  attemptCompleted: boolean;
  currentAnswerComplete: boolean;
  currentQuestionSubmitted: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  reviewingSubmittedAttempt: boolean;
  submitFailed: boolean;
  submitting: boolean;
  /** Middle "n/N đã làm" button; without onOpenList the dock keeps only the arrows. */
  answeredCount?: number;
  total?: number;
  onOpenList?: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRequestSubmit: () => void;
  /** Omitted when review is unavailable (no answer keys / author hid it). */
  onReview?: () => void;
  onSubmitCurrentQuestion: () => void;
};

const accentSx = {
  bgcolor: `var(--quiz-accent, ${tk.color.primary})`,
  color: `var(--quiz-accent-contrast, ${tk.color.surface})`,
  "&:hover": { bgcolor: `var(--quiz-accent, ${tk.color.primaryHover})`, filter: "brightness(0.92)" },
} as const;

/** L02/L03 dock: ‹ · n/N đã làm (opens the list) · Câu tiếp, or one Kết quả / Câu tiếp button in practice. */
export function MobilePlayerFooter({
  attemptCompleted,
  currentAnswerComplete,
  currentQuestionSubmitted,
  isFirstQuestion,
  isLastQuestion,
  isTrainingMode,
  reviewingSubmittedAttempt,
  submitFailed,
  submitting,
  answeredCount,
  total,
  onOpenList,
  onNext,
  onPrev,
  onRequestSubmit,
  onReview,
  onSubmitCurrentQuestion,
}: Props) {
  const showResultOnly = attemptCompleted && !reviewingSubmittedAttempt;
  // Result screen without review (keyless package): no button, so no empty fixed bar either.
  if (showResultOnly && !onReview) return null;
  // The last question, a running submit and a failed submit put Nộp bài in the primary slot.
  const submitInPrimary = !attemptCompleted && (isLastQuestion || submitting || submitFailed);
  return (
    <Box
      data-testid="mobile-player-footer"
      sx={{ alignItems: "center", bgcolor: tk.color.surface, borderTop: `1px solid ${tk.color.border}`, bottom: 0, display: "flex", gap: 1, left: 0, pb: "calc(env(safe-area-inset-bottom, 0px) + 12px)", position: "fixed", pt: 1.25, px: 1.5, right: 0, zIndex: 40 }}
    >
      {showResultOnly ? (
        <Button fullWidth size="large" type="button" variant="outlined" onClick={onReview}>Xem lại bài làm</Button>
      ) : isTrainingMode ? (
        <Button
          disabled={currentQuestionSubmitted ? isLastQuestion : submitting || !currentAnswerComplete}
          fullWidth
          size="large"
          startIcon={currentQuestionSubmitted ? undefined : <FactCheckRoundedIcon />}
          endIcon={currentQuestionSubmitted ? <ChevronRightRoundedIcon /> : undefined}
          sx={{ ...accentSx, minHeight: 52 }}
          type="button"
          variant="contained"
          onClick={currentQuestionSubmitted ? onNext : onSubmitCurrentQuestion}
        >
          {currentQuestionSubmitted ? "Câu tiếp" : submitting ? "Đang chấm…" : "Kết quả"}
        </Button>
      ) : (
        <>
          <IconButton
            aria-label="Câu trước"
            disabled={isFirstQuestion || submitting}
            sx={{ border: `1px solid ${tk.color.border}`, color: tk.color.textSecondary, flexShrink: 0, height: 44, width: 44 }}
            onClick={onPrev}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          {onOpenList && total ? (
            <Button
              aria-label={`Mở danh sách câu, ${answeredCount ?? 0}/${total} đã làm`}
              startIcon={<GridViewRoundedIcon />}
              sx={{ borderColor: tk.color.borderStrong, color: tk.color.text, flex: 1, minHeight: 44, minWidth: 0 }}
              type="button"
              variant="outlined"
              onClick={onOpenList}
            >
              {`${answeredCount ?? 0}/${total} đã làm`}
            </Button>
          ) : null}
          {submitInPrimary ? (
            <Button
              disabled={submitting}
              startIcon={<SendRoundedIcon />}
              sx={{ ...accentSx, flex: 1, minHeight: 44 }}
              type="button"
              variant="contained"
              onClick={onRequestSubmit}
            >
              {submitting ? "Đang nộp" : submitFailed ? "Thử lại" : "Nộp bài"}
            </Button>
          ) : (
            <Button
              disabled={isLastQuestion || submitting}
              endIcon={<ChevronRightRoundedIcon />}
              sx={{ ...accentSx, flex: 1, minHeight: 44 }}
              type="button"
              variant="contained"
              onClick={onNext}
            >
              Câu tiếp
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
