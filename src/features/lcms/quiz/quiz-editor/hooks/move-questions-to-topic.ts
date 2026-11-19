import type { QueryClient } from "@tanstack/react-query";

import {
  createQuizEditorQuiz,
  loadQuizEditorDraft,
  saveQuizEditorDraft,
  type QuizEditorDraftDocument,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { quizEditorLevelQuizzesQueryOptions, quizEditorQueryKeys } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { createClientIdempotencyKey } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import { appendMovedSlides } from "@/features/lcms/quiz/quiz-editor/model/move-slides";
import { buildTopicRail } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { createBlankDraft } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-initial-document";
import { createQuizImageUploader, uploadInlineImages } from "@/features/lcms/quiz/quiz-editor/sync/upload-inline-images";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { questionBankQueryKeys } from "@/features/question-bank/api/question-bank-query";

export type MoveTarget = { subjectId: string; levelId: string; topicId: string; topicLabel: string };

/**
 * Saves the slides into the target topic's quiz (created when the topic has none yet). The caller removes them from
 * the open quiz only after this resolves, so a failed save never loses a question.
 */
export async function moveQuestionsToTopic(queryClient: QueryClient, target: MoveTarget, slides: readonly QuizEditorSlide[]) {
  const { subjectId, levelId, topicId, topicLabel } = target;
  const summaries = await queryClient.fetchQuery({ ...quizEditorLevelQuizzesQueryOptions({ subjectId, levelId }), staleTime: 0 });
  const quizId = buildTopicRail([{ id: topicId, label: topicLabel }], summaries, {})[0].quizId;

  let doc: QuizEditorDraftDocument;
  if (quizId) {
    doc = await loadQuizEditorDraft(quizId);
  } else {
    const created = await createQuizEditorQuiz({
      title: topicLabel,
      subtitle: topicLabel,
      kind: "train",
      subjectId,
      levelId,
      categoryId: topicId,
      questionIds: [],
      idempotencyKey: createClientIdempotencyKey("quiz-editor-create"),
    });
    doc = { ...createBlankDraft("", ""), settings: createNewQuizProjectSettings(topicLabel), quizId: created.quizId, draftId: created.draftId, docVersion: created.docVersion };
  }

  // Inline (not yet uploaded) images in the moved slides go up with the target quiz.
  const sent = await uploadInlineImages({ ...doc, tree: appendMovedSlides(doc.tree, slides) }, createQuizImageUploader());
  await saveQuizEditorDraft({
    quizId: sent.quizId,
    docVersion: sent.docVersion,
    settings: sent.settings,
    playerTemplate: sent.playerTemplate,
    tree: sent.tree,
    idempotencyKey: createClientIdempotencyKey("quiz-editor-move"),
  });
  void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
  void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(sent.quizId) });
  void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root() });
}
