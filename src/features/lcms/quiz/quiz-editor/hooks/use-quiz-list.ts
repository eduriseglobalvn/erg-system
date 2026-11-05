import { useMemo, useState } from "react";

import type { QuestionListRow } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table-row";
import { useLevelTopicQuizzes } from "@/features/lcms/quiz/quiz-editor/hooks/use-level-topic-quizzes";
import type { useQuizEditorScope } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { isQuestionType, type QuizEditorGroup, type QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** A slide counts as on the server unless it is new since the last save, or the quiz itself was never saved. */
function isOnServer(status: QuestionListRow["slide"]["status"], quizSaved: boolean) {
  return status !== "unsaved" && (Boolean(status) || quizSaved);
}

/** Topic rail and question table of the list screen: which rows show, and what a click opens. */
export function useQuizList({ scope, quizId, groups, quizProject, selectSlide, openQuiz, openEditor }: {
  scope: Pick<ReturnType<typeof useQuizEditorScope>, "selectedCourseId" | "selectedLevelId" | "selectedTopicId" | "levelTopics" | "handleTopicChange">;
  quizId: string;
  groups: QuizEditorGroup[];
  quizProject: QuizProjectSettings;
  selectSlide: (groupId: string, slideId: string) => void;
  openQuiz: (quizId: string) => void;
  openEditor: () => void;
}) {
  const { selectedTopicId, handleTopicChange } = scope;
  const liveSlides = useMemo(() => groups.flatMap((group) => group.slides), [groups]);
  const { rows: topics } = useLevelTopicQuizzes({
    subjectId: scope.selectedCourseId,
    levelId: scope.selectedLevelId ?? "",
    topics: scope.levelTopics,
    openQuiz: quizId ? { quizId, settings: quizProject, slides: liveSlides } : null,
  });
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;

  const rows = useMemo<QuestionListRow[]>(() => {
    if (selectedTopicId === "all") {
      return topics.flatMap((topic) => topic.slides.map((slide, index) => ({ slide, number: index + 1, groupId: null, topic, onServer: isOnServer(slide.status, true) })));
    }
    const questions = groups.flatMap((group) => group.slides.filter((slide) => isQuestionType(slide.kind)).map((slide) => ({ slide, groupId: group.id })));
    return questions.map(({ slide, groupId }, index) => ({ slide, number: index + 1, groupId, topic: null, onServer: isOnServer(slide.status, Boolean(quizId)) }));
  }, [selectedTopicId, topics, groups, quizId]);

  // A "Tất cả" row belongs to another quiz: open the editor once that quiz's draft has loaded (adjusted while rendering).
  const [pendingSlideId, setPendingSlideId] = useState<string | null>(null);
  const pendingGroup = pendingSlideId ? groups.find((item) => item.slides.some((slide) => slide.id === pendingSlideId)) : undefined;
  if (pendingSlideId && pendingGroup) {
    setPendingSlideId(null);
    selectSlide(pendingGroup.id, pendingSlideId);
    openEditor();
  }

  function selectTopic(topic: TopicRow | null) {
    setPendingSlideId(null);
    handleTopicChange(topic?.id ?? "all");
    // No quiz yet: the topic gets a new one, created on its first save.
    if (topic?.quizId) openQuiz(topic.quizId);
  }

  function openRow(row: QuestionListRow) {
    if (row.groupId) {
      selectSlide(row.groupId, row.slide.id);
      openEditor();
      return;
    }
    if (!row.topic) return;
    selectTopic(row.topic);
    setPendingSlideId(row.slide.id);
  }

  return { topics, rows, topicLabel: selectedTopicId === "all" ? null : (selectedTopic?.label ?? ""), selectTopic, openRow };
}
