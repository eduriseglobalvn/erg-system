import type { Choice, QuestionKind } from "@/domain/quiz/types";
import type {
  QuestionType,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const RUNTIME_KIND: Partial<Record<QuestionType, QuestionKind>> = {
  "multiple-choice": "single_choice",
  "multiple-response": "multiple_response",
  "true-false": "true_false",
};
const FIRST_CORRECT_ONLY: readonly QuestionType[] = ["multiple-choice", "true-false"];

// Identity, settings and scoring stay with the slide; kind and answer content come from `fresh`.
const KEPT_KEYS = [
  "id", "title", "description", "media", "feedbackRows", "options", "settings", "questionSettings",
  "settingsOverride", "overrideSettings", "status", "questionId", "bankQuestionId",
] as const;

export function convertSlideType(
  slide: QuizEditorSlide,
  nextType: QuestionType,
  fresh: QuizEditorSlide,
): { slide: QuizEditorSlide; dropsAnswers: boolean } {
  const kept = Object.fromEntries(KEPT_KEYS.filter((key) => key in slide).map((key) => [key, slide[key]]));
  const next: QuizEditorSlide = { ...fresh, ...kept };
  const source = slide.choices ?? [];
  const nextKind = RUNTIME_KIND[nextType];
  const carries =
    !!nextKind && !!RUNTIME_KIND[slide.kind as QuestionType] && (nextType !== "true-false" || source.length === 2);
  // runtimeQuestion is dropped here; points then come from feedbackRows, which stay untouched.
  if (!carries) return { slide: next, dropsAnswers: true };

  const firstOnly = FIRST_CORRECT_ONLY.includes(nextType);
  let seenCorrect = false;
  const choices = source.map((choice) => {
    const correct = firstOnly ? choice.correct && !seenCorrect : choice.correct;
    seenCorrect ||= choice.correct;
    return { ...choice, correct };
  });
  next.choices = choices;
  if (slide.runtimeQuestion) {
    const runtimeChoices: Choice[] = choices.map((c) => ({
      id: c.id,
      label: c.label,
      correct: c.correct,
      ...(c.media?.src ? { image: { url: c.media.src, alt: c.media.alt } } : {}),
    }));
    next.runtimeQuestion = { ...slide.runtimeQuestion, kind: nextKind, choices: runtimeChoices };
  }
  return { slide: next, dropsAnswers: firstOnly && source.filter((c) => c.correct).length > 1 };
}
