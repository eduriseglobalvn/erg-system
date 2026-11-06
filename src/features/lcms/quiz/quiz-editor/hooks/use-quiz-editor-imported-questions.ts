import { useEffect, useRef, useState } from "react";

import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

/** Imports questions handed over from the question bank once per distinct id set, once the draft is `ready`. */
export function useQuizEditorImportedQuestions({
  ready,
  pendingImportedQuestions,
  importQuestionBankQuestions,
  onImportedQuestionsHandled,
}: {
  /** Before the draft is ready an import would be overwritten by the opened draft, or never saved. */
  ready: boolean;
  pendingImportedQuestions: QuestionBankQuestion[];
  importQuestionBankQuestions: (questions: QuestionBankQuestion[]) => void;
  onImportedQuestionsHandled?: () => void;
}) {
  const [importNoticeCount, setImportNoticeCount] = useState(0);
  const importedSignatureRef = useRef("");
  const pendingImportSignature = pendingImportedQuestions.map((question) => question.id).join("|");

  useEffect(() => {
    if (!ready || !pendingImportedQuestions.length) {
      return;
    }

    if (pendingImportSignature === importedSignatureRef.current) {
      return;
    }

    importedSignatureRef.current = pendingImportSignature;
    importQuestionBankQuestions(pendingImportedQuestions);
    setImportNoticeCount(pendingImportedQuestions.length);
    onImportedQuestionsHandled?.();
  }, [ready, importQuestionBankQuestions, onImportedQuestionsHandled, pendingImportSignature, pendingImportedQuestions]);

  return importNoticeCount;
}
