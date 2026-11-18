import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { Exercise } from "../exercise-bank-model";

/**
 * The bank questions an exercise was built from, in order. A quiz written in the editor keeps its questions
 * in itself and lists none here; it must not be shown with look-alike bank questions (BUG-G-015).
 */
export function selectExerciseQuestions(
  selected: Exercise | undefined | null,
  allQuestions: QuestionBankQuestion[],
): QuestionBankQuestion[] {
  if (!selected?.questionIds?.length) return [];
  const byId = new Map(allQuestions.map((question) => [question.id, question]));
  return selected.questionIds.flatMap((id) => byId.get(id) ?? []);
}
