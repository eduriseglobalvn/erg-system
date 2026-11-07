import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { splitFeedbackSteps } from "@/components/quiz/practice-feedback-panel";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { reviewScoreLabel, type QuestionResult } from "@/components/quiz/review/review-model";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { AnswerRecord, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type ReviewQuestionViewProps = {
  question: Question;
  record?: AnswerRecord;
  result: QuestionResult;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

const noop = () => undefined;

function tone(r: QuestionResult) {
  if (r.pending) return "info" as const;
  if (r.partial) return "warning" as const;
  if (r.skipped) return "neutral" as const;
  return r.correct ? ("success" as const) : ("error" as const);
}

export function ReviewQuestionView({ question, record, result, index, total, onPrev, onNext }: ReviewQuestionViewProps) {
  // A pending essay carries a grading note, not a solution.
  const solution = result.pending ? "" : record?.result?.message || question.feedback[result.correct ? "correct" : result.partial ? "partial" : "incorrect"] || "";
  const steps = splitFeedbackSteps(solution);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
        <Typography color="text.secondary" variant="body2">{`Câu ${index + 1}/${total}`}</Typography>
        <ErgStatusChip label={reviewScoreLabel(result)} tone={tone(result)} />
      </Box>
      <Typography component="h2" variant="h6">{question.title}</Typography>

      <QuestionRenderer
        key={question.id}
        question={question}
        value={record?.input ?? createInitialAnswer(question)}
        onChange={noop}
        submitted
        reviewMode
        result={record?.result ?? null}
      />

      {steps.length > 0 ? (
        <Box component="section" aria-labelledby="review-solution-title" sx={{ bgcolor: tk.color.surfaceMuted, border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, display: "grid", gap: 1, p: 2 }}>
          <Typography id="review-solution-title" component="h3" variant="subtitle1">Lời giải</Typography>
          {steps.length > 1 ? (
            <Box component="ol" sx={{ m: 0, pl: 2.5, typography: "body2" }}>
              {steps.map((step, i) => <li key={i}>{step}</li>)}
            </Box>
          ) : (
            <Typography variant="body2">{steps[0]}</Typography>
          )}
        </Box>
      ) : null}

      <Box sx={{ borderTop: "1px solid", borderColor: tk.color.divider, display: "flex", gap: 1, justifyContent: "space-between", mt: "auto", pt: 2 }}>
        <Button variant="outlined" disabled={index === 0} onClick={onPrev}>Câu trước</Button>
        <Button variant="outlined" disabled={index >= total - 1} onClick={onNext}>Câu sau</Button>
      </Box>
    </Box>
  );
}
