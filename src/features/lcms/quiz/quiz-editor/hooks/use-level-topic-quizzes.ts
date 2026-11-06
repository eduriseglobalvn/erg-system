import { useQueries, useQuery } from "@tanstack/react-query";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { quizEditorDraftQueryOptions, quizEditorLevelQuizzesQueryOptions } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { buildTopicRail, type OpenQuiz } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";

/** The Level's topics, each joined to its quiz and that quiz's draft, for the topic rail. */
export function useLevelTopicQuizzes(scope: {
  subjectId: string;
  levelId: string;
  topics: { id: string; label: string }[];
  openQuiz?: OpenQuiz | null;
}) {
  const { subjectId, levelId, topics, openQuiz = null } = scope;
  const workspace = useQuery({ ...quizEditorLevelQuizzesQueryOptions({ subjectId, levelId }), enabled: Boolean(subjectId && levelId) });
  const summaries = workspace.data ?? [];
  // Only the quizzes a topic actually shows need their draft.
  const quizIds = buildTopicRail(topics, summaries, {}).flatMap((row) => (row.quizId ? [row.quizId] : []));
  const draftQueries = useQueries({ queries: quizIds.map((quizId) => quizEditorDraftQueryOptions(quizId)) });
  const drafts: Record<string, QuizEditorDraftDocument | undefined> = {};
  quizIds.forEach((quizId, index) => {
    drafts[quizId] = draftQueries[index]?.data;
  });
  return {
    rows: buildTopicRail(topics, summaries, drafts, openQuiz),
    summaries,
    // Pending, not loading: offline the query pauses, and a topic must still not pass for one without a quiz.
    // A failed list with nothing cached is just as unknown.
    quizzesPending: workspace.isPending || (workspace.isError && !workspace.data),
  };
}
