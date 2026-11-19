import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { MoveQuestionsDialog } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/move-questions-dialog";
import { moveQuestionsToTopic } from "@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic";
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

  const dialog = subject && slideIds ? (
    <MoveQuestionsDialog
      count={slideIds.length}
      currentLevelId={levelId}
      currentTopicId={topicId}
      onClose={() => setSlideIds(null)}
      onConfirm={async (target) => {
        const slides = groups.flatMap((group) => group.slides).filter((slide) => slideIds.includes(slide.id));
        try {
          await moveQuestionsToTopic(queryClient, target, slides);
        } catch (error) {
          toast.error(error instanceof Error && error.message ? error.message : "Chưa chuyển được câu hỏi. Các câu vẫn ở chủ đề cũ.");
          return;
        }
        removeSlides(slides.map((slide) => slide.id));
        setSlideIds(null);
        toast.success(`Đã chuyển ${slides.length} câu sang “${target.topicLabel}”.`);
      }}
      subject={subject}
    />
  ) : null;

  return { openMove: subject ? setSlideIds : undefined, dialog };
}
