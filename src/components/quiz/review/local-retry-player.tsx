import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { PracticeFeedbackPanel } from "@/components/quiz/practice-feedback-panel";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { reviewPaperSx } from "@/components/quiz/review/review-summary-header";
import { createInitialAnswer, isAnswerComplete, normalizeAnswerForSubmission, scoreQuestion } from "@/domain/quiz/quiz";
import type { AnswerPayload, AnswerResult, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type LocalRetryPlayerProps = {
  /** All questions of the quiz; `indices` picks the subset, in this order. */
  questions: Question[];
  indices: number[];
  onExit: () => void;
};

/**
 * D12 "Luyện lại n câu": practice on this device only. All state lives here, so nothing reaches
 * the attempt store, the offline queue, the draft PUT or submit; leaving drops it.
 */
export function LocalRetryPlayer({ questions, indices, onExit }: LocalRetryPlayerProps) {
  const [position, setPosition] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, AnswerPayload>>({});
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const items = indices.flatMap((index) => (questions[index] ? [{ index, question: questions[index] }] : []));
  const item = items[Math.min(position, items.length - 1)];
  if (!item) return null;

  const { index, question } = item;
  const value = drafts[question.id] ?? createInitialAnswer(question);
  const result = results[question.id];
  const done = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.correct).length;

  const check = () => {
    if (result || !isAnswerComplete(question, value)) return;
    setResults((prev) => ({ ...prev, [question.id]: scoreQuestion(question, normalizeAnswerForSubmission(question, value)) }));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mx: "auto", maxWidth: 880, p: { xs: 2, md: 3 }, width: "100%" }}>
      <Box component="header" sx={{ ...reviewPaperSx, alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h6">Luyện lại</Typography>
          <Typography color="text.secondary" variant="body2">Không tính điểm, không gửi lên hệ thống.</Typography>
        </Box>
        <Button variant="text" onClick={onExit}>Về xem lại</Button>
      </Box>

      <Box sx={{ bgcolor: tk.color.surface, border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, display: "flex", flexDirection: "column", gap: 2, p: { xs: 2, md: 3 } }}>
        <Typography color="text.secondary" variant="body2">{`Câu ${position + 1}/${items.length} · câu ${index + 1} trong bài`}</Typography>
        <Typography component="h2" variant="h6">{question.title}</Typography>
        <QuestionRenderer
          key={question.id}
          question={question}
          value={value}
          onChange={(next) => setDrafts((prev) => ({ ...prev, [question.id]: next }))}
          submitted={Boolean(result)}
          reviewMode={Boolean(result)}
          result={result ?? null}
        />
        {result ? <PracticeFeedbackPanel key={`${question.id}-feedback`} result={result} /> : null}
        {done === items.length ? (
          <Typography role="status" variant="body2">{`Xong ${done}/${items.length} câu · đúng ${correct}`}</Typography>
        ) : null}

        <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: tk.color.divider, display: "flex", gap: 1, justifyContent: "space-between", pt: 2 }}>
          <Button variant="outlined" disabled={position === 0} onClick={() => setPosition((p) => p - 1)}>Câu trước</Button>
          <ErgButton variant="contained" disabled={Boolean(result) || !isAnswerComplete(question, value)} onClick={check}>Kết quả</ErgButton>
          <Button variant="outlined" disabled={position >= items.length - 1} onClick={() => setPosition((p) => p + 1)}>Câu tiếp</Button>
        </Box>
      </Box>
    </Box>
  );
}
