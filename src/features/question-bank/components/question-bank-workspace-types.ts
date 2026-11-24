import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor";
import type { QuizCreateDraft } from "./quiz-create-package-dialog";
import type { QuizBankItem, QuizBankKind } from "@/features/question-bank/types/question-bank-types";

export type QuizKindFilter = "all" | QuizBankKind;

export type QuizPackageEditDraft = {
  /** The saved draft the dialog was opened from; its docVersion guards the save. */
  doc: QuizEditorDraftDocument;
  draft: QuizCreateDraft;
  quiz: QuizBankItem;
  /** The draft was changed after the last publish: saving the settings must not publish that unfinished work. */
  unpublishedEdits?: boolean;
};
