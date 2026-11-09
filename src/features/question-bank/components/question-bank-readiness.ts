import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

export type QuestionBankReadiness = "ready" | "missingAnswer" | "missingCorrect";

/** What the bank row can tell: choice questions need a correct choice, the rest need an answer. */
export function questionBankReadiness(question: Pick<QuestionBankQuestion, "answer" | "choices" | "runtimeQuestion">): QuestionBankReadiness {
  // Editor questions passed the publish compile, which rejects a question without its key (matching, hotspot…).
  if (question.runtimeQuestion) return "ready";
  const choices = question.choices ?? [];
  if (choices.length > 0) return choices.some((choice) => choice.correct) ? "ready" : "missingCorrect";
  return question.answer?.trim() ? "ready" : "missingAnswer";
}
