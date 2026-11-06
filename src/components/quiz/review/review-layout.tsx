import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import type { GridSurface } from "@/components/quiz/question-grid-layout";
import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import { buildReviewCells, retryIndices, reviewScoreOutOf10, toQuestionResults } from "@/components/quiz/review/review-model";
import { ReviewQuestionView } from "@/components/quiz/review/review-question-view";
import { reviewPaperSx, ReviewSummaryHeader } from "@/components/quiz/review/review-summary-header";
import type { Attempt, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type ReviewLayoutProps = {
  attempt: Attempt;
  questions: Question[];
  flagged: ReadonlySet<number>;
  current: number;
  elapsedSeconds: number | null;
  surface: GridSurface;
  onSelect: (index: number) => void;
  onBack: () => void;
  startLocalRetry: (indices: number[]) => void;
};

const cardSx = { bgcolor: tk.color.surface, border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, p: { xs: 2, md: 3 } };

/** L08/L09/WL5. Web: question left, list 340px right. Phone: grid first, a tapped cell opens the detail. */
export function ReviewLayout({ attempt, questions, flagged, current, elapsedSeconds, surface, onSelect, onBack, startLocalRetry }: ReviewLayoutProps) {
  const [phoneDetail, setPhoneDetail] = useState(false);
  const results = toQuestionResults(questions, attempt);
  const retry = retryIndices(results);
  const index = Math.min(Math.max(current, 0), questions.length - 1);
  const question = questions[index];
  const phone = surface === "phone";

  const select = (next: number) => {
    onSelect(next);
    if (phone) setPhoneDetail(true);
  };

  const header = (
    <ReviewSummaryHeader
      scoreOutOf10={reviewScoreOutOf10(attempt)}
      correct={results.filter((r) => r.correct && !r.pending).length}
      total={questions.length}
      elapsedSeconds={elapsedSeconds}
      onBack={onBack}
    />
  );
  const detail = (
    <Box data-testid="review-question" sx={{ ...cardSx, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
      <ReviewQuestionView
        question={question} record={attempt.answers[question.id]} result={results[index]} index={index} total={questions.length}
        onPrev={() => onSelect(Math.max(0, index - 1))}
        onNext={() => onSelect(Math.min(questions.length - 1, index + 1))}
      />
    </Box>
  );
  const list = (
    <Box data-testid="review-aside" sx={{ ...cardSx, display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <QuestionListPanel mode="review" cells={buildReviewCells(results, flagged, index)} surface={surface} onSelect={select} />
      {retry.length > 0 ? (
        <ErgButton fullWidth variant="contained" onClick={() => startLocalRetry(retry)}>{`Luyện lại ${retry.length} câu`}</ErgButton>
      ) : null}
    </Box>
  );

  if (phone) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
        {phoneDetail ? (
          <>
            <Button variant="text" sx={{ ...reviewPaperSx, alignSelf: "flex-start" }} onClick={() => setPhoneDetail(false)}>Danh sách câu</Button>
            {detail}
          </>
        ) : (
          <>
            {header}
            {list}
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mx: "auto", maxWidth: 1200, p: 3, width: "100%" }}>
      {header}
      <Box sx={{ alignItems: "stretch", display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
        {detail}
        {list}
      </Box>
    </Box>
  );
}
