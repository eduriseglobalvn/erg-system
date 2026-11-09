import ReplayRounded from "@mui/icons-material/ReplayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { PlayerWebPage, webCardSx, webColumnSx, webSideSx } from "@/components/quiz/player-web-frame";
import type { GridSurface } from "@/components/quiz/question-grid-layout";
import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import { buildReviewCells, retryIndices, reviewScoreOutOf10, toQuestionResults } from "@/components/quiz/review/review-model";
import { ReviewQuestionView } from "@/components/quiz/review/review-question-view";
import { reviewPaperSx, ReviewScoreStrip, ReviewSummaryHeader } from "@/components/quiz/review/review-summary-header";
import type { Attempt, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type ReviewLayoutProps = {
  attempt: Attempt;
  questions: Question[];
  flagged: ReadonlySet<number>;
  current: number;
  elapsedSeconds: number | null;
  surface: GridSurface;
  /** Web top bar: quiz name and an extra meta part (subject). */
  title?: string;
  meta?: string;
  onSelect: (index: number) => void;
  onBack: () => void;
  startLocalRetry: (indices: number[]) => void;
};

const cardSx = { bgcolor: tk.color.surface, border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, p: { xs: 2, md: 3 } };

/** L08/L09/WL5. Web: question left, list 380px right. Phone: grid first, a tapped cell opens the detail. */
export function ReviewLayout({ attempt, questions, flagged, current, elapsedSeconds, surface, title, meta, onSelect, onBack, startLocalRetry }: ReviewLayoutProps) {
  const [phoneDetail, setPhoneDetail] = useState(false);
  const results = toQuestionResults(questions, attempt);
  const retry = retryIndices(results);
  const index = Math.min(Math.max(current, 0), questions.length - 1);
  const question = questions[index];
  const phone = surface === "phone";
  const correct = results.filter((r) => r.correct && !r.pending).length;

  const select = (next: number) => {
    onSelect(next);
    if (phone) setPhoneDetail(true);
  };

  const detail = (
    <Box data-testid="review-question" sx={phone ? { ...cardSx, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 } : { ...webCardSx, display: "flex", flex: 1, flexDirection: "column", minHeight: 0, p: 3.5 }}>
      <ReviewQuestionView
        question={question} record={attempt.answers[question.id]} result={results[index]} index={index} total={questions.length}
        flagged={flagged.has(index)} keyHint={phone ? undefined : "← → đổi câu"}
        onPrev={() => onSelect(Math.max(0, index - 1))}
        onNext={() => onSelect(Math.min(questions.length - 1, index + 1))}
      />
    </Box>
  );
  const panel = <QuestionListPanel mode="review" cells={buildReviewCells(results, flagged, index)} surface={surface} onSelect={select} />;
  const retryButton = retry.length > 0 ? (
    <ErgButton fullWidth startIcon={phone ? undefined : <ReplayRounded />} sx={{ mt: phone ? 0 : "auto" }} variant="contained" onClick={() => startLocalRetry(retry)}>
      {`Luyện lại ${retry.length} câu`}
    </ErgButton>
  ) : null;

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
            <ReviewSummaryHeader scoreOutOf10={reviewScoreOutOf10(attempt)} correct={correct} total={questions.length} elapsedSeconds={elapsedSeconds} onBack={onBack} />
            <Box data-testid="review-aside" sx={{ ...cardSx, display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
              {panel}
              {retryButton}
            </Box>
          </>
        )}
      </Box>
    );
  }

  const wrong = results.filter((r) => !r.pending && !r.correct && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  return (
    <PlayerWebPage backLabel="Kết quả" onBack={onBack} title={title ?? "Xem lại bài làm"} meta={[`${questions.length} câu`, meta].filter(Boolean).join(" · ")}>
      <Box component="section" sx={webColumnSx}>{detail}</Box>
      <Box component="aside" sx={{ ...webSideSx, flexBasis: 380 }}>
        <Box data-testid="review-aside" sx={{ ...webCardSx, display: "flex", flex: 1, flexDirection: "column", gap: 1.5, minHeight: 0, overflowY: "auto" }}>
          <ReviewScoreStrip scoreOutOf10={reviewScoreOutOf10(attempt)} correct={correct} total={questions.length} elapsedSeconds={elapsedSeconds} />
          <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, justifyContent: "space-between" }}>
            <Typography component="h2" sx={{ color: tk.color.text }} variant="subtitle2">Danh sách câu hỏi</Typography>
            <Typography sx={{ color: tk.color.textMuted, fontVariantNumeric: "tabular-nums" }} variant="caption">{`${wrong} sai · ${skipped} bỏ trống`}</Typography>
          </Box>
          {panel}
          {retryButton}
        </Box>
      </Box>
    </PlayerWebPage>
  );
}
