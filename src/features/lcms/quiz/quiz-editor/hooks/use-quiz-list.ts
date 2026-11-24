import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { quizEditorDraftQueryOptions } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuestionListRow } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table-row";
import { useLevelTopicQuizzes } from "@/features/lcms/quiz/quiz-editor/hooks/use-level-topic-quizzes";
import type { useQuizEditorScope } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import { unassignedQuizId, type TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { isQuestionType, type QuizEditorGroup, type QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** In the open quiz a slide counts as on the server unless it is new since the last save, or the quiz itself was never saved. */
function isOnServer(status: QuestionListRow["slide"]["status"], quizSaved: boolean) {
  return status !== "unsaved" && (Boolean(status) || quizSaved);
}

/** Topic rail and question table of the list screen: which rows show, and what a click opens. */
export function useQuizList({ scope, quizId, ready, groups, quizProject, selectSlide, openQuiz, openEditor }: {
  scope: Pick<ReturnType<typeof useQuizEditorScope>, "selectedCourseId" | "selectedLevelId" | "selectedTopicId" | "levelTopics" | "handleTopicChange">;
  quizId: string;
  /** False while the open quiz is switching: `groups` still hold the previous quiz. */
  ready: boolean;
  groups: QuizEditorGroup[];
  quizProject: QuizProjectSettings;
  selectSlide: (groupId: string, slideId: string) => void;
  openQuiz: (quizId: string) => void;
  openEditor: () => void;
}) {
  const { selectedTopicId, handleTopicChange } = scope;
  const queryClient = useQueryClient();
  // "Tất cả" lists every topic; the open quiz there is the Level's topicless one (scope sync moves a topic quiz to its topic).
  const viewAll = selectedTopicId === "all";
  const liveSlides = useMemo(() => groups.flatMap((group) => group.slides), [groups]);
  const { rows: topics, summaries, quizzesPending } = useLevelTopicQuizzes({
    subjectId: scope.selectedCourseId,
    levelId: scope.selectedLevelId ?? "",
    topics: scope.levelTopics,
    openQuiz: quizId && ready ? { quizId, topicId: selectedTopicId, settings: quizProject, slides: liveSlides } : null,
  });
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const looseQuizId = unassignedQuizId(summaries);

  // Open the topicless quiz in "Tất cả", so a question added there joins it instead of starting another quiz.
  useEffect(() => {
    if (viewAll && !quizId && looseQuizId) openQuiz(looseQuizId);
  }, [viewAll, quizId, looseQuizId, openQuiz]);

  const rows = useMemo<QuestionListRow[]>(() => {
    // While the open quiz switches, `groups` still hold the previous one.
    const live = quizId && !ready ? [] : groups.flatMap((group) =>
      group.slides.filter((slide) => isQuestionType(slide.kind)).map((slide) => ({ slide, groupId: group.id, topic: null, onServer: isOnServer(slide.status, Boolean(quizId)) })),
    );
    // In "Tất cả" the open quiz's questions (no topic yet) come first, then every topic's.
    const others = viewAll
      ? topics.filter((topic) => topic.quizId !== quizId).flatMap((topic) => topic.slides.map((slide) => ({ slide, groupId: null, topic, onServer: true })))
      : [];
    return [...live, ...others].map((row, index) => ({ ...row, number: index + 1 }));
  }, [viewAll, topics, groups, quizId, ready]);

  // A "Tất cả" row belongs to another quiz: open the editor once that quiz's draft has loaded (adjusted while rendering).
  // Slide ids are unique only within a quiz, so wait for that very quiz.
  const [pending, setPending] = useState<{ quizId: string; slideId: string } | null>(null);
  const pendingGroup =
    pending && ready && pending.quizId === quizId ? groups.find((item) => item.slides.some((slide) => slide.id === pending.slideId)) : undefined;
  if (pending && pendingGroup) {
    setPending(null);
    selectSlide(pendingGroup.id, pending.slideId);
    openEditor();
  }

  function selectTopic(topic: TopicRow | null) {
    setPending(null);
    // The rail reads the quizzes left behind from this cache; autosave never touches it.
    if (quizId && ready) queryClient.setQueryData<QuizEditorDraftDocument>(quizEditorDraftQueryOptions(quizId).queryKey, (old) => old && { ...old, settings: quizProject, tree: groups });
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
    if (!row.topic?.quizId) return;
    selectTopic(row.topic);
    setPending({ quizId: row.topic.quizId, slideId: row.slide.id });
  }

  // The try-run starts in the quiz's own mode, by the runtime's rule (settings.mode, else kind); a new quiz is "train".
  const mode = (quizProject.settings as { mode?: unknown }).mode;
  const quizKind = typeof mode === "string" ? mode : (summaries.find((summary) => summary.id === quizId)?.kind ?? "train");

  return { topics, topicsLoading: quizzesPending, quizKind, rows, topicLabel: viewAll ? null : (selectedTopic?.label ?? quizProject.info.title), selectTopic, openRow };
}
