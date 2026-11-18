import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuizCreateDraft } from "./quiz-create-package-dialog";
import type {
  QuestionBankQuestion,
  QuizBankItem,
  QuizBankKind,
} from "@/features/question-bank/types/question-bank-types";

export type QuizKindFilter = "all" | QuizBankKind;

export type QuestionFormMode = "create" | "edit";

export type QuestionFormDraft = {
  /** The question as the quiz editor card authors it; null until a type is picked. */
  slide: QuizEditorSlide | null;
  objective: string;
  difficulty: QuestionBankQuestion["difficulty"];
  status: QuestionBankQuestion["status"];
  tagsText: string;
};

export type QuizPackageEditDraft = {
  /** The saved draft the dialog was opened from; its docVersion guards the save. */
  doc: QuizEditorDraftDocument;
  draft: QuizCreateDraft;
  quiz: QuizBankItem;
  /** The draft was changed after the last publish: saving the settings must not publish that unfinished work. */
  unpublishedEdits?: boolean;
};
