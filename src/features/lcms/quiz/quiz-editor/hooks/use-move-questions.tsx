import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { MoveQuestionsDialog } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/move-questions-dialog";
import { moveQuestionsToTopic, type MoveTarget } from "@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic";
import type { QuizEditorGroup } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";

/** "Chuyển sang…": save the questions into the target topic's quiz first, and only then drop them from this one. */
export function useMoveQuestions({ subject, levelId, topicId, groups, removeSlides }: {
  subject: QuestionBankSubject | undefined;
  levelId: string | null;
  topicId: string;
  groups: QuizEditorGroup[];
  removeSlides: (slideIds: readonly string[]) => void;
}) {
  const queryClient = useQueryClient();
  const [slideIds, setSlideIds] = useState<string[] | null>(null);

  /** Resolves true once the questions are in the target topic and gone from the open quiz. */
  async function moveTo(ids: readonly string[], target: MoveTarget) {
    const slides = groups.flatMap((group) => group.slides).filter((slide) => ids.includes(slide.id));
    try {
      await moveQuestionsToTopic(queryClient, target, slides);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Chưa chuyển được câu hỏi. Các câu vẫn ở chủ đề cũ.");
      return false;
    }
    removeSlides(slides.map((slide) => slide.id));
    toast.success(`Đã chuyển ${slides.length} câu sang “${target.topicLabel}”.`);
    return true;
  }

  const dialog = subject && slideIds ? (
    <MoveQuestionsDialog
      count={slideIds.length}
      currentLevelId={levelId}
      currentTopicId={topicId}
      onClose={() => setSlideIds(null)}
      onConfirm={async (target) => {
        if (await moveTo(slideIds, target)) setSlideIds(null);
      }}
      subject={subject}
    />
  ) : null;

  return { openMove: subject ? setSlideIds : undefined, moveTo, dialog };
}
