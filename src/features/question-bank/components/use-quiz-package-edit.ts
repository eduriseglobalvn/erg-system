import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loadQuizEditorVersions, quizEditorDraftQueryOptions, usePublishQuizEditorDraftMutation, useSaveQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor";
import { useUpdateQuizBankMetaMutation } from "@/features/question-bank/api/question-bank-query";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import type { QuizPackageEditDraft } from "./question-bank-workspace-types";
import { applyQuizPackageDraft, readQuizPackageDraft } from "./quiz-package-draft";

/** "Cài đặt gói": opens on the quiz's saved draft and writes the changes back to it. */
export function useQuizPackageEdit(copy: QuestionBankCopy) {
  const queryClient = useQueryClient();
  const saveDraftMutation = useSaveQuizEditorDraftMutation();
  const updateMetaMutation = useUpdateQuizBankMetaMutation();
  const publishMutation = usePublishQuizEditorDraftMutation();
  const [quizPackageEdit, setQuizPackageEdit] = useState<QuizPackageEditDraft | null>(null);
  const [openingQuizId, setOpeningQuizId] = useState<string | null>(null);

  const openUpdateQuizPackage = async (quiz: QuizBankItem) => {
    setOpeningQuizId(quiz.id);
    try {
      // Fresh read: the save is rejected (409) when the docVersion is behind the server.
      const doc = await queryClient.fetchQuery({ ...quizEditorDraftQueryOptions(quiz.id), staleTime: 0 });
      // A publish does not touch the draft, so a draft newer than the last publish holds unfinished edits.
      const published = quiz.status === "ready" ? Math.max(0, ...(await loadQuizEditorVersions(quiz.id)).map((version) => Date.parse(version.publishedAt ?? "") || 0)) : 0;
      const unpublishedEdits = published > 0 && (Date.parse(doc.updatedAt ?? "") || 0) > published;
      setQuizPackageEdit({ quiz, doc, draft: readQuizPackageDraft(doc, quiz), unpublishedEdits });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadPackageError);
    } finally {
      setOpeningQuizId(null);
    }
  };

  // Save errors reach the global mutation toast (MutationCache.onError); the dialog stays open.
  const submitUpdateQuizPackage = async () => {
    if (!quizPackageEdit) return;
    const { doc, draft, quiz, unpublishedEdits } = quizPackageEdit;
    const title = draft.title.trim();
    if (!title) { toast.error(copy.quizTitleRequired); return; }
    try {
      const next = applyQuizPackageDraft(doc, quiz, draft);
      const saved = await saveDraftMutation.mutateAsync({ quizId: quiz.id, docVersion: doc.docVersion, ...next });
      // If the rename below fails, a retry must not reuse the docVersion this save used up (409).
      setQuizPackageEdit((current) => current && { ...current, doc: { ...doc, ...next, docVersion: saved.docVersion } });
      if (title !== quiz.title || draft.kind !== quiz.kind) await updateMetaMutation.mutateAsync({ quizId: quiz.id, title, kind: draft.kind });
      setQuizPackageEdit(null);
      if (quiz.status !== "ready") { toast.success(copy.updatePackageSuccess); return; }
      // Owner decision 18/11: work in progress in the draft never goes live with a settings change.
      if (unpublishedEdits) { toast.info(copy.updatePackageDraftOnly); return; }
      // Owner decision 17/11 (BUG-C-004): settings of a published quiz go live at once, as a new version.
      try {
        await publishMutation.mutateAsync({ quizId: quiz.id, docVersion: saved.docVersion, idempotencyKey: `quiz-package-publish:${quiz.id}:${saved.docVersion}` });
        toast.success(copy.updatePackageLive);
      } catch {
        toast.error(copy.updatePackageLiveFailed);
      }
    } catch {
      // Already reported by the global toast.
    }
  };

  return {
    openUpdateQuizPackage,
    openingQuizId,
    quizPackageEdit,
    savingQuizPackage: saveDraftMutation.isPending || updateMetaMutation.isPending || publishMutation.isPending,
    setQuizPackageEdit,
    submitUpdateQuizPackage,
  };
}
