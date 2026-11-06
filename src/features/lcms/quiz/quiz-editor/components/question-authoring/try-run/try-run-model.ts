import { getMatchingKey, getSequenceCorrectOrder, isAnswerComplete, scoreQuestion } from "@/domain/quiz/quiz";
import type { AnswerPayload, Question } from "@/domain/quiz/types";

export type TryRunMode = "practice" | "test";
type Answers = Record<string, AnswerPayload>;

export const defaultTryRunMode = (quizKind: string | undefined): TryRunMode => (quizKind === "test" || quizKind === "testing" ? "test" : "practice");

export const isAutoGraded = (question: Question) => question.kind !== "likert_scale" && question.kind !== "essay";

export function describeCorrectAnswer(question: Question): string {
  switch (question.kind) {
    case "single_choice":
    case "true_false":
    case "multiple_response":
      return (question.choices ?? []).filter((c) => c.correct).map((c) => c.label).join(", ");
    case "short_answer":
    case "fill_blank":
      return (question.textBlanks ?? []).map((b) => b.correctAnswers.filter((a) => a.trim()).join(" / ")).join("; ");
    case "numeric": {
      const n = question.numericAnswer;
      if (!n) return "";
      return `${n.correctValue}${n.tolerance && n.tolerance > 0 ? ` ± ${n.tolerance}` : ""}${n.unit ? ` ${n.unit}` : ""}`;
    }
    case "sequence": {
      const byId = new Map((question.sequenceItems ?? []).map((i) => [i.id, i.label]));
      return getSequenceCorrectOrder(question).map((id) => byId.get(id) ?? "").join(" → ");
    }
    case "matching": {
      const key = getMatchingKey(question);
      const responses = new Map((question.matchingResponses ?? []).map((r) => [r.id, r.response]));
      return (question.matching ?? [])
        .map((p) => `${p.prompt} – ${key ? (responses.get(key[p.id] ?? "") ?? p.response ?? "") : (p.response ?? "")}`)
        .join("; ");
    }
    case "inline_choice":
    case "select_from_lists":
      return (question.inlineBlanks ?? []).map((b) => b.correctOptionId).join("; ");
    case "drag_words": {
      const words = new Map((question.wordBank ?? []).map((w) => [w.id, w.label]));
      return (question.wordSlots ?? []).map((s) => words.get(s.correctWordId) ?? "").join("; ");
    }
    case "drag_drop": {
      const targets = new Map((question.dropTargets ?? []).map((t) => [t.id, t.label]));
      return (question.dragDropItems ?? []).map((i) => `${i.label} → ${targets.get(i.correctTargetId) ?? ""}`).join("; ");
    }
    default:
      return "";
  }
}

export const unansweredNumbers = (questions: Question[], answers: Answers): number[] =>
  questions.flatMap((q, i) => (isAnswerComplete(q, answers[q.id]) ? [] : [i + 1]));

export function submitPrompt(questions: Question[], answers: Answers): string {
  const missing = unansweredNumbers(questions, answers);
  return missing.length
    ? `Còn ${missing.length} câu chưa làm (câu ${missing.join(", ")}). Vẫn nộp bài?`
    : "Sau khi nộp sẽ không sửa được đáp án.";
}

export type TryRunSummaryRow = { number: number; title: string; graded: boolean; correct: boolean; correctAnswer: string };
export type TryRunSummary = { correct: number; total: number; percent: number; rows: TryRunSummaryRow[] };

export function summarizeTryRun(questions: Question[], answers: Answers): TryRunSummary {
  const rows = questions.map((q, i): TryRunSummaryRow => {
    const graded = isAutoGraded(q);
    return {
      number: i + 1,
      title: q.title,
      graded,
      correct: graded && scoreQuestion(q, answers[q.id] ?? {}).correct,
      correctAnswer: describeCorrectAnswer(q),
    };
  });
  const total = rows.filter((r) => r.graded).length;
  const correct = rows.filter((r) => r.correct).length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, rows };
}
