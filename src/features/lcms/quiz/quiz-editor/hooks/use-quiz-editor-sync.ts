import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { quizEditorDraftQueryOptions, quizEditorQueryKeys } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { questionBankQueryKeys } from "@/features/question-bank/api/question-bank-query";
import { buildQuizCreateInput, useQuizEditorPublish } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-save-publish";
import type { useQuizEditorScope } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import type { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { createBlankDraft, NEW_QUIZ_PREFIX, newQuizDraftKey } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-initial-document";
import { classifySyncError } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-sync-engine";
import { useQuizDraftSync } from "@/features/lcms/quiz/quiz-editor/sync/use-quiz-draft-sync";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const blankDraft = () => createBlankDraft("", "local-new-quiz");

/** Autosave, server sync and publish for the quiz editor: what the workspace renders around the editor state. */
export function useQuizEditorSync({ quizId, scope, editor, questionSlides, selectedSlideId, questionEditorOpen, onQuizCreated, onPublished }: {
  quizId: string;
  scope: Pick<ReturnType<typeof useQuizEditorScope>, "questionBankQuery" | "questionBankSubjects" | "selectedCourseId" | "selectedLevelId" | "selectedTopicId">;
  editor: Pick<
    ReturnType<typeof useQuizEditorState>,
    "quizProject" | "playerTemplate" | "groups" | "hydrateDraftDocument" | "markAllAsSavedDraft" | "setSlidesPublished" | "updateQuizProject"
  >;
  questionSlides: QuizEditorSlide[];
  selectedSlideId: string | null;
  questionEditorOpen: boolean;
  onQuizCreated: (quizId: string) => void;
  onPublished: () => void;
}) {
  const { quizProject, playerTemplate, groups, hydrateDraftDocument, markAllAsSavedDraft, setSlidesPublished, updateQuizProject } = editor;
  const { questionBankSubjects, selectedCourseId, selectedLevelId, selectedTopicId } = scope;
  const queryClient = useQueryClient();
  const draftKey = quizId || newQuizDraftKey(selectedCourseId, selectedLevelId, selectedTopicId);

  // staleTime 0: a cached copy can predate this tab's own autosaves, so the engine only starts from a fresh fetch.
  const draftQuery = useQuery({ ...quizEditorDraftQueryOptions(quizId), staleTime: 0 });
  const { refetch } = draftQuery;
  const [retrying, setRetrying] = useState(false);
  // Offline the query pauses (or fails on the network): open from the device copy instead (spec §9).
  const serverUnreachable =
    draftQuery.fetchStatus === "paused" || (draftQuery.isError && classifySyncError(draftQuery.error) === "network");
  const serverDraftSettled =
    !retrying &&
    (quizId ? serverUnreachable || (draftQuery.isSuccess && draftQuery.isFetchedAfterMount) : !scope.questionBankQuery.isPending);

  // quizId/draftId/docVersion of the last hydrated document. Not the hook's live docVersion: it changes on every save,
  // and a changed document counts as an edit, so each save would schedule the next one.
  const [base, setBase] = useState<QuizEditorDraftDocument>(blankDraft);
  const hydrate = useCallback(
    (doc: QuizEditorDraftDocument) => {
      setBase(doc);
      hydrateDraftDocument(doc);
    },
    [hydrateDraftDocument],
  );
  // The engine reports ready right after hydrating: commit the document first, so it is the baseline and not an edit.
  const hydrateNow = useCallback((doc: QuizEditorDraftDocument) => flushSync(() => hydrate(doc)), [hydrate]);
  const document = useMemo(
    () => ({ ...base, settings: quizProject, playerTemplate, tree: groups }),
    [base, quizProject, playerTemplate, groups],
  );

  const sync = useQuizDraftSync({
    draftKey,
    serverDraft: serverUnreachable ? undefined : draftQuery.data,
    serverDraftSettled,
    document,
    hydrate: hydrateNow,
    buildCreateInput: (doc) =>
      buildQuizCreateInput({ doc, subjects: questionBankSubjects, courseId: selectedCourseId, levelId: selectedLevelId, topicId: selectedTopicId }),
    onQuizCreated: (createdId) => {
      // The engine creates the quiz itself, so refresh what the create mutation used to.
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root() });
      onQuizCreated(createdId);
    },
    onSynced: markAllAsSavedDraft,
  });

  // Nothing hydrates a new quiz, and the editor may still show the previous one: reset it while rendering the new key.
  const [shownKey, setShownKey] = useState<string | null>(null);
  if (shownKey !== draftKey) {
    setShownKey(draftKey);
    if (draftKey.startsWith(NEW_QUIZ_PREFIX)) hydrate(blankDraft());
  }

  // Send at once when moving to another question or closing its editor (spec §9.2).
  const { flushNow } = sync;
  useEffect(() => {
    void flushNow();
  }, [flushNow, selectedSlideId, questionEditorOpen]);

  // Settled goes false for one commit, so a failed start is retried even when nothing else changed. Not awaiting the
  // refetch: offline it stays paused until the network returns, and the error must come back meanwhile.
  useEffect(() => {
    if (!retrying) return;
    if (quizId) void refetch();
    const timer = setTimeout(() => setRetrying(false));
    return () => clearTimeout(timer);
  }, [retrying, quizId, refetch]);

  const publish = useQuizEditorPublish({
    sync,
    draftId: base.draftId,
    questionSlides,
    setSlidesPublished,
    updateQuizProject,
    onPublished,
  });
  return {
    sync,
    ...publish,
    loadFailed: !sync.ready && (sync.status.kind === "error" || (draftQuery.isError && !serverUnreachable)),
    retrying,
    retry: () => setRetrying(true),
  };
}
