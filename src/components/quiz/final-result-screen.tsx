import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { toQuestionResults } from "@/components/quiz/review/review-model";
import type { Attempt, Question, QuizResultDisplay } from "@/domain/quiz/types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { success, error, warning, neutral } = ergEnterpriseTokens.statusTint;

export type FinalResultScreenProps = {
  attempt: Attempt;
  questions: Question[];
  resultDisplay: QuizResultDisplay;
  /** "Xem lại bài làm": the runtime opens ReviewLayout. */
  onReview: () => void;
  /** Jump into review mode at a given question index. */
  onReviewQuestion: (index: number) => void;
  /** Practice mode only: omit to hide "Làm lại". */
  onRetry?: () => void;
  onBackToList: () => void;
  /** Extra buttons next to the standard ones (e.g. portable "Tải kết quả"). */
  extraActions?: ReactNode;
};

export function FinalResultScreen({ attempt, questions, resultDisplay, onReview, onReviewQuestion, onRetry, onBackToList, extraActions }: FinalResultScreenProps) {
  // Same classification as the review screen, so counts match "Sai · n" / "Bỏ trống · n" there.
  const results = toQuestionResults(questions, attempt);
  const rows = questions.map((question, index) => {
    const r = results[index];
    const state: "correct" | "partial" | "wrong" | "pending" | "blank" =
      r.pending ? "pending" : r.correct ? "correct" : r.partial ? "partial" : r.skipped ? "blank" : "wrong";
    return { question, index, state };
  });
  const correctCount = rows.filter((row) => row.state === "correct").length;
  // Partial credit counts with Sai, like the review filter.
  const wrongCount = rows.filter((row) => row.state === "wrong" || row.state === "partial").length;
  const pendingCount = rows.filter((row) => row.state === "pending").length;
  const resultMessage = attempt.passed ? resultDisplay.passMessage : resultDisplay.failMessage;

  return (
    <Box sx={{ display: "grid", gap: 3, mx: "auto", maxWidth: 720, px: 2, py: 3, width: "100%" }}>
      <Box sx={{ display: "grid", gap: 1, justifyItems: "center", textAlign: "center" }}>
        <Typography component="h2" variant="h5">{resultMessage}</Typography>
        <Typography data-testid="result-score" variant="h4" color="primary">
          {attempt.totalScore}/{attempt.maxScore}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {attempt.percent}% · Đúng {correctCount} · Sai {wrongCount}
          {pendingCount ? ` · Chờ chấm ${pendingCount}` : ""} · Chưa làm {rows.length - correctCount - wrongCount - pendingCount}
        </Typography>
      </Box>

      <Box component="ol" aria-label="Kết quả từng câu" sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", listStyle: "none", m: 0, p: 0 }}>
        {rows.map(({ question, index, state }) => {
          const tint = state === "correct" ? success : state === "wrong" ? error : state === "partial" ? warning : neutral;
          const label = state === "correct" ? "đúng" : state === "partial" ? "đúng một phần" : state === "wrong" ? "sai" : state === "pending" ? "chờ giáo viên chấm" : "chưa làm";
          return (
            <li key={question.id}>
              <ButtonBase
                aria-label={`Câu ${index + 1}: ${label}. Xem lại`}
                data-state={state}
                onClick={() => onReviewQuestion(index)}
                sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: 1, color: tint.color, display: "flex", gap: 0.5, justifyContent: "center", minHeight: 44, width: "100%" }}
              >
                {state === "correct" ? <CheckIcon fontSize="small" /> : state === "wrong" ? <CloseIcon fontSize="small" /> : null}
                <Typography component="span" variant="body2">Câu {index + 1}</Typography>
              </ButtonBase>
            </li>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {resultDisplay.showReviewButton ? (
          // Fixed label (P3 L08): opens ReviewLayout; the old author label ("XEM LẠI BÀI") is no longer shown.
          <Button variant="contained" onClick={onReview}>Xem lại bài làm</Button>
        ) : null}
        {onRetry ? <Button variant="outlined" onClick={onRetry}>Làm lại</Button> : null}
        {extraActions}
        <Button variant="outlined" onClick={onBackToList}>Về danh sách</Button>
      </Box>
      <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">{resultDisplay.thankYouMessage}</Typography>
    </Box>
  );
}
