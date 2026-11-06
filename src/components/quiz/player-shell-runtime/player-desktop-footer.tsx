import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { CSSProperties } from "react";

import type { Question, QuizResultDisplay } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type PlayerDesktopFooterProps = {
  attemptCompleted: boolean;
  currentAnswerComplete: boolean;
  footerMessage: string;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  keyHint: string;
  modeBadgeStyle: CSSProperties;
  questions: Question[];
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  submitted: boolean;
  submitting: boolean;
  handleReviewQuiz: () => void;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

export function PlayerDesktopFooter({
  attemptCompleted, currentAnswerComplete, footerMessage, isFirstQuestion, isLastQuestion,
  isTrainingMode, keyHint, modeBadgeStyle, questions, resultDisplay, reviewingSubmittedAttempt,
  submitted, submitting, handleReviewQuiz, setCurrentIndex, submitCurrentTrainingQuestion,
}: PlayerDesktopFooterProps) {
  const showResultOnly = attemptCompleted && !reviewingSubmittedAttempt;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 1.5, px: { sm: 1 } }}>
      <Box sx={{ alignItems: { sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between" }}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={modeBadgeStyle}>
            {isTrainingMode ? "Học theo từng câu" : "Chế độ kiểm tra"}
          </span>
          <span className="line-clamp-1 text-xs font-medium text-slate-600">{footerMessage}</span>
        </div>

        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, ml: "auto" }}>
          {showResultOnly ? (
            resultDisplay.showReviewButton ? (
              // The result screen owns the one contained "Xem lại bài làm"; this is the secondary copy.
              <Button type="button" variant="outlined" onClick={handleReviewQuiz}>Xem lại bài làm</Button>
            ) : null
          ) : isTrainingMode ? (
            // Practice never advances by itself: "Kết quả" reveals the answer, then "Câu tiếp" moves on.
            submitted ? (
              <Button
                type="button"
                variant="contained"
                disabled={isLastQuestion}
                onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              >
                Câu tiếp
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                disabled={submitting || !currentAnswerComplete}
                onClick={() => void submitCurrentTrainingQuestion()}
              >
                {submitting ? "Đang chấm…" : "Kết quả"}
              </Button>
            )
          ) : (
            <>
              <Button
                type="button"
                variant="outlined"
                disabled={isFirstQuestion || submitting}
                onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              >
                Câu trước
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={isLastQuestion || submitting}
                onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              >
                Câu tiếp
              </Button>
            </>
          )}
        </Box>
      </Box>
      {attemptCompleted || isTrainingMode ? null : (
        <Typography sx={{ color: tk.color.textMuted, textAlign: "right" }} variant="caption">
          {keyHint}
        </Typography>
      )}
    </Box>
  );
}
