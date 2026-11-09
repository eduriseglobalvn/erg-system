import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { KeyHintRow } from "@/components/quiz/player-web-frame";
import type { Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type PlayerDesktopFooterProps = {
  attemptCompleted: boolean;
  currentAnswerComplete: boolean;
  footerMessage: string;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  keyHint: string;
  questions: Question[];
  submitted: boolean;
  submitting: boolean;
  /** Testing mode, last question: the forward button becomes "Nộp bài" (WL4). */
  handleRequestSubmit?: () => void;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

/** WL2 card foot: Câu trước · key hints · Câu tiếp (the screen's one contained button). */
export function PlayerDesktopFooter({
  attemptCompleted, currentAnswerComplete, footerMessage, isFirstQuestion, isLastQuestion,
  isTrainingMode, keyHint, questions,
  submitted, submitting, handleRequestSubmit, setCurrentIndex, submitCurrentTrainingQuestion,
}: PlayerDesktopFooterProps) {
  const next = () => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1));
  const prev = () => setCurrentIndex((value) => Math.max(0, value - 1));
  const middle = isTrainingMode || attemptCompleted
    ? <Typography sx={{ color: tk.color.textMuted, flex: 1, minWidth: 0, textAlign: "center" }} variant="caption">{footerMessage}</Typography>
    : <Box sx={{ flex: 1, minWidth: 0 }}><KeyHintRow hint={keyHint} /></Box>;

  return (
    <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: tk.color.divider, display: "flex", flexWrap: "wrap", gap: 1, mt: "auto", pt: 2 }}>
      {isTrainingMode ? (
        // Practice never advances by itself: "Kết quả" reveals the answer, then "Câu tiếp" moves on.
        <>
          {middle}
          {submitted ? (
            <Button type="button" variant="contained" disabled={isLastQuestion} endIcon={<ChevronRightRounded />} onClick={next}>Câu tiếp</Button>
          ) : (
            <Button type="button" variant="contained" disabled={submitting || !currentAnswerComplete} onClick={() => void submitCurrentTrainingQuestion()}>
              {submitting ? "Đang chấm…" : "Kết quả"}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button type="button" variant="outlined" disabled={isFirstQuestion || submitting} startIcon={<ChevronLeftRounded />} onClick={prev}>Câu trước</Button>
          {middle}
          {isLastQuestion && handleRequestSubmit && !attemptCompleted ? (
            <Button type="button" variant="contained" disabled={submitting} endIcon={<SendRounded />} onClick={handleRequestSubmit}>Nộp bài</Button>
          ) : (
            <Button type="button" variant="contained" disabled={isLastQuestion || submitting} endIcon={<ChevronRightRounded />} onClick={next}>Câu tiếp</Button>
          )}
        </>
      )}
    </Box>
  );
}
