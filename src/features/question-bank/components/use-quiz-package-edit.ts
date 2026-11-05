import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { quizEditorDraftQueryOptions, useSaveQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor";
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
  const [quizPackageEdit, setQuizPackageEdit] = useState<QuizPackageEditDraft | null>(null);
  const [openingQuizId, setOpeningQuizId] = useState<string | null>(null);

  const openUpdateQuizPackage = async (quiz: QuizBankItem) => {
    setOpeningQuizId(quiz.id);
    try {
      // Fresh read: the save is rejected (409) when the docVersion is behind the server.
      const doc = await queryClient.fetchQuery({ ...quizEditorDraftQueryOptions(quiz.id), staleTime: 0 });
      setQuizPackageEdit({ quiz, doc, draft: readQuizPackageDraft(doc, quiz) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadPackageError);
    } finally {
      setOpeningQuizId(null);
    }
  };

  // Save errors reach the global mutation toast (MutationCache.onError); the dialog stays open.
  const submitUpdateQuizPackage = async () => {
    if (!quizPackageEdit) return;
    const { doc, draft, quiz } = quizPackageEdit;
    const title = draft.title.trim();
    if (!title) { toast.error(copy.quizTitleRequired); return; }
    try {
      const next = applyQuizPackageDraft(doc, quiz, draft);
      const saved = await saveDraftMutation.mutateAsync({ quizId: quiz.id, docVersion: doc.docVersion, ...next });
      // If the rename below fails, a retry must not reuse the docVersion this save used up (409).
      setQuizPackageEdit((current) => current && { ...current, doc: { ...doc, ...next, docVersion: saved.docVersion } });
      if (title !== quiz.title || draft.kind !== quiz.kind) await updateMetaMutation.mutateAsync({ quizId: quiz.id, title, kind: draft.kind });
      toast.success(copy.updatePackageSuccess);
      setQuizPackageEdit(null);
    } catch {
      // Already reported by the global toast.
    }
  };

  return {
    openUpdateQuizPackage,
    openingQuizId,
    quizPackageEdit,
    savingQuizPackage: saveDraftMutation.isPending || updateMetaMutation.isPending,
    setQuizPackageEdit,
    submitUpdateQuizPackage,
  };
}
