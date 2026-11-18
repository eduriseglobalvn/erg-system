import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

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

/** Dock: Trước · n/N đã làm (opens the list) · Sau (Kết quả before a practice answer is checked; Nộp bài on the last question). */
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
      ) : (
        <>
          <Button
            disabled={isFirstQuestion || submitting}
            startIcon={<ChevronLeftRoundedIcon />}
            sx={{ borderColor: tk.color.borderStrong, color: tk.color.text, flexShrink: 0, minHeight: 44, minWidth: 0, px: 1.5 }}
            type="button"
            variant="outlined"
            onClick={onPrev}
          >
            Trước
          </Button>
          {onOpenList && total ? (
            <Button
              aria-label={`Mở danh sách câu, ${answeredCount ?? 0}/${total} đã làm`}
              startIcon={<GridViewRoundedIcon />}
              sx={{ borderColor: tk.color.borderStrong, color: tk.color.text, flex: 1, minHeight: 44, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}
              type="button"
              variant="outlined"
              onClick={onOpenList}
            >
              {`${answeredCount ?? 0}/${total} đã làm`}
            </Button>
          ) : null}
          {isTrainingMode && !currentQuestionSubmitted ? (
            // Practice never advances by itself: "Kết quả" reveals the answer first.
            <Button
              disabled={submitting || !currentAnswerComplete}
              sx={{ ...accentSx, flex: 1, minHeight: 44 }}
              type="button"
              variant="contained"
              onClick={onSubmitCurrentQuestion}
            >
              {submitting ? "Đang chấm…" : "Kết quả"}
            </Button>
          ) : isTrainingMode && !(isLastQuestion && !attemptCompleted) ? (
            <Button
              disabled={isLastQuestion}
              endIcon={<ChevronRightRoundedIcon />}
              sx={{ ...accentSx, flex: 1, minHeight: 44 }}
              type="button"
              variant="contained"
              onClick={onNext}
            >
              Sau
            </Button>
          ) : submitInPrimary ? (
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
              Sau
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
