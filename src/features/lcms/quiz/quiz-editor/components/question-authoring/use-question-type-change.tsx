import { toast } from "sonner";

import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type { QuestionType, QuizEditorSlide, QuizEditorSlideUpdate, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { convertSlideType } from "./convert-slide-type";
import { questionTypeLabel } from "./question-type-catalog";

type Args = {
  selectedSlide: QuizEditorSlide | null;
  selectedGroupId: string;
  quizProject: QuizProjectSettings;
  createId: (prefix: string) => string;
  replaceSelectedSlide: (update: QuizEditorSlideUpdate) => void;
  restoreSlide: (groupId: string, slide: QuizEditorSlide) => void;
};

/**
 * Changes the selected question's type at once (the slide keeps its identity). Answers that cannot carry over are
 * dropped, and a toast offers to undo that instead of asking first.
 */
export function useQuestionTypeChange({ selectedSlide, selectedGroupId, quizProject, createId, replaceSelectedSlide, restoreSlide }: Args) {
  return (type: QuestionType) => {
    if (!selectedSlide || type === selectedSlide.kind) return;
    const previous = selectedSlide;
    const converted = convertSlideType(previous, type, buildQuestionSlide(type, quizProject, createId));
    replaceSelectedSlide(converted.slide);
    if (!converted.dropsAnswers) return;
    toast(`Đã đổi sang ${questionTypeLabel(type)}, phần đáp án cũ đã bỏ.`, {
      action: { label: "Hoàn tác", onClick: () => restoreSlide(selectedGroupId, previous) },
    });
  };
}
