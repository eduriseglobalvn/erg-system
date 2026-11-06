import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { createPreviewAnswer } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import { buildPreviewQuestion } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankSaveQuestionInput } from "@/features/question-bank/api/question-bank-api";
import { createQuizSlideFromBankQuestion } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { useI18n } from "@/platform/i18n";

const PREVIEW_DEFAULTS = { answerFont: "", correctFeedback: "", incorrectFeedback: "", negativePoints: 0, positivePoints: 1, questionFont: "", shuffleAnswers: false };

/**
 * Bank questions only carry choices, so only choice-based types render faithfully; the other types would show the
 * editor's placeholder blanks/pairs. shortcut: those fall back to text + choices; widen when the bank sends full content.
 */
const CHOICE_TYPES = new Set<QuestionType>(["multiple-choice", "multiple-response", "true-false", "sequence"]);

/** Learner card of a bank question with the correct answer filled in, or null when it cannot render faithfully. */
export function buildQuestionQuickViewPreview(
  question: QuestionBankQuestion,
  t: ReturnType<typeof useI18n>["t"],
): { answer: AnswerPayload; question: Question } | null {
  if (!CHOICE_TYPES.has(question.type)) return null;
  let nextId = 0;
  const slide = createQuizSlideFromBankQuestion(question, (prefix) => `${prefix}-${question.id}-${nextId++}`, PREVIEW_DEFAULTS);
  if (!slide.choices?.length) return null;
  const preview = buildPreviewQuestion(slide, t);
  return preview ? { answer: createPreviewAnswer(preview, "correct"), question: preview } : null;
}

/** Same content as a new question; the API has no duplicate endpoint, so the copy is a plain create. */
export function buildDuplicateQuestionInput(question: QuestionBankQuestion): QuestionBankSaveQuestionInput {
  return {
    answer: question.answer,
    categoryId: question.categoryId,
    choices: question.choices,
    difficulty: question.difficulty,
    levelId: question.levelId,
    objective: question.objective,
    scopeId: question.scope.type === "center" ? question.scope.centerId : undefined,
    scopeType: question.scope.type,
    settings: question.settings,
    status: question.status,
    stem: question.stem,
    subjectId: question.subjectId,
    tags: question.tags,
    topicId: question.categoryId,
    type: question.type,
  };
}
