import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { splitFeedbackSteps } from "@/components/quiz/practice-feedback-panel";
import { KeyHintRow, MetaTag, quizAccent } from "@/components/quiz/player-web-frame";
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
  flagged?: boolean;
  /** Web only: arrow keys move between questions there. */
  keyHint?: string;
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

/** WL5 / L09 question card body: meta tags, prompt, the graded answer, Lời giải, prev/next. */
export function ReviewQuestionView({ question, record, result, index, total, flagged = false, keyHint, onPrev, onNext }: ReviewQuestionViewProps) {
  // A pending essay carries a grading note, not a solution.
  const solution = result.pending ? "" : record?.result?.message || question.feedback[result.correct ? "correct" : result.partial ? "partial" : "incorrect"] || "";
  const steps = splitFeedbackSteps(solution);

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Typography component="span" sx={{ color: tk.color.text, fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold" }} variant="body2">{`Câu ${index + 1}/${total}`}</Typography>
        <MetaTag tone={tone(result)}>{reviewScoreLabel(result)}</MetaTag>
        {flagged ? <MetaTag tone="neutral"><FlagRounded aria-hidden sx={{ fontSize: tk.size.iconSm }} />Đã đánh dấu</MetaTag> : null}
      </Box>
      <Typography component="h2" sx={{ color: tk.color.text }} variant="h2">{question.title}</Typography>

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
          <Typography id="review-solution-title" component="h3" sx={{ alignItems: "center", display: "flex", gap: 1 }} variant="subtitle1">
            <MenuBookRounded aria-hidden sx={{ color: quizAccent, fontSize: tk.size.iconMd }} />
            Lời giải
          </Typography>
          {steps.length > 1 ? (
            <Box component="ol" sx={{ color: tk.color.text, lineHeight: 1.9, m: 0, pl: 2.5, typography: "body2" }}>
              {steps.map((step, i) => <li key={i}>{step}</li>)}
            </Box>
          ) : (
            <Typography sx={{ color: tk.color.text }} variant="body2">{steps[0]}</Typography>
          )}
        </Box>
      ) : null}

      <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: tk.color.divider, display: "flex", gap: 1, justifyContent: "space-between", mt: "auto", pt: 2 }}>
        <Button variant="outlined" disabled={index === 0} startIcon={<ChevronLeftRounded />} onClick={onPrev}>Câu trước</Button>
        {keyHint ? <KeyHintRow hint={keyHint} /> : null}
        <Button variant="outlined" disabled={index >= total - 1} endIcon={<ChevronRightRounded />} onClick={onNext}>Câu sau</Button>
      </Box>
    </Box>
  );
}
