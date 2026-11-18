import type { Question } from "@/domain/quiz/types";
import type { QuestionBankSaveQuestionInput } from "@/features/question-bank/api/question-bank-api";

const CHOICE_KINDS = new Set(["single_choice", "multiple_response", "true_false"]);

/**
 * The bank row for a question authored with the quiz editor's cards: the runtime kind is the bank type id,
 * and the whole question travels in content.runtimeQuestion (the same shape the publish mirror writes).
 */
export function buildAuthoredQuestionInput(
  question: Question,
): Pick<QuestionBankSaveQuestionInput, "answer" | "choices" | "content" | "stem" | "type"> {
  const type = question.kind === "inline_choice" ? "select_from_lists" : question.kind;
  const base = { content: { runtimeQuestion: question }, stem: question.title.trim(), type };
  if (!CHOICE_KINDS.has(question.kind)) return base;
  const choices = (question.choices ?? [])
    .filter((choice) => choice.label.trim())
    .map((choice) => ({ id: choice.id, label: choice.label.trim(), correct: choice.correct }));
  const correct = choices.filter((choice) => choice.correct).map((choice) => choice.label);
  return { ...base, answer: question.kind === "multiple_response" ? correct : correct[0], choices };
}
