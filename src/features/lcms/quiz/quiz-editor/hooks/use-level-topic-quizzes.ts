import { useQueries, useQuery } from "@tanstack/react-query";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { quizEditorDraftQueryOptions, quizEditorWorkspaceQueryOptions } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { buildTopicRail } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";

/** The Level's topics, each joined to its quiz and that quiz's draft, for the topic rail. */
export function useLevelTopicQuizzes(scope: { subjectId: string; levelId: string; topics: { id: string; label: string }[] }) {
  const { subjectId, levelId, topics } = scope;
  const workspace = useQuery({ ...quizEditorWorkspaceQueryOptions({ subjectId, levelId, size: 50 }), enabled: Boolean(subjectId && levelId) });
  const summaries = workspace.data?.quizzes.items ?? [];
  // Only the quizzes a topic actually shows need their draft.
  const quizIds = buildTopicRail(topics, summaries, {}).flatMap((row) => (row.quizId ? [row.quizId] : []));
  const draftQueries = useQueries({ queries: quizIds.map((quizId) => quizEditorDraftQueryOptions(quizId)) });
  const drafts: Record<string, QuizEditorDraftDocument | undefined> = {};
  quizIds.forEach((quizId, index) => {
    drafts[quizId] = draftQueries[index]?.data;
  });
  return {
    rows: buildTopicRail(topics, summaries, drafts),
    isLoading: workspace.isLoading || draftQueries.some((query) => query.isLoading),
  };
}
