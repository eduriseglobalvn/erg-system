import { createEmptyQuizEditorGroups } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { copySlideAs, highestIdNumber } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-groups";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/**
 * Target quiz tree with the moved slides appended to its first group. Slide ids are unique only within a quiz, so a
 * slide whose id the target already uses gets a fresh one. Moved slides land as drafts: the target publishes them itself.
 */
export function appendMovedSlides(target: QuizEditorGroup[], slides: readonly QuizEditorSlide[]): QuizEditorGroup[] {
  const tree = target.length ? target : createEmptyQuizEditorGroups();
  const taken = new Set(tree.flatMap((group) => group.slides.map((slide) => slide.id)));
  let next = Math.max(1000, highestIdNumber(tree), highestIdNumber([{ ...tree[0], slides: [...slides] }]));
  const moved = slides.map((slide) => {
    const copy = taken.has(slide.id) ? copySlideAs(slide, `slide-${(next += 1)}`) : slide;
    taken.add(copy.id);
    return { ...copy, status: "draft" as const };
  });
  return tree.map((group, index) => (index === 0 ? { ...group, slides: [...group.slides, ...moved] } : group));
}
