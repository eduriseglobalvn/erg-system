import { useMemo } from "react";

import type { QuizEditorGroup } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionManagerSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** The question slides of the draft, in order: the rows of the question table and the readiness checks. */
export function useQuizEditorSlideViews({ groups }: { groups: QuizEditorGroup[] }) {
  const questionManagerSlides = useMemo(
    () => groups.flatMap((group) => group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind))),
    [groups],
  );

  return { questionManagerSlides };
}
