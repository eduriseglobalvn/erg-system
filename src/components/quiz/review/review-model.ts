import type { QuestionCell } from "@/components/quiz/question-navigator";
import { isAnswerComplete } from "@/domain/quiz/quiz";
import type { Attempt, Question } from "@/domain/quiz/types";

/** Graded outcome of one question, in question order. */
export type QuestionResult = { correct: boolean; points: number; skipped?: boolean; pending?: boolean };

const numberVi = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** Final submit stores a record for every question; a blank one (incomplete input) counts as skipped. */
export function toQuestionResults(questions: Question[], attempt: Pick<Attempt, "answers">): QuestionResult[] {
  return questions.map((question) => {
    const record = attempt.answers[question.id];
    return {
      correct: Boolean(record?.result?.correct),
      points: record?.result?.awardedPoints ?? 0,
      skipped: !record || !isAnswerComplete(question, record.input),
      pending: Boolean(record?.result?.pendingReview),
    };
  });
}

function cellState(r: QuestionResult): QuestionCell["state"] {
  if (r.pending) return "done";
  if (r.skipped) return "skipped";
  return r.correct ? "correct" : "wrong";
}

/** Review cells keep their result state; the current one is marked with `current` instead. */
export function buildReviewCells(results: QuestionResult[], flagged: ReadonlySet<number>, current: number): QuestionCell[] {
  return results.map((r, index) => ({ index, state: cellState(r), flagged: flagged.has(index), current: index === current }));
}

/** Wrong + skipped, ascending (D12 "Luyện lại n câu"). */
export function retryIndices(results: QuestionResult[]): number[] {
  return results.flatMap((r, index) => (!r.pending && (r.skipped || !r.correct) ? [index] : []));
}

export function reviewScoreLabel(r: QuestionResult): string {
  if (r.pending) return "Chờ giáo viên chấm";
  const status = r.skipped ? "Bỏ trống" : r.correct ? "Đúng" : "Sai";
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
