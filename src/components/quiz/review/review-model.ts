import type { QuestionCell } from "@/components/quiz/question-navigator";
import { isAnswerComplete } from "@/domain/quiz/quiz";
import type { Attempt, Question } from "@/domain/quiz/types";

/** Graded outcome of one question, in question order. `partial`: earned points without full marks. */
export type QuestionResult = { correct: boolean; points: number; skipped?: boolean; pending?: boolean; partial?: boolean };

const numberVi = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/**
 * Final submit stores a record for every question. Partial = scoreQuestion's partiallyRight or any points
 * (floor() can award 0 on a 0,5-/1-point question); skipped = not partial AND not answered/complete.
 */
export function toQuestionResults(questions: Question[], attempt: Pick<Attempt, "answers">): QuestionResult[] {
  return questions.map((question) => {
    const record = attempt.answers[question.id];
    const correct = Boolean(record?.result?.correct);
    const pending = Boolean(record?.result?.pendingReview);
    const points = record?.result?.awardedPoints ?? 0;
    const graded = !correct && !pending;
    const partial = graded && (points > 0 || Boolean(record?.result?.partiallyRight));
    return {
      correct,
      points,
      pending,
      skipped: graded && !partial && (!record || !isAnswerComplete(question, record.input)),
      partial,
    };
  });
}

function cellState(r: QuestionResult): QuestionCell["state"] {
  if (r.pending) return "done";
  if (r.skipped) return "skipped";
  // Partial credit sits with "Sai" in the grid/filter (not full marks); only its label differs.
  return r.correct ? "correct" : "wrong";
}

/** Review cells keep their result state; the current one is marked with `current` instead. */
export function buildReviewCells(results: QuestionResult[], flagged: ReadonlySet<number>, current: number): QuestionCell[] {
  return results.map((r, index) => ({ index, state: cellState(r), flagged: flagged.has(index), current: index === current }));
}

/** Wrong + skipped + partial, ascending (D12 "Luyện lại n câu"). */
export function retryIndices(results: QuestionResult[]): number[] {
  return results.flatMap((r, index) => (!r.pending && (r.skipped || !r.correct) ? [index] : []));
}

export function reviewScoreLabel(r: QuestionResult): string {
  if (r.pending) return "Chờ giáo viên chấm";
  const status = r.correct ? "Đúng" : r.partial ? "Đúng một phần" : r.skipped ? "Bỏ trống" : "Sai";
  return `${status} · ${numberVi.format(r.points)} điểm`;
}

/** Whole seconds from start to submit; null when either time is missing or out of order. */
export function attemptElapsedSeconds(startedAt?: string, submittedAt?: string): number | null {
  const ms = Date.parse(submittedAt ?? "") - Date.parse(startedAt ?? "");
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null;
}

export function reviewScoreOutOf10({ totalScore, maxScore }: Pick<Attempt, "totalScore" | "maxScore">): string {
  return numberVi.format(maxScore > 0 ? (totalScore / maxScore) * 10 : 0);
}
