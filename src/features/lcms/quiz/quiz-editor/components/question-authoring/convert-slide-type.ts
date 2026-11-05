import type {
  QuestionType,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const CHOICE_TYPES: readonly QuestionType[] = ["multiple-choice", "multiple-response", "true-false"];

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
  const carries = CHOICE_TYPES.includes(slide.kind as QuestionType) && CHOICE_TYPES.includes(nextType);
  const next: QuizEditorSlide = { ...fresh, ...kept };
  if (!carries) return { slide: next, dropsAnswers: true };

  let seenCorrect = false;
  next.choices = (slide.choices ?? []).map((choice) => {
    const correct = nextType === "multiple-choice" ? choice.correct && !seenCorrect : choice.correct;
    seenCorrect ||= choice.correct;
    return { ...choice, correct };
  });
  return { slide: next, dropsAnswers: false };
}
