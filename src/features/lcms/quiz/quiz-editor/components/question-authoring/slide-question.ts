import type { useI18n } from "@/platform/i18n";
import type { Question } from "@/domain/quiz/types";
import { isHotspotPlaceholder, syncQuizEditorSlideFromRuntimeQuestion } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
import { buildPreviewQuestion } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { assessQuestionReadiness, type QuestionReadiness } from "./question-readiness";

type Translate = ReturnType<typeof useI18n>["t"];

/** The card edits the runtime Question the learner renderer and grader use. */
export function readSlideQuestion(slide: QuizEditorSlide, t: Translate): Question | null {
  return buildPreviewQuestion(slide, t);
}

/** Settings bags, scores and slide.media position are spread through untouched by the sync. */
export function writeSlideQuestion(slide: QuizEditorSlide, question: Question): QuizEditorSlide {
  return syncQuizEditorSlideFromRuntimeQuestion(slide, question);
}

export function readSlideReadiness(slide: QuizEditorSlide, t: Translate): QuestionReadiness {
  const hasQuestionImage = Boolean(slide.media?.src) && !isHotspotPlaceholder(slide.media?.src);
  return assessQuestionReadiness(readSlideQuestion(slide, t), { hasQuestionImage });
}
