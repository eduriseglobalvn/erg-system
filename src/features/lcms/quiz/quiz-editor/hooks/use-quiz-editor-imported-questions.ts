import { useEffect, useRef, useState } from "react";

import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

/** Imports questions handed over from the question bank once per distinct id set. */
export function useQuizEditorImportedQuestions({
  pendingImportedQuestions,
  importQuestionBankQuestions,
  onImportedQuestionsHandled,
}: {
  pendingImportedQuestions: QuestionBankQuestion[];
  importQuestionBankQuestions: (questions: QuestionBankQuestion[]) => void;
  onImportedQuestionsHandled?: () => void;
}) {
  const [importNoticeCount, setImportNoticeCount] = useState(0);
  const importedSignatureRef = useRef("");
  const pendingImportSignature = pendingImportedQuestions.map((question) => question.id).join("|");

  useEffect(() => {
    if (!pendingImportedQuestions.length) {
      return;
    }

    if (pendingImportSignature === importedSignatureRef.current) {
      return;
    }

    importedSignatureRef.current = pendingImportSignature;
    importQuestionBankQuestions(pendingImportedQuestions);
    setImportNoticeCount(pendingImportedQuestions.length);
    onImportedQuestionsHandled?.();
  }, [importQuestionBankQuestions, onImportedQuestionsHandled, pendingImportSignature, pendingImportedQuestions]);

  return importNoticeCount;
}
